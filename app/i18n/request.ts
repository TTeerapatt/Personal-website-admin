import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["th", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return !!value && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("nexus_admin_locale")?.value;
  const requestedLocale = await requestLocale;

  const locale = isSupportedLocale(requestedLocale)
    ? requestedLocale
    : isSupportedLocale(cookieLocale)
      ? cookieLocale
      : "th";
  const main = (await import(`../messages/${locale}/main.json`)).default;

  return {
    locale,
    messages: {
      ...main,
    },
  };
});