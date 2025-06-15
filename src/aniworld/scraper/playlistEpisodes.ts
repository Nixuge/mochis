import { PlaylistGroup, PlaylistGroupVariant, PlaylistItem } from "@mochiapp/js";
import AniWorld from "..";
import { CheerioAPI } from "cheerio";

export function scrapeGroups($: CheerioAPI) {
  let selectedGroupId: string;

  const groups: PlaylistGroup[] = $("#stream > ul:first > li > a")
    .toArray()
    .map((a, idx) => {
      const id = $(a)
        .attr("href")!
        .split("/")
        .filter((x) => x !== "")
        .slice(-1)[0]

      const title = $(a).attr("title") || $(a).text();

      if ($(a).hasClass("active")) selectedGroupId = id;

      return {
        id,
        number: idx,
        altTitle: title,
        variants: id === selectedGroupId ? scrapeVariants($) : undefined,
      } satisfies PlaylistGroup;
    })
    .sort((a, b) => {
      // active group first
      if (a.id === selectedGroupId) return -1;
      if (b.id === selectedGroupId) return 1;

      // movies after seasons
      if (a.id === "filme") return 1;
      if (b.id === "filme") return -1;

      return 0;
    });

  return groups;
}

export function scrapeVariants($: CheerioAPI): PlaylistGroupVariant[] {
  return $(".editFunctions:first .flag")
    .toArray()
    .map((img) => {
      const id = $(img)
        .attr("src")!
        .match(/\/([^./]+).svg/)![1];

      const name = AniWorld.LANGUAGES.get(id) || id;

      return { id, name };
    })
    .sort((a, b) => {
      // sub first
      if (a.id === "japanese-german") return -1;
      if (b.id === "japanese-german") return 1;
      return 0;
    })
    .map(({ id, name }) => {
      return {
        id,
        title: name,
        pagings: [
          {
            id: "all-episodes",
            title: "Alle Episoden",
            items: scrapeEpisodes($, id),
          },
        ],
      } satisfies PlaylistGroupVariant;
    });
}

export function scrapeEpisodes($: CheerioAPI, variantId: string): PlaylistItem[] {
  const episodes = $("table.seasonEpisodesList > tbody > tr")
    .toArray()
    .map((tr, idx) => {
      const id = $(tr)
        .find("a")
        .attr("href")!
        .split("/")
        .filter((x) => x !== "")
        .slice(-2)
        .join("/");

      const title = $(tr).find("td.seasonEpisodeTitle > a").text().trim();

      let number: number;
      try {
        number = parseInt($(tr).attr("data-episode-season-id")!);
      } catch {
        number = idx;
      }

      return {
        id: `${id}/${variantId}`,
        title,
        description: undefined,
        thumbnail: undefined,
        number,
        timestamp: undefined,
        tags: [],
      } satisfies PlaylistItem;
    });

  return episodes;
}
