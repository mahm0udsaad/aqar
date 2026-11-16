"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  Crop,
  ChevronLeft,
  ChevronRight,
  Home,
  ImagePlus,
  Loader2,
  MapPin,
  Star,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth/auth-context"
import { getLocations, type LocationOption } from "@/lib/actions/locations"
import { submitListing, uploadListingPhoto } from "@/lib/actions/listings"
import { compressImage, toLatinDigits } from "@/lib/client-image"
import {
  CATEGORY_SINGULAR,
  FINISHING,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PAYMENT_TYPES,
  categoryLabel,
  suggestTitle,
  tr,
} from "@/lib/listing-options"
import { assetUrl, cn } from "@/lib/utils"
import { PhotoEditorDialog } from "@/components/listing/photo-editor-dialog"

export interface WizardCategory {
  id: string
  slug: string
  name: string
  name_ar?: string | null
  name_en?: string | null
}

export interface WizardInitial {
  id: string
  propertyType: "sale" | "rent"
  categoryId: string
  governorateId: string
  cityId: string
  areaText: string
  address: string
  price: string
  size: string
  floor: string
  totalFloors: string
  bedrooms: string
  bathrooms: string
  finishing: string
  paymentType: string
  downPayment: string
  installmentYears: string
  title: string
  description: string
  images: Photo[]
}

type Photo = { url: string; thumbnailUrl: string }
type Uploading = { key: string; name: string; preview: string; progress: number; error?: string }

const EMPTY: Omit<WizardInitial, "id"> = {
  propertyType: "sale",
  categoryId: "",
  governorateId: "",
  cityId: "",
  areaText: "",
  address: "",
  price: "",
  size: "",
  floor: "",
  totalFloors: "",
  bedrooms: "",
  bathrooms: "",
  finishing: "",
  paymentType: "",
  downPayment: "",
  installmentYears: "",
  title: "",
  description: "",
  images: [],
}

const DRAFT_KEY = "aqar-listing-draft-v1"
const OTHER_CITY = "__other__"

