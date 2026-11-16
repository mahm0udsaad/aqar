import "server-only"
import { query } from "./pool"

/**
 * Server-only, Supabase-compatible query builder backed by `pg`.
 *
 * It mirrors the subset of the supabase-js API this codebase uses
 * (`from().select().eq()...`, embeds like `categories (*)`, `.single()`, inserts,
 * upserts, `.rpc()`), so existing server code keeps working after leaving Supabase.
 *
 * Security: this module must never be reachable from the browser. It imports
 * "server-only", every identifier is validated, and every value is a bound parameter.
 */

export type DbError = { message: string; code?: string; details?: string; hint?: string }
export type DbResult<T = any> = { data: T; error: DbError | null; count?: number | null }

type Relation =
  // this.fk -> other.id (many-to-one, returns object|null)
  | { kind: "parent"; table: string; fk: string }
  // other.fk -> this.id (one-to-many, returns array, or object when single)
  | { kind: "child"; table: string; fk: string; single?: boolean }

const RELATIONS: Record<string, Record<string, Relation>> = {
  properties: {
    categories: { kind: "parent", table: "categories", fk: "category_id" },
    areas: { kind: "parent", table: "areas", fk: "area_id" },
    property_images: { kind: "child", table: "property_images", fk: "property_id" },
    property_videos: { kind: "child", table: "property_videos", fk: "property_id" },
    property_ratings: { kind: "child", table: "property_ratings", fk: "property_id", single: true },
    loved_properties: { kind: "child", table: "loved_properties", fk: "property_id" },
  },
  categories: {
    properties: { kind: "child", table: "properties", fk: "category_id" },
  },
  areas: {
    properties: { kind: "child", table: "properties", fk: "area_id" },
    area_ratings: { kind: "child", table: "area_ratings", fk: "area_id" },
    area_ratings_summary: { kind: "child", table: "area_ratings_summary", fk: "area_id", single: true },
  },
  loved_properties: {
    properties: { kind: "parent", table: "properties", fk: "property_id" },
  },
  property_images: { properties: { kind: "parent", table: "properties", fk: "property_id" } },
  property_videos: { properties: { kind: "parent", table: "properties", fk: "property_id" } },
  property_ratings: { properties: { kind: "parent", table: "properties", fk: "property_id" } },
  area_ratings: { areas: { kind: "parent", table: "areas", fk: "area_id" } },
  area_ratings_summary: { areas: { kind: "parent", table: "areas", fk: "area_id" } },
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/

function ident(name: string): string {
  const n = name.trim()
  if (!IDENT.test(n)) throw new Error(`db: invalid identifier "${name}"`)
  return `"${n}"`
}

// ---------- select parsing ----------

type SelectNode = { cols: string[]; embeds: Embed[] }
type Embed = { name: string; inner: boolean; node: SelectNode }

function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of s) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(cur)
      cur = ""
    } else cur += ch
  }
  parts.push(cur)
  return parts.map((p) => p.trim()).filter(Boolean)
}

function parseSelect(spec: string): SelectNode {
  const node: SelectNode = { cols: [], embeds: [] }
  for (const part of splitTopLevel((spec || "*").replace(/\s+/g, " "))) {
    const m = part.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(!inner)?\s*\(([\s\S]*)\)$/)
    if (m) node.embeds.push({ name: m[1], inner: !!m[2], node: parseSelect(m[3].trim() || "*") })
    else node.cols.push(part)
  }
  if (node.cols.length === 0 && node.embeds.length === 0) node.cols.push("*")
  return node
}

// ---------- filters ----------

type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is" | "contains"
type Filter =
  | { op: FilterOp; col: string; val: unknown }
  | { op: "not"; col: string; inner: FilterOp; val: unknown }
  | { op: "or"; conds: Filter[] }

const OPS: Record<string, FilterOp> = {
  eq: "eq", neq: "neq", gt: "gt", gte: "gte", lt: "lt", lte: "lte",
  like: "like", ilike: "ilike", in: "in", is: "is", cs: "contains", contains: "contains",
}

