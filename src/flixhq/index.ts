import type {
  DiscoverListing,
  DiscoverListingsRequest,
  Paging,
  Playlist,
  PlaylistDetails,
  PlaylistEpisodeServerRequest,
  PlaylistEpisodeServerResponse,
  PlaylistEpisodeSource,
  PlaylistEpisodeSourcesRequest,
  PlaylistItemsOptions,
  PlaylistItemsResponse,
  SearchFilter,
  SearchQuery,
  PlaylistEpisodeServer,
} from '@mochiapp/js/dist';
import {
  DiscoverListingOrientationType,
  DiscoverListingType,
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
  PlaylistStatus,
  PlaylistType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';

import { load } from 'cheerio';
import { bannerRes, baseUrl, posterRes } from './utils/constants';
import { HomeScraper } from './scraper/homeScraper';
import { scrapeItemsBlock } from './scraper/item';

export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'flixhq',
    name: 'FlixHQ',
    version: '0.0.7',
    icon: "https://img.flixhq.to/xxrz/100x100/100/bc/3c/bc3c462f0fb1b1c71288170b3bd55aeb/bc3c462f0fb1b1c71288170b3bd55aeb.png"
  }

  async searchFilters(): Promise<SearchFilter[]> {
    return [];
  }
  async discoverListings(discoverRequest?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    const html = await request.get(`${baseUrl}/home`).then(resp => resp.text());
    
    return new HomeScraper(html).scrape()
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {
    // TODO: HANDLE PAGES!!
    const html = await request.get(`${baseUrl}/search/${searchQuery.query.replaceAll(" ", "-")}`).then(resp => resp.text());
    const $ = load(html);
    
    const items: Playlist[] = scrapeItemsBlock($("div#main-wrapper"))

    return {
      id: "0",
      items
    }
  };

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    const html = await request.get(`${baseUrl}${id}`).then(resp => resp.text())
    const $ = load(html);

    const ratings = parseFloat($("div.stats span").has("i.fa-star").first().text());

    const detailsRef = $("div.movie_information div.container div.m_i-detail");

    const synopsis = detailsRef.find("div.m_i-d-content div.description").text();
    
    const elems: { [key: string]: string } = {};
    detailsRef.find("div.m_i-d-content div.elements div.row-line").map((i, elem) => {
      const elemRef = $(elem);
      const type = elemRef.find("span.type").text().replace(":", "").toLowerCase();
      const text = elemRef.text().replaceAll("\n", "").replaceAll("  ", "").split(":")[1].trim()
      elems[type] = text;
    })

    const genres = elems["genre"].split(", ");
    let yearReleased: number | undefined = undefined;
    try { yearReleased = parseInt(elems["released"].split("-")[0]); } catch {}

    return {
      synopsis: synopsis,
      altTitles: [],
      altPosters: [], // could scrape but i think it's the same most times so yeah meh
      altBanners: [], // same
      genres,
      yearReleased,
      ratings,
      previews: []
    } satisfies PlaylistDetails
  };

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    // how to detect if playlist or not:
    // proper method:
    // - request the main page (same as playlistDetails) & get detail_page-watch's data-id (1=movie,2=tv)
    // my method (1 less request):
    // - playlistId.split("/")[0].includes("movie")
    // can technically be tv too, but since we know where the urls come from it's safe to assume this.
    return undefined as unknown as PlaylistItemsResponse
  }

  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    return []
  };

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    return undefined as unknown as PlaylistEpisodeServerResponse
  }
}
