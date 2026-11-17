import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

type Locale = "en" | "ja";
type Status = "canonical" | "missing" | "current" | "source-changed";

export interface LocalizationStatistics {
  locale: Locale;
  status: Status;
  languageSwitchTarget: string;
  fallbackNotice: boolean;
  contentLanguage: Locale;
}

/** Check the candidate's actual locale controls and rendered fallback semantics. */
export function validateLocalization(
  html: string,
  candidate: "vitepress" | "starlight",
  locale: Locale,
  route: string,
  base: string,
  status: Status,
): LocalizationStatistics {
  const languageSwitchTarget = `${base}${locale === "en" ? "ja" : "en"}/${route}`;
  const notice = "このコンテンツはまだ日本語訳がありません。";
  const changedNotice = "翻訳元の英語が更新されています。この翻訳は確認が必要です。";
  let documentLanguage = "";
  let hasSwitch = false;
  let hasEnglishBody = false;
  let bodyText = "";

  function text(node: DefaultTreeAdapterMap["node"]): string {
    if ("value" in node) return node.value;
    if ("tagName" in node && ["script", "style", "template"].includes(node.tagName)) return "";
    return "childNodes" in node ? node.childNodes.map(text).join("") : "";
  }

  function inspect(
    node: DefaultTreeAdapterMap["node"],
    inControl = false,
    inEnglishBody = false,
  ): void {
    if ("tagName" in node) {
      const attr = (name: string) => node.attrs.find((item) => item.name === name)?.value;
      if (node.tagName === "html") documentLanguage = attr("lang") ?? "";
      if (node.tagName === "body") bodyText = text(node);
      inControl ||=
        candidate === "vitepress"
          ? (attr("class") ?? "").split(/\s+/).includes("VPNavBarTranslations")
          : node.tagName === "starlight-lang-select";
      if (
        inControl &&
        (candidate === "vitepress"
          ? node.tagName === "a" && attr("href") === languageSwitchTarget
          : node.tagName === "option" && attr("value") === languageSwitchTarget)
      )
        hasSwitch = true;
      inEnglishBody ||=
        node.tagName === (candidate === "vitepress" ? "div" : "main") && attr("lang") === "en";
      if (inEnglishBody && /^h[1-6]$/.test(node.tagName)) hasEnglishBody = true;
    }
    if ("childNodes" in node)
      for (const child of node.childNodes) inspect(child, inControl, inEnglishBody);
  }
  inspect(parse(html));
  const context = `${candidate}: ${locale}/${route}`;
  if (documentLanguage !== locale)
    throw new Error(`${context}: expected html lang=${locale}, found ${documentLanguage}`);
  if (!hasSwitch)
    throw new Error(`${context}: missing same-page language switch to ${languageSwitchTarget}`);
  const fallbackNotice = bodyText.includes(notice);
  if (locale === "ja" && status === "missing") {
    if (!fallbackNotice) throw new Error(`${context}: missing Japanese fallback notice`);
    if (!hasEnglishBody) throw new Error(`${context}: missing English fallback body lang=en`);
  } else if (locale === "ja" && fallbackNotice) {
    throw new Error(`${context}: unexpected missing-translation notice for ${status} content`);
  }
  const sourceChangedNotice = bodyText.includes(changedNotice);
  if (locale === "ja" && status === "source-changed" && !sourceChangedNotice)
    throw new Error(`${context}: missing Japanese source-changed warning`);
  if (locale === "ja" && status !== "source-changed" && sourceChangedNotice)
    throw new Error(`${context}: unexpected source-changed warning for ${status} content`);
  return {
    locale,
    status,
    languageSwitchTarget,
    fallbackNotice,
    contentLanguage: locale === "ja" && status === "missing" ? "en" : locale,
  };
}