function parseOrString(expr: string): Filter[] {
  // Supports the PostgREST form "col.op.value,col.op.value" for constant expressions.
  // Do not build this string from user input: use orFilters() instead.
  return expr.split(/,(?=[A-Za-z_][A-Za-z0-9_]*\.[a-z]+\.)/).map((raw) => {
    const m = raw.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\.([a-z]+)\.([\s\S]*)$/)
    if (!m || !OPS[m[2]]) throw new Error(`db: unsupported or() condition "${raw}"`)
    let val: unknown = m[3]
    if (val === "null") val = null
    else if (val === "true") val = true
    else if (val === "false") val = false
    return { op: OPS[m[2]], col: m[1], val }
  })
}

function colRef(alias: string, col: string) {
  return `${alias}.${ident(col)}`
}

function compileFilter(f: Filter, alias: string, params: unknown[]): string {
  const p = (v: unknown) => {
    params.push(v)
    return `$${params.length}`
  }
  if (f.op === "or") {
    if (f.conds.length === 0) return "TRUE"
    return `(${f.conds.map((c) => compileFilter(c, alias, params)).join(" OR ")})`
  }
  if (f.op === "not") {
    return `NOT (${compileFilter({ op: f.inner, col: f.col, val: f.val }, alias, params)})`
  }
  const c = colRef(alias, f.col)
  switch (f.op) {
    case "eq":
      return f.val === null ? `${c} IS NULL` : `${c} = ${p(f.val)}`
    case "neq":
      return f.val === null ? `${c} IS NOT NULL` : `${c} <> ${p(f.val)}`
    case "gt":
      return `${c} > ${p(f.val)}`
    case "gte":
      return `${c} >= ${p(f.val)}`
    case "lt":
      return `${c} < ${p(f.val)}`
    case "lte":
      return `${c} <= ${p(f.val)}`
    case "like":
      return `${c} LIKE ${p(f.val)}`
    case "ilike":
      return `${c} ILIKE ${p(f.val)}`
    case "in": {
      const arr = Array.isArray(f.val) ? f.val : [f.val]
      if (arr.length === 0) return "FALSE"
      return `${c} = ANY(${p(arr)})`
    }
    case "is":
      if (f.val === null) return `${c} IS NULL`
      if (f.val === true) return `${c} IS TRUE`
      if (f.val === false) return `${c} IS FALSE`
      throw new Error("db: is() only accepts null, true or false")
    case "contains":
      return `${c} @> ${p(f.val)}`
  }
}

