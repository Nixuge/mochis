import * as cheerio from "cheerio";

export function sanitizeHtml(html: string): string {
  return cheerio.load(html)(":root").text();
}
