import type en from "./dictionaries/en.json"
import type enAdmin from "./dictionaries/en-admin.json"

export type Dictionary = typeof en & { admin: typeof enAdmin["admin"] } 