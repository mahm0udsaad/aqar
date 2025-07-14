import "server-only"
import type { Locale } from "./config"

const mainDictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  ar: () => import("./dictionaries/ar.json").then((module) => module.default),
}

const adminDictionaries = {
  en: () => import("./dictionaries/en-admin.json").then((module) => module.default),
  ar: () => import("./dictionaries/ar-admin.json").then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
  const [mainDict, adminDict] = await Promise.all([
    mainDictionaries[locale] ? mainDictionaries[locale]() : mainDictionaries.en(),
    adminDictionaries[locale] ? adminDictionaries[locale]() : adminDictionaries.en(),
  ])

  return { ...mainDict, ...adminDict }
}
