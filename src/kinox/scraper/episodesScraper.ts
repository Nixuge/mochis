import { DiscoverListingOrientationType, DiscoverListingType, DiscoverListingsRequest, FetchedPaging, MochiResponse, PlaylistGroup, PlaylistGroupVariant, PlaylistItem, PlaylistItemsOptionFetchPage, PlaylistItemsOptions, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist"
import { Paging } from "@mochiapp/js/src/common/types"
import { DiscoverListing, Playlist } from "@mochiapp/js/src/interfaces/source/types"
import { Cheerio, CheerioAPI, Element, load } from "cheerio"
import { baseURL, mirrorsEpisodeUrl } from "../utils/constants";

export class EpisodesScraper {
  private url: string;
  private isMovie: boolean;

  constructor(url: string) {
    this.url = url.split(",")[0];
    this.isMovie = !url.includes(",");
  }

  async scrape(): Promise<PlaylistGroup[]> {
    if (this.isMovie)
        return await this.returnMovie()

    return await this.returnTV();
  }

  private async returnTV(): Promise<PlaylistGroup[]> {
    const html = await request.get(baseURL + this.url).then(resp => resp.text());
    const $ = load(html);
    
    const seasonSelect = $("select#SeasonSelection");
    const baseApiParams = seasonSelect.attr("rel");
    
    const playlistGroups: PlaylistGroup[] = seasonSelect.find("option").map((i, option) => {
      const season = option.attribs["value"];
      const items: PlaylistItem[] = option.attribs["rel"].split(",").map((episode) => {
        return {
          id: `${mirrorsEpisodeUrl}/${baseApiParams}&Season=${season}&Episode=${episode}`,
          number: parseInt(episode),
          tags: []
        } satisfies PlaylistItem
      })

      return {
        id: season,
        number: parseInt(season),
        variants: [{
          id: "1",
          title: "Episodes",
          pagings: [{
            id: this.url,
            items
          }]
        }]
      }
    }).get()

    return playlistGroups;
  }

  private async returnMovie(): Promise<PlaylistGroup[]> {
    return [{
      id: "1",
      number: 0,
      variants: [{
        id: "1",
        title: "Movie",
        pagings: [{
          id: this.url,
          items: [{
            id: this.url,
            title: "Movie",
            number: 1,
            tags: []
          }]
        }]
      }]
    }]
  }
}