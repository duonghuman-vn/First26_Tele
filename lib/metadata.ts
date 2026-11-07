import * as cheerio from "cheerio";

export type Metadata = { title: string; description: string | null; image_url: string | null; domain: string };

function absoluteUrl(value: string | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value, base);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch { return null; }
}

export async function fetchMetadata(rawUrl: string): Promise<Metadata> {
  const url = new URL(rawUrl);
  const domain = url.hostname.replace(/^www\./, "");
  const fallback: Metadata = {
    title: domain,
    description: null,
    image_url: null,
    domain,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PersonalLinkManager/1.0)" },
      cache: "no-store",
    });
    if (!response.ok) return fallback;
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) return fallback;
    const html = await response.text();
    const $ = cheerio.load(html.slice(0, 1_000_000));
    const title = $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content") || $("title").first().text();
    const description = $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      $("meta[name='twitter:description']").attr("content");
    const image = $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image']").attr("content");
    return {
      title: title?.trim().slice(0, 300) || fallback.title,
      description: description?.trim().slice(0, 1000) || null,
      image_url: absoluteUrl(image, response.url || url.toString()),
      domain,
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
