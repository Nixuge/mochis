import { Playlist, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist";
import { Cheerio, Element } from "cheerio";
import { posterRes } from "../utils/constants";

export function scrapeItemsBlock(ref: Cheerio<Element>): Playlist[] {
    const items: Playlist[] = ref.find("div.flw-item").map((i, elem) => {
      const elemRef = ref.find(elem);
      const id = elemRef.find("div.film-poster a").attr("href")!;
      const title = elemRef.find("div.film-detail h2.film-name a").text();
      const poster = elemRef.find("div.film-poster img").attr("data-src")!.replace(/\d+x\d+/, posterRes);

      return {
        id: id,
        title: title,
        posterImage: poster,
        url: id,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video,
      } satisfies Playlist
    }).get()

    return items;
}