/** Escape LIKE wildcards in user input before wrapping it in %...%. */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`)
}

// ---------- builder ----------

type Mode = "select" | "insert" | "update" | "upsert" | "delete"

let aliasCounter = 0
const nextAlias = () => `e${++aliasCounter % 1_000_000}`

export class QueryBuilder<T = any> implements PromiseLike<DbResult<T>> {
  private mode: Mode = "select"
  private selectSpec: SelectNode = parseSelect("*")
  private returning: SelectNode | null = null
  private filters: Filter[] = []
  private embedFilters: Record<string, Filter[]> = {}
  private orders: { col: string; asc: boolean; nullsFirst?: boolean }[] = []
  private limitN?: number
  private offsetN?: number
  private result: "many" | "single" | "maybeSingle" = "many"
  private payload: any
  private onConflict?: string
  private ignoreDuplicates = false
  private countMode: "exact" | null = null
  private headOnly = false

  constructor(private readonly table: string) {
    ident(table)
  }

  select(columns = "*", opts?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.mode === "select") {
      this.selectSpec = parseSelect(columns)
      if (opts?.count) this.countMode = "exact"
      if (opts?.head) this.headOnly = true
    } else {
      this.returning = parseSelect(columns)
    }
    return this
  }

  insert(values: any) {
    this.mode = "insert"
    this.payload = values
    return this
  }

  update(values: any) {
    this.mode = "update"
    this.payload = values
    return this
  }

  upsert(values: any, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.mode = "upsert"
    this.payload = values
    this.onConflict = opts?.onConflict
    this.ignoreDuplicates = !!opts?.ignoreDuplicates
    return this
  }

  delete() {
    this.mode = "delete"
    return this
  }

  private add(op: FilterOp, col: string, val: unknown) {
    const dot = col.indexOf(".")
    if (dot > 0) {
      const embed = col.slice(0, dot)
      ;(this.embedFilters[embed] ??= []).push({ op, col: col.slice(dot + 1), val })
    } else {
      this.filters.push({ op, col, val })
    }
    return this
  }

  eq(col: string, val: unknown) { return this.add("eq", col, val) }
  neq(col: string, val: unknown) { return this.add("neq", col, val) }
  gt(col: string, val: unknown) { return this.add("gt", col, val) }
  gte(col: string, val: unknown) { return this.add("gte", col, val) }
  lt(col: string, val: unknown) { return this.add("lt", col, val) }
  lte(col: string, val: unknown) { return this.add("lte", col, val) }
  like(col: string, val: string) { return this.add("like", col, val) }
  ilike(col: string, val: string) { return this.add("ilike", col, val) }
  in(col: string, vals: unknown[]) { return this.add("in", col, vals) }
  is(col: string, val: null | boolean) { return this.add("is", col, val) }
  contains(col: string, val: unknown) { return this.add("contains", col, val) }

  match(obj: Record<string, unknown>) {
    for (const [k, v] of Object.entries(obj)) this.eq(k, v)
    return this
  }

  not(col: string, op: string, val: unknown) {
    const inner = OPS[op]
    if (!inner) throw new Error(`db: unsupported not() operator "${op}"`)
    this.filters.push({ op: "not", col, inner, val })
    return this
  }

  /** PostgREST-style constant OR string, e.g. "is_featured.eq.true,is_new.eq.true". */
  or(expr: string) {
    this.filters.push({ op: "or", conds: parseOrString(expr) })
    return this
  }

  /** Safe OR for user-provided values. */
  orFilters(conds: { col: string; op: FilterOp; val: unknown }[]) {
    this.filters.push({ op: "or", conds: conds.map((c) => ({ op: c.op, col: c.col, val: c.val })) })
    return this
  }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    ident(col)
    this.orders.push({ col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst })
    return this
  }

  limit(n: number) {
    this.limitN = Math.max(0, Math.floor(Number(n)))
    return this
  }

  range(from: number, to: number) {
    this.offsetN = Math.max(0, Math.floor(Number(from)))
    this.limitN = Math.max(0, Math.floor(Number(to)) - this.offsetN + 1)
    return this
  }

  single(): PromiseLike<DbResult<any>> {
    this.result = "single"
    return this
  }

  maybeSingle(): PromiseLike<DbResult<any>> {
    this.result = "maybeSingle"
    return this
  }

  then<R1 = DbResult<T>, R2 = never>(
    onfulfilled?: ((value: DbResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled as any, onrejected as any)
  }

  // ----- SQL generation -----

  private selectList(table: string, alias: string, node: SelectNode, params: unknown[], embedPath = ""): string[] {
    const out: string[] = []
    for (const col of node.cols) {
      if (col === "*") out.push(`${alias}.*`)
      else {
        const m = col.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)$/)
        if (m) out.push(`${colRef(alias, m[2])} AS ${ident(m[1])}`)
        else out.push(colRef(alias, col))
      }
    }
    for (const e of node.embeds) {
      const rel = RELATIONS[table]?.[e.name]
      if (!rel) throw new Error(`db: unknown relation ${table}.${e.name}`)
      const a = nextAlias()
      const inner = this.selectList(rel.table, a, e.node, params, embedPath ? `${embedPath}.${e.name}` : e.name).join(", ")
      const join =
        rel.kind === "parent" ? `${a}."id" = ${colRef(alias, rel.fk)}` : `${colRef(a, rel.fk)} = ${alias}."id"`
      const extra = (embedPath ? [] : this.embedFilters[e.name] || []).map((f) => compileFilter(f, a, params))
      const where = [join, ...extra].join(" AND ")
      const from = `FROM ${ident(rel.table)} ${a} WHERE ${where}`
      if (rel.kind === "parent" || rel.single) {
        out.push(`(SELECT to_jsonb(_s) FROM (SELECT ${inner} ${from} LIMIT 1) _s) AS ${ident(e.name)}`)
      } else {
        out.push(`COALESCE((SELECT jsonb_agg(_s) FROM (SELECT ${inner} ${from}) _s), '[]'::jsonb) AS ${ident(e.name)}`)
      }
    }
    return out
  }

  private whereClause(alias: string, params: unknown[]): string {
    const parts = this.filters.map((f) => compileFilter(f, alias, params))
    // !inner embeds restrict parent rows to those having a matching embedded row
    for (const e of this.selectSpec.embeds) {
      if (!e.inner) continue
      const rel = RELATIONS[this.table]?.[e.name]
      if (!rel) throw new Error(`db: unknown relation ${this.table}.${e.name}`)
      const a = nextAlias()
      const join =
        rel.kind === "parent" ? `${a}."id" = ${colRef(alias, rel.fk)}` : `${colRef(a, rel.fk)} = ${alias}."id"`
      const extra = (this.embedFilters[e.name] || []).map((f) => compileFilter(f, a, params))
      parts.push(`EXISTS (SELECT 1 FROM ${ident(rel.table)} ${a} WHERE ${[join, ...extra].join(" AND ")})`)
    }
    return parts.length ? ` WHERE ${parts.join(" AND ")}` : ""
  }

  private orderClause(alias: string) {
    if (!this.orders.length) return ""
    return (
      " ORDER BY " +
      this.orders
        .map((o) => {
          let s = `${colRef(alias, o.col)} ${o.asc ? "ASC" : "DESC"}`
          if (o.nullsFirst !== undefined) s += o.nullsFirst ? " NULLS FIRST" : " NULLS LAST"
          return s
        })
        .join(", ")
    )
  }

  private limitClause(params: unknown[]) {
    let s = ""
    if (this.limitN !== undefined) {
      params.push(this.limitN)
      s += ` LIMIT $${params.length}`
    }
    if (this.offsetN !== undefined) {
      params.push(this.offsetN)
      s += ` OFFSET $${params.length}`
    }
    return s
  }

  private returningClause(params: unknown[]) {
    if (!this.returning) return ""
    return ` RETURNING ${this.selectList(this.table, ident(this.table), { cols: this.returning.cols, embeds: [] }, params).join(", ")}`
  }

  private rowsAndColumns(params: unknown[]) {
    const rows: Record<string, unknown>[] = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r) =>
      Object.fromEntries(Object.entries(r ?? {}).filter(([, v]) => v !== undefined)),
    )
    const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
    cols.forEach(ident)
    const values = rows.map(
      (r) =>
        `(${cols
          .map((c) => {
            if (!(c in r)) return "DEFAULT"
            params.push(r[c])
            return `$${params.length}`
          })
          .join(", ")})`,
    )
    return { rows, cols, values }
  }

  private build(): { sql: string; params: unknown[]; countSql?: string; countParams?: unknown[] } {
    const params: unknown[] = []
    const t = ident(this.table)
    switch (this.mode) {
      case "select": {
        const alias = "t0"
        const list = this.selectList(this.table, alias, this.selectSpec, params).join(", ")
        const where = this.whereClause(alias, params)
        let countSql: string | undefined
        let countParams: unknown[] | undefined
        if (this.countMode) {
          countParams = []
          countSql = `SELECT count(*)::int AS count FROM ${t} ${alias}${this.whereClause(alias, countParams)}`
        }
        const sql = `SELECT ${list} FROM ${t} ${alias}${where}${this.orderClause(alias)}${this.limitClause(params)}`
        return { sql, params, countSql, countParams }
      }
      case "insert": {
        const { cols, values } = this.rowsAndColumns(params)
        if (!values.length) throw new Error("db: insert() with no rows")
        const colSql = cols.length ? `(${cols.map(ident).join(", ")}) VALUES ${values.join(", ")}` : "DEFAULT VALUES"
        return { sql: `INSERT INTO ${t} ${colSql}${this.returningClause(params)}`, params }
      }
      case "upsert": {
        const { cols, values } = this.rowsAndColumns(params)
        if (!values.length) throw new Error("db: upsert() with no rows")
        const conflict = (this.onConflict || "id").split(",").map((c) => c.trim())
        const updates = cols.filter((c) => !conflict.includes(c)).map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`)
        const action = this.ignoreDuplicates || updates.length === 0 ? "DO NOTHING" : `DO UPDATE SET ${updates.join(", ")}`
        return {
          sql: `INSERT INTO ${t} (${cols.map(ident).join(", ")}) VALUES ${values.join(", ")} ON CONFLICT (${conflict.map(ident).join(", ")}) ${action}${this.returningClause(params)}`,
          params,
        }
      }
      case "update": {
        const entries = Object.entries(this.payload ?? {}).filter(([, v]) => v !== undefined)
        if (!entries.length) throw new Error("db: update() with no columns")
        const set = entries
          .map(([k, v]) => {
            params.push(v)
            return `${ident(k)} = $${params.length}`
          })
          .join(", ")
        if (!this.filters.length) throw new Error("db: refusing update() without filters")
        const where = this.whereClause(t, params)
        return { sql: `UPDATE ${t} SET ${set}${where}${this.returningClause(params)}`, params }
      }
      case "delete": {
        if (!this.filters.length) throw new Error("db: refusing delete() without filters")
        const where = this.whereClause(t, params)
        return { sql: `DELETE FROM ${t}${where}${this.returningClause(params)}`, params }
      }
    }
  }

  private async execute(): Promise<DbResult<any>> {
    try {
      const { sql, params, countSql, countParams } = this.build()
      let count: number | null = null
      if (countSql) count = (await query(countSql, countParams)).rows[0]?.count ?? 0
      if (this.headOnly) return { data: null, error: null, count }

      const isMutation = this.mode !== "select"
      const rows = (await query(sql, params)).rows
      if (isMutation && !this.returning) return { data: null, error: null, count }

      if (this.result === "single") {
        if (rows.length !== 1) {
          return {
            data: null,
            error: {
              message: "JSON object requested, multiple (or no) rows returned",
              code: "PGRST116",
              details: `The result contains ${rows.length} rows`,
            },
            count,
          }
        }
        return { data: rows[0], error: null, count }
      }
      if (this.result === "maybeSingle") {
        if (rows.length > 1) {
          return { data: null, error: { message: "Multiple rows returned", code: "PGRST116" }, count }
        }
        return { data: rows[0] ?? null, error: null, count }
      }
      return { data: rows, error: null, count }
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") console.error("[db]", this.table, this.mode, e?.message)
      return { data: null, error: { message: e?.message ?? "Database error", code: e?.code, details: e?.detail } }
    }
  }
}

export async function rpc(fn: string, args: Record<string, unknown> = {}): Promise<DbResult<any>> {
  try {
    const params: unknown[] = []
    const named = Object.entries(args).map(([k, v]) => {
      params.push(v)
      return `${ident(k)} => $${params.length}`
    })
    const { rows } = await query(`SELECT * FROM ${ident(fn)}(${named.join(", ")})`, params)
    return { data: rows.length === 1 && Object.keys(rows[0]).length === 1 ? Object.values(rows[0])[0] : rows, error: null }
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? "Database error", code: e?.code } }
  }
}

export function from<T = any>(table: string) {
  return new QueryBuilder<T>(table)
}