export function ListingWizard({
  lng,
  categories,
  governorates,
  initial,
  limitInfo,
}: {
  lng: string
  categories: WizardCategory[]
  governorates: LocationOption[]
  initial?: WizardInitial | null
  limitInfo?: { used: number; limit: number } | null
}) {
  const router = useRouter()
  const { profile, loading, openSignIn, openOnboarding } = useAuth()
  const isEdit = !!initial?.id
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const Back = lng === "ar" ? ArrowRight : ArrowLeft
  const Next = lng === "ar" ? ArrowLeft : ArrowRight

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Omit<WizardInitial, "id">>(initial ? { ...initial } : EMPTY)
  const [cities, setCities] = useState<LocationOption[]>([])
  const [cityMode, setCityMode] = useState<"list" | "other">(initial?.areaText && !initial?.cityId ? "other" : "list")
  const [uploads, setUploads] = useState<Uploading[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, startSubmit] = useTransition()
  const [restored, setRestored] = useState(false)
  const titleTouched = useRef(!!initial?.title)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  // ---- draft: restore once, then save on every change (new listings only)
  useEffect(() => {
    if (isEdit) return setRestored(true)
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw)
        setForm({ ...EMPTY, ...draft.form })
        if (typeof draft.step === "number") setStep(Math.min(draft.step, 5))
        if (draft.form?.title) titleTouched.current = true
        if (draft.form?.areaText && !draft.form?.cityId) setCityMode("other")
      }
    } catch {}
    setRestored(true)
  }, [isEdit])

  useEffect(() => {
    if (isEdit || !restored) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt: Date.now() }))
    } catch {}
  }, [form, step, isEdit, restored])

  // ---- cities for the chosen governorate
  useEffect(() => {
    if (!form.governorateId) return setCities([])
    let alive = true
    getLocations(form.governorateId).then((rows) => alive && setCities(rows))
    return () => {
      alive = false
    }
  }, [form.governorateId])

  // ---- signed-in + set-up gate
  useEffect(() => {
    if (loading) return
    if (!profile) openSignIn()
    else if (profile.needs_onboarding) openOnboarding()
  }, [loading, profile, openSignIn, openOnboarding])

  const category = categories.find((c) => c.id === form.categoryId)
  const governorate = governorates.find((g) => g.id === form.governorateId)
  const city = cities.find((c) => c.id === form.cityId)
  const placeName = (cityMode === "other" ? form.areaText : city ? (lng === "ar" ? city.name_ar : city.name_en) : "") || (governorate ? (lng === "ar" ? governorate.name_ar : governorate.name_en) : "")
  const isLand = category?.slug === "land"
  const isSale = form.propertyType === "sale"
  const priceNum = Number(form.price) || 0
  const sizeNum = Number(form.size) || 0
  const ppm = priceNum && sizeNum ? Math.round(priceNum / sizeNum) : 0

  const suggested = useMemo(
    () =>
      suggestTitle({
        lng,
        categoryName: category ? CATEGORY_SINGULAR[category.slug]?.[lng === "ar" ? "ar" : "en"] || categoryLabel(category, lng) : null,
        propertyType: form.propertyType,
        place: placeName,
        size: sizeNum || null,
      }),
    [lng, category, form.propertyType, placeName, sizeNum],
  )

  // keep the suggested title until the user types their own
  useEffect(() => {
    if (!titleTouched.current && suggested) setForm((f) => ({ ...f, title: suggested }))
  }, [suggested])

  // ---- photos: every new photo passes through the editor (crop / shape / rotate), then uploads
  const [editQueue, setEditQueue] = useState<File[]>([])
  const [editSrc, setEditSrc] = useState<string | null>(null)
  const [editingExisting, setEditingExisting] = useState<{ url: string; src: string } | null>(null)

  useEffect(() => {
    if (!editQueue.length) return setEditSrc(null)
    const url = URL.createObjectURL(editQueue[0])
    setEditSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [editQueue])

  /** Uploads one photo; with replaceUrl it takes the place of that already-uploaded photo. */
  const uploadOne = useCallback(
    async (original: File, replaceUrl?: string) => {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const preview = URL.createObjectURL(original)
      setUploads((u) => [...u, { key, name: original.name, preview, progress: 10 }])
      try {
        const file = await compressImage(original)
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, progress: 45 } : x)))
        const fd = new FormData()
        fd.append("file", file)
        fd.append("lng", lng)
        const res = await uploadListingPhoto(fd)
        if (!res.success) throw new Error(res.message)
        const photo = { url: res.url, thumbnailUrl: res.thumbnailUrl }
        setForm((f) => ({
          ...f,
          images: replaceUrl && f.images.some((i) => i.url === replaceUrl) ? f.images.map((i) => (i.url === replaceUrl ? photo : i)) : [...f.images, photo],
        }))
        setUploads((u) => u.filter((x) => x.key !== key))
        URL.revokeObjectURL(preview)
      } catch (e: any) {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, progress: 100, error: e?.message || t("فشل الرفع", "Upload failed") } : x)))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lng],
  )

  const queueFiles = (files: File[]) => {
    const room = MAX_PHOTOS - form.images.length - uploads.filter((u) => !u.error).length - editQueue.length
    const batch = files.slice(0, Math.max(0, room))
    if (files.length > batch.length) toast.error(t(`الحد الأقصى ${MAX_PHOTOS} صورة`, `Up to ${MAX_PHOTOS} photos`))
    if (batch.length) setEditQueue((q) => [...q, ...batch])
  }

  const nextInQueue = () => setEditQueue((q) => q.slice(1))

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"] },
    multiple: true,
    onDrop: (accepted) => queueFiles(accepted),
  })

  const movePhoto = (from: number, to: number) =>
    setForm((f) => {
      if (to < 0 || to >= f.images.length) return f
      const images = [...f.images]
      const [item] = images.splice(from, 1)
      images.splice(to, 0, item)
      return { ...f, images }
    })

  // ---- validation per step
  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    const req = t("مطلوب", "Required")
    if (s === 0) {
      if (!form.categoryId) e.categoryId = t("اختر نوع العقار", "Choose the property type")
    }
    if (s === 1) {
      if (!form.governorateId) e.governorateId = t("اختر المحافظة", "Choose the governorate")
      if (cityMode === "list" && !form.cityId) e.cityId = t("اختر المنطقة", "Choose the area")
      if (cityMode === "other" && form.areaText.trim().length < 2) e.areaText = t("اكتب اسم المنطقة", "Type the area name")
      if (form.address.trim().length < 3) e.address = t("اكتب العنوان (الشارع أو الكمبوند)", "Type the address (street or compound)")
    }
    if (s === 2) {
      if (!priceNum || priceNum <= 0) e.price = req
      if (!sizeNum || sizeNum <= 0) e.size = req
      if (!isLand) {
        if (form.bedrooms === "") e.bedrooms = req
        if (form.bathrooms === "") e.bathrooms = req
      }
      if (!form.finishing) e.finishing = t("اختر التشطيب", "Choose the finishing")
      if (isSale) {
        if (!form.paymentType) e.paymentType = t("اختر طريقة الدفع", "Choose the payment method")
        if (form.paymentType && form.paymentType !== "cash") {
          if (form.downPayment === "") e.downPayment = req
          if (!form.installmentYears) e.installmentYears = req
          if (Number(form.downPayment) > priceNum) e.downPayment = t("المقدم أكبر من السعر", "Down payment is higher than the price")
        }
      }
    }
    if (s === 3) {
      if (form.images.length < MIN_PHOTOS) e.images = t(`أضف ${MIN_PHOTOS} صور على الأقل`, `Add at least ${MIN_PHOTOS} photos`)
      if (uploads.some((u) => !u.error) || editQueue.length) e.images = t("انتظر حتى يكتمل رفع الصور", "Wait for the photos to finish uploading")
    }
    if (s === 4) {
      if (form.title.trim().length < 8) e.title = t("العنوان قصير (8 أحرف على الأقل)", "Title is too short (at least 8 characters)")
      if (form.description.trim().length < 20) e.description = t("اكتب وصفاً من 20 حرفاً على الأقل", "Write at least 20 characters")
    }
    return e
  }

  const goNext = () => {
    const e = validate(step)
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error(Object.values(e)[0])
      return
    }
    setStep((s) => Math.min(5, s + 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const publish = () => {
    for (let s = 0; s <= 4; s++) {
      const e = validate(s)
      if (Object.keys(e).length) {
        setErrors(e)
        setStep(s)
        toast.error(Object.values(e)[0])
        return
      }
    }
    if (!profile) return openSignIn()
    if (profile.needs_onboarding) return openOnboarding()

    startSubmit(async () => {
      const res = await submitListing({
        id: initial?.id,
        lng: lng === "en" ? "en" : "ar",
        propertyType: form.propertyType,
        categoryId: form.categoryId,
        governorateId: form.governorateId,
        cityId: cityMode === "list" ? form.cityId : "",
        areaText: cityMode === "other" ? form.areaText : "",
        address: form.address,
        price: priceNum,
        size: sizeNum,
        floor: form.floor === "" ? null : Number(form.floor),
        totalFloors: form.totalFloors === "" ? null : Number(form.totalFloors),
        bedrooms: isLand ? 0 : Number(form.bedrooms || 0),
        bathrooms: isLand ? 0 : Number(form.bathrooms || 0),
        finishing: form.finishing as any,
        paymentType: isSale ? (form.paymentType as any) : null,
        downPayment: isSale && form.paymentType !== "cash" && form.downPayment !== "" ? Number(form.downPayment) : null,
        installmentYears: isSale && form.paymentType !== "cash" && form.installmentYears ? Number(form.installmentYears) : null,
        title: form.title,
        description: form.description,
        images: form.images,
      })
      if (!res.success) {
        toast.error(res.message)
        if (res.code === "ONBOARDING") openOnboarding()
        if (res.code === "AUTH") openSignIn()
        return
      }
      if (!isEdit) {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {}
      }
      toast.success(
        isEdit
          ? t("تم حفظ التعديلات وإرسال الإعلان للمراجعة", "Changes saved and sent for review")
          : t("تم إرسال إعلانك! سيظهر بعد المراجعة", "Listing sent! It goes live after review"),
      )
      router.push(`/${lng}/account/listings?submitted=1`)
      router.refresh()
    })
  }

  const steps = [
    t("الغرض والنوع", "Purpose & type"),
    t("الموقع", "Location"),
    t("التفاصيل", "Details"),
    t("الصور", "Photos"),
    t("العنوان والوصف", "Title & description"),
    t("معاينة ونشر", "Preview & publish"),
  ]

  const fieldError = (k: string) => (errors[k] ? <p className="text-sm text-destructive mt-1">{errors[k]}</p> : null)
  const numberInput = (key: keyof typeof form, props: React.ComponentProps<typeof Input> = {}) => (
    <Input
      inputMode="numeric"
      dir="ltr"
      value={form[key] as string}
      onChange={(e) => set(key, toLatinDigits(e.target.value).replace(/[^\d.]/g, "") as any)}
      className={cn("h-11", errors[key as string] && "border-destructive")}
      {...props}
    />
  )
  const chip = (active: boolean, onClick: () => void, children: React.ReactNode, key?: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60",
      )}
    >
      {children}
    </button>
  )

  if (!profile && !loading) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("أضف عقارك مجاناً", "List your property for free")}</h1>
          <p className="text-muted-foreground">{t("سجّل الدخول بحساب جوجل لتبدأ. يستغرق الأمر دقيقتين.", "Sign in with Google to start. It takes two minutes.")}</p>
          <Button size="lg" onClick={() => openSignIn()}>{t("تسجيل الدخول والبدء", "Sign in to start")}</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{isEdit ? t("تعديل الإعلان", "Edit listing") : t("أضف عقارك مجاناً", "List your property for free")}</h1>
        {!isEdit && limitInfo && (
          <p className="text-sm text-muted-foreground mt-1">
            {t(`استخدمت ${limitInfo.used} من ${limitInfo.limit} إعلانات مجانية`, `You've used ${limitInfo.used} of ${limitInfo.limit} free listings`)}
          </p>
        )}
        {isEdit && <p className="text-sm text-muted-foreground mt-1">{t("بعد الحفظ يرجع الإعلان للمراجعة قبل ظهوره من جديد.", "After saving, the listing goes back to review before it shows again.")}</p>}
      </div>

      {/* progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{steps[step]}</span>
          <span className="text-muted-foreground">{t(`خطوة ${step + 1} من ${steps.length}`, `Step ${step + 1} of ${steps.length}`)}</span>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-5 md:p-8 space-y-6">
          {step === 0 && (
            <>
              <div>
                <Label className="text-base mb-3 block">{t("الغرض", "Purpose")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["sale", "rent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("propertyType", p)}
                      className={cn("rounded-lg border-2 p-4 font-semibold text-lg", form.propertyType === p ? "border-primary bg-primary/5" : "border-border")}
                    >
                      {p === "sale" ? t("للبيع", "For sale") : t("للإيجار", "For rent")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-base mb-3 block">{t("نوع العقار", "Property type")}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set("categoryId", c.id)}
                      className={cn(
                        "rounded-lg border-2 p-4 flex flex-col items-center gap-2",
                        form.categoryId === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                      )}
                    >
                      {c.slug === "commercial" || c.slug === "land" ? <Building2 className="w-6 h-6" /> : <Home className="w-6 h-6" />}
                      <span className="font-medium">{CATEGORY_SINGULAR[c.slug]?.[lng === "ar" ? "ar" : "en"] || categoryLabel(c, lng)}</span>
                    </button>
                  ))}
                </div>
                {fieldError("categoryId")}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">{t("المحافظة", "Governorate")}</Label>
                  <Select
                    value={form.governorateId}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, governorateId: v, cityId: "", areaText: "" }))
                      setCityMode("list")
                    }}
                    dir={lng === "ar" ? "rtl" : "ltr"}
                  >
                    <SelectTrigger className={cn("h-11", errors.governorateId && "border-destructive")}>
                      <SelectValue placeholder={t("اختر المحافظة", "Choose governorate")} />
                    </SelectTrigger>
                    <SelectContent>
                      {governorates.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {lng === "ar" ? g.name_ar : g.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError("governorateId")}
                </div>
                <div>
                  <Label className="mb-2 block">{t("المنطقة / المدينة", "Area / city")}</Label>
                  <Select
                    value={cityMode === "other" ? OTHER_CITY : form.cityId}
                    onValueChange={(v) => {
                      if (v === OTHER_CITY) {
                        setCityMode("other")
                        set("cityId", "")
                      } else {
                        setCityMode("list")
                        setForm((f) => ({ ...f, cityId: v, areaText: "" }))
                      }
                    }}
                    disabled={!form.governorateId}
                    dir={lng === "ar" ? "rtl" : "ltr"}
                  >
                    <SelectTrigger className={cn("h-11", errors.cityId && "border-destructive")}>
                      <SelectValue placeholder={t("اختر المنطقة", "Choose area")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {lng === "ar" ? c.name_ar : c.name_en}
                        </SelectItem>
                      ))}
                      <SelectItem value={OTHER_CITY}>{t("منطقة أخرى…", "Another area…")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldError("cityId")}
                </div>
              </div>
              {cityMode === "other" && (
                <div>
                  <Label className="mb-2 block">{t("اسم المنطقة", "Area name")}</Label>
                  <Input value={form.areaText} onChange={(e) => set("areaText", e.target.value)} maxLength={80} className="h-11" />
                  {fieldError("areaText")}
                </div>
              )}
              <div>
                <Label className="mb-2 block">{t("العنوان", "Address")}</Label>
                <Input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder={t("مثال: شارع 14 مايو، أو اسم الكمبوند", "e.g. 14th of May St., or the compound name")}
                  maxLength={200}
                  className={cn("h-11", errors.address && "border-destructive")}
                />
                <p className="text-xs text-muted-foreground mt-1">{t("لا تكتب رقم الشقة. يظهر العنوان للزوار.", "Don't include the flat number. Visitors can see the address.")}</p>
                {fieldError("address")}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">{isSale ? t("السعر (جنيه)", "Price (EGP)") : t("الإيجار الشهري (جنيه)", "Monthly rent (EGP)")}</Label>
                  {numberInput("price", { placeholder: isSale ? "2500000" : "15000" })}
                  {priceNum > 0 && <p className="text-xs text-muted-foreground mt-1">{priceNum.toLocaleString(lng === "ar" ? "ar-EG" : "en-US")} {t("ج.م", "EGP")}</p>}
                  {fieldError("price")}
                </div>
                <div>
                  <Label className="mb-2 block">{t("المساحة (م²)", "Size (m²)")}</Label>
                  {numberInput("size", { placeholder: "120" })}
                  {ppm > 0 && <p className="text-xs text-muted-foreground mt-1">{t(`سعر المتر: ${ppm.toLocaleString("ar-EG")} ج.م`, `Price per m²: ${ppm.toLocaleString()} EGP`)}</p>}
                  {fieldError("size")}
                </div>
              </div>

              {!isLand && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="mb-2 block">{t("الغرف", "Bedrooms")}</Label>
                    {numberInput("bedrooms", { placeholder: "3" })}
                    {fieldError("bedrooms")}
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("الحمامات", "Bathrooms")}</Label>
                    {numberInput("bathrooms", { placeholder: "2" })}
                    {fieldError("bathrooms")}
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("الدور", "Floor")}</Label>
                    {numberInput("floor", { placeholder: t("0 = أرضي", "0 = ground") })}
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("عدد أدوار المبنى", "Building floors")}</Label>
                    {numberInput("totalFloors", { placeholder: "10" })}
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-2 block">{t("التشطيب", "Finishing")}</Label>
                <div className="flex flex-wrap gap-2">
                  {FINISHING.map((f) => chip(form.finishing === f.value, () => set("finishing", f.value), lng === "ar" ? f.ar : f.en, f.value))}
                </div>
                {fieldError("finishing")}
              </div>

              {isSale && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">{t("طريقة الدفع", "Payment")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_TYPES.map((p) => chip(form.paymentType === p.value, () => set("paymentType", p.value), lng === "ar" ? p.ar : p.en, p.value))}
                    </div>
                    {fieldError("paymentType")}
                  </div>
                  {form.paymentType && form.paymentType !== "cash" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">{t("المقدم (جنيه)", "Down payment (EGP)")}</Label>
                        {numberInput("downPayment", { placeholder: "500000" })}
                        {fieldError("downPayment")}
                      </div>
                      <div>
                        <Label className="mb-2 block">{t("مدة التقسيط (سنوات)", "Installment period (years)")}</Label>
                        {numberInput("installmentYears", { placeholder: "5" })}
                        {fieldError("installmentYears")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div
                {...getRootProps()}
                className={cn(
                  "rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
                  errors.images && "border-destructive",
                )}
              >
                <input {...getInputProps()} />
                <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <div className="font-semibold">{t("اضغط لاختيار الصور أو اسحبها هنا", "Tap to choose photos or drag them here")}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t(`من ${MIN_PHOTOS} إلى ${MAX_PHOTOS} صور. الصورة الأولى هي الغلاف. يمكنك قص كل صورة واختيار أفقي أو رأسي قبل رفعها.`, `${MIN_PHOTOS} to ${MAX_PHOTOS} photos. The first one is the cover. You can crop each photo and pick landscape or portrait before it uploads.`)}
                </div>
              </div>
              {fieldError("images")}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {form.images.map((img, i) => (
                  <div key={img.url} className="relative rounded-lg overflow-hidden border aspect-[4/3] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetUrl(img.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-2 start-2 bg-primary text-primary-foreground text-xs rounded px-2 py-0.5 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {t("الغلاف", "Cover")}
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 bg-black/50">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white" onClick={() => movePhoto(i, i - 1)} disabled={i === 0} aria-label={t("تحريك للأمام", "Move earlier")}>
                        {lng === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </Button>
                      {i !== 0 && (
                        <Button type="button" size="sm" variant="ghost" className="h-8 text-white text-xs" onClick={() => movePhoto(i, 0)}>
                          {t("اجعلها الغلاف", "Make cover")}
                        </Button>
                      )}
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white" onClick={() => setEditingExisting({ url: img.url, src: assetUrl(img.url) })} aria-label={t("قص وتعديل", "Crop and edit")} title={t("قص وتعديل", "Crop and edit")}>
                        <Crop className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} aria-label={t("حذف", "Remove")}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white" onClick={() => movePhoto(i, i + 1)} disabled={i === form.images.length - 1} aria-label={t("تحريك للخلف", "Move later")}>
                        {lng === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {uploads.map((u) => (
                  <div key={u.key} className="relative rounded-lg overflow-hidden border aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.preview} alt="" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                      {u.error ? (
                        <>
                          <span className="text-xs bg-destructive text-destructive-foreground rounded px-2 py-1">{u.error}</span>
                          <Button type="button" size="sm" variant="secondary" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}>
                            {t("إزالة", "Dismiss")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <Progress value={u.progress} className="h-1.5 w-3/4" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {form.images.length + uploads.length < MAX_PHOTOS && form.images.length > 0 && (
                  <button type="button" onClick={openFilePicker} className="rounded-lg border-2 border-dashed aspect-[4/3] flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/60">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-sm">{t("أضف صوراً", "Add photos")}</span>
                  </button>
                )}
              </div>
              <PhotoEditorDialog
                lng={lng}
                src={editSrc}
                fileName={editQueue[0]?.name}
                progressLabel={editQueue.length > 1 ? t(`${editQueue.length} صور متبقية`, `${editQueue.length} left`) : undefined}
                onApply={(file) => {
                  uploadOne(file)
                  nextInQueue()
                }}
                onSkip={() => {
                  if (editQueue[0]) uploadOne(editQueue[0])
                  nextInQueue()
                }}
                onSkipAll={
                  editQueue.length > 1
                    ? () => {
                        editQueue.forEach((f) => uploadOne(f))
                        setEditQueue([])
                      }
                    : undefined
                }
                onCancel={() => setEditQueue([])}
              />
              <PhotoEditorDialog
                lng={lng}
                src={editingExisting?.src || null}
                onApply={(file) => {
                  if (editingExisting) uploadOne(file, editingExisting.url)
                  setEditingExisting(null)
                }}
                onSkip={() => setEditingExisting(null)}
                onCancel={() => setEditingExisting(null)}
              />
              <p className="text-sm text-muted-foreground">
                {t(`${form.images.length} من ${MIN_PHOTOS} صور مطلوبة على الأقل`, `${form.images.length} of at least ${MIN_PHOTOS} photos`)}
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <Label className="mb-2 block">{t("عنوان الإعلان", "Listing title")}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    titleTouched.current = true
                    set("title", e.target.value)
                  }}
                  maxLength={120}
                  className={cn("h-11", errors.title && "border-destructive")}
                />
                <div className="flex justify-between mt-1">
                  {suggested && form.title !== suggested ? (
                    <button type="button" className="text-xs text-primary underline" onClick={() => set("title", suggested)}>
                      {t(`استخدم: ${suggested}`, `Use: ${suggested}`)}
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">{form.title.length}/120</span>
                </div>
                {fieldError("title")}
              </div>
              <div>
                <Label className="mb-2 block">{t("الوصف", "Description")}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={8}
                  maxLength={5000}
                  placeholder={t(
                    "اكتب أهم ما يميز العقار: الإطلالة، قربه من الخدمات، حالة المبنى، الجراج، الأسانسير…",
                    "What makes it stand out: view, nearby services, building condition, parking, elevator…",
                  )}
                  className={cn(errors.description && "border-destructive")}
                />
                <div className="text-xs text-muted-foreground text-end mt-1">{form.description.trim().length}/5000</div>
                {fieldError("description")}
              </div>
            </>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-lg border overflow-hidden">
                {form.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(form.images[0].url)} alt="" className="w-full aspect-[16/9] object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="text-2xl font-bold">
                    {priceNum.toLocaleString(lng === "ar" ? "ar-EG" : "en-US")} {t("ج.م", "EGP")}
                    {!isSale && <span className="text-base font-normal text-muted-foreground"> {t("/ شهرياً", "/month")}</span>}
                  </div>
                  <div className="text-lg font-semibold">{form.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {[form.address, placeName, governorate && placeName !== (lng === "ar" ? governorate.name_ar : governorate.name_en) ? (lng === "ar" ? governorate.name_ar : governorate.name_en) : ""].filter(Boolean).join("، ")}
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  [t("الغرض", "Purpose"), isSale ? t("للبيع", "For sale") : t("للإيجار", "For rent")],
                  [t("النوع", "Type"), category ? CATEGORY_SINGULAR[category.slug]?.[lng === "ar" ? "ar" : "en"] || categoryLabel(category, lng) : ""],
                  [t("المساحة", "Size"), `${sizeNum} ${t("م²", "m²")}`],
                  [t("سعر المتر", "Price per m²"), ppm ? `${ppm.toLocaleString(lng === "ar" ? "ar-EG" : "en-US")} ${t("ج.م", "EGP")}` : ""],
                  ...(!isLand
                    ? [
                        [t("الغرف", "Bedrooms"), form.bedrooms],
                        [t("الحمامات", "Bathrooms"), form.bathrooms],
                      ]
                    : []),
                  [t("التشطيب", "Finishing"), FINISHING.find((f) => f.value === form.finishing)?.[lng === "ar" ? "ar" : "en"] || ""],
                  ...(isSale ? [[t("الدفع", "Payment"), PAYMENT_TYPES.find((p) => p.value === form.paymentType)?.[lng === "ar" ? "ar" : "en"] || ""]] : []),
                  [t("الصور", "Photos"), String(form.images.length)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b py-1.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <div className="font-semibold mb-1">{t("بيانات التواصل على الإعلان", "Contact details on the listing")}</div>
                <div className="text-muted-foreground">
                  {profile?.account_type === "broker" && profile.office_name ? profile.office_name : profile?.full_name} ·{" "}
                  <span dir="ltr">{profile?.phone}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t("يمكنك تغييرها من صفحة حسابي.", "You can change them from My account.")}</div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  "بالنشر تؤكد أن البيانات صحيحة وأن لك الحق في عرض هذا العقار. يراجع فريق عقار الإعلان قبل ظهوره، عادةً خلال 24 ساعة.",
                  "By publishing you confirm the details are correct and you may advertise this property. The Aqar team reviews it before it goes live, usually within 24 hours.",
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* navigation */}
      <div className="flex items-center justify-between gap-3 mt-6 sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t md:border-0 md:static md:bg-transparent">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || submitting} className="h-11">
          <Back className="w-4 h-4 me-1" />
          {t("السابق", "Back")}
        </Button>
        {step < 5 ? (
          <Button type="button" onClick={goNext} className="h-11 min-w-32">
            {t("التالي", "Next")}
            <Next className="w-4 h-4 ms-1" />
          </Button>
        ) : (
          <Button type="button" onClick={publish} disabled={submitting} className="h-11 min-w-40 font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Check className="w-4 h-4 me-2" />}
            {isEdit ? t("حفظ وإرسال للمراجعة", "Save and send for review") : t("نشر الإعلان", "Publish listing")}
          </Button>
        )}
      </div>
    </div>
  )
}
