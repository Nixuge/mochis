import { Playlist, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist";
import { CheerioAPI } from "cheerio";
import { BASENAME } from "../utils/variables";

export interface ParsedSubpage {
    items: Playlist[],
    nextPage: string | undefined;
}

export function parseSubpage($: CheerioAPI, currentPage: number): ParsedSubpage {
    const pages = $('ul.pagination > li.page-item');    
    const lastPageSelector = parseInt(pages.contents().filter(function() {
        const text: string = $(this).text()
        // @ts-ignore
        return text == parseInt(text, 10)
    }).last().text())

    const hasNextPage = (lastPageSelector != Number.NaN) && (lastPageSelector > currentPage)

    const nextPageId = hasNextPage ? (currentPage+1).toString() : undefined;

    const items: Playlist[] = $('#list-items > div.item').map((i, anime) => {
      const animeRef = $(anime);
      
      const metaRef = animeRef.find('div.b1 > a.name.d-title');
      const url = metaRef.attr('href')?.split('/').pop() ?? '';
      
      const name = metaRef.text();
      const img = animeRef.find('div > a > img').attr('src') ?? '';      
      return {
        id: `/watch/${url}`,
        url: `${BASENAME}/category/${url}`,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video,
        title: name,
        bannerImage: img,
        posterImage: img,
      } satisfies Playlist
    }).get();


    return {
        items: items,
        nextPage: nextPageId
    }
}