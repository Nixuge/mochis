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
import { EpisodesScraper } from './scraper/episodes';
import { genericPlaylistDetails } from './scraper/details';

export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'flixhq',
    name: 'FlixHQ',
    version: '0.0.21',
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
    return await genericPlaylistDetails(id);
  };

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    // if (options)
    //   console.warn(JSON.stringify(options));
    // else
    //   console.warn("No options");
    // console.log(playlistId);

    const url = `${baseUrl}${playlistId}`;
    return new EpisodesScraper(url, options).scrape()
  }

  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    return []
  };

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    return undefined as unknown as PlaylistEpisodeServerResponse
  }
}
