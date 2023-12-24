import { DiscoverListingOrientationType, DiscoverListingType, DiscoverListingsRequest, FetchedPaging, MochiResponse, PlaylistGroup, PlaylistGroupVariant, PlaylistItem, PlaylistItemsOptionFetchPage, PlaylistItemsOptions, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist"
import { Paging } from "@mochiapp/js/src/common/types"
import { DiscoverListing, Playlist } from "@mochiapp/js/src/interfaces/source/types"
import { Cheerio, CheerioAPI, Element, load } from "cheerio"
import { bannerRes, baseUrl } from "../utils/constants";
import { scrapeItemsBlock } from "./item";
import { genericPlaylistDetails } from "./details";

export class EpisodesScraper {
  private url: string;
  private playlistId: string;
  private isMovie: boolean;
  private options?: PlaylistItemsOptions;

  constructor(url: string, options?: PlaylistItemsOptions) {
    this.url = url;
    const urlSplit = url.split("-")
    this.playlistId = urlSplit[urlSplit.length-1];
    this.options = options;
    // Note: we can technically just watch the url see if something is a movie, which avoids 1 request.
    // It can be inaccurate but since everything we do here is controlled it shouldn't ever be.
    // For now, keeping it like that.
    // this.isMovie = $("div#main-wrapper div.detail_page-watch").attr("data-type") == "1";
    // Edit: changed it.
    
    this.isMovie = (url.split("/")[3].includes("movie"));
  }

  async scrape(): Promise<PlaylistGroup[]> {
    // MOVIE:
    // /ajax/episode/list/<movieid> -> list of servers directly
    if (this.isMovie)
        return await this.returnMovie()
    
    // TV:
    // /ajax/season/list/<tvid> -> list of seasons
    // /ajax/season/episodes/<seasonid> -> list of episodes for season
    // /ajax/episode/servers/<episodeid> -> list of servers
    // Here 
    if (!this.options)
        return await this.scrapeSeasons();
    // if (this.options.type == "page")
    return await this.scrapeEpisodes();

    throw Error("EpisodesScraper - How did you end up here?");
  }

  private async scrapeEpisodes(): Promise<PlaylistGroup[]> {
    // TODO WHEN BUG IS FIXED.
    // === What is happening ? ===
    // Basically, playlistEpisodes gets called 1x (initial req)
    // From then, if it's a movie it just goes through and if it's a TV release it grabs the season list.
    // For all of these seasons, it makes a PlaylistGroup[], which is filled up tp "pagings" where "items" is undefined.
    // Basically, there are 3 steps in which you can set something as undefined:
    // - variants: undefined = next request you'll get a PlaylistItemsOptionFetchGroup
    // - pagings: undefined = next request you'll get a PlaylistItemsOptionFetchVariant (or not it seems buggy, this one isn't included for some reason?)
    // - items: undefined (the one i'm using) = next request you'll get a PlaylistItemsOptionFetchPage.
    // 
    // This is to avoid eg if you have a season, having to request every episode for every season at once.
    // == Now the problem(s): ==
    // First minor problem: 
    // the app doesn't do that second request automatically, eg if you load seasons it'll stay stuck
    // until you switch the season in which case it'll send that second request.
    // Second major problem: 
    // It doesn't matter to the app where you put the undefined, in ALL cases it'll return a PlaylistItemsOptionFetchGroup
    // Problem is that object variant does NOT contain all values needed (variant id & paging id) to make the object properly.
    // 
    // Workaround for now: I'm using the same id for all 3 objects. It's not the fanciest, but it works,
    // since the variants & pagings are only 1 item long & we get the id for the >1 items long element
    const html = await request.get(`${baseUrl}/ajax/season/episodes/${this.options!.groupId}`).then(resp => resp.text());
    const $ = load(html);
    const episodes: PlaylistItem[] = $("ul.nav li.nav-item").map((i, episode) => {
        const episodeRef = $(episode);
        const episodeId = episodeRef.find("a").attr("data-id")!;
        const title = episodeRef.text().trim().replaceAll("  ", "")

        return {
            id: "/ajax/episode/servers/" + episodeId,
            title: title,
            number: i+1,
            tags: []
        }
    }).get()


    const id = this.options!.groupId;
    return [ {
        id,
        number: 0, // https://discord.com/channels/1066496628757901472/1180253163698270268/1188241417789771786
        variants: [{
            id,
            title: "", // https://discord.com/channels/1066496628757901472/1180253163698270268/1188241417789771786
            pagings: [{
                id,
                items: episodes
            } satisfies FetchedPaging<PlaylistItem>]
        } satisfies PlaylistGroupVariant]
    } satisfies PlaylistGroup]
  }


  private async scrapeSeasons(): Promise<PlaylistGroup[]> {
    const html = await request.get(`${baseUrl}/ajax/season/list/${this.playlistId}`).then(resp => resp.text())
    const $ = load(html)
    const seasons: PlaylistGroup[] = $("div.slt-seasons-dropdown div.dropdown-menu a.dropdown-item").map((i, season) => {
        const seasonRef = $(season);
        const title = seasonRef.text();
        const id = seasonRef.attr("data-id")!
        return {
            id: id,
            number: i+1,
            altTitle: title,
            variants: [{
                id: id,
                title,
                pagings: [{
                    id: id,
                    title: title,
                    items: undefined // undefined = scrapes after, not rn. Avoids too many unnecessary requests.
                } satisfies FetchedPaging<PlaylistItem>]
            } satisfies PlaylistGroupVariant]
        } satisfies PlaylistGroup
    }).get()
    
    return seasons
  }

  private async returnMovie(): Promise<PlaylistGroup[]> {
    const nextUrl = `/ajax/episode/list/${this.playlistId}`;
    // const data = await genericPlaylistDetails(this.url.replace(baseUrl, ""))
    // console.log(data);
    // Can't be bothered to scrape shit again for desc & thumbnail.
    // genericPlaylistDetail doesn't get enough unfortunately
    return [{
        id: "Movie",
        number: 1,
        variants: [{
            id: "Movie",
            title: "Movie",
            pagings: [{
                id: "Movie",
                title: "Movie",
                items: [{
                    id: nextUrl,
                    title: "Movie",
                    // description?: string,
                    // thumbnail?: string,
                    number: 1,
                    // timestamp?: Date,
                    tags: []
                }]
            }]
        }]
    }]
  } 
}