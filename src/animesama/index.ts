import { DiscoverListingOrientationType, DiscoverListingType, PlaylistGroup, PlaylistGroupVariant, } from '@mochiapp/js/src/interfaces/source/types';

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
  PlaylistItem,
  SearchFilter,
  SearchQuery,
  PlaylistEpisodeServer,
  SearchQueryFilter,
  MochiResponse,
} from '@mochiapp/js/dist';
import {
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
  PlaylistStatus,
  PlaylistType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';
import { Cheerio, CheerioAPI, Element, load } from 'cheerio';
import { Anime, RequestingPlaylistGroup } from './models/types';
import { everyAnime, everyFilter, loadEveryAnime } from './searcher';
import { sleep } from './utils/sleep';
import { PlaylistEpisodesScraper } from './scraper/playlistepisodes';
import { sourceNames } from './utils/sourcenames';
import { PlaylistDetailsScraper } from './scraper/playlistdetails';

export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'animesama',
    name: 'Anime-Sama',
    version: '0.0.13',
    icon: "https://cdn.statically.io/gh/Anime-Sama/IMG/img/autres/AS_border.png"
  }

  async discoverListings(listingRequest?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    loadEveryAnime();
    return []
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    // ! NEEDS TO BE CALLED AFTER discoverListings() 
    while (everyAnime.length == 0) {
      await sleep(10);
    }
    const anime = everyAnime[parseInt(id)];
    return await new PlaylistDetailsScraper(anime).scrape()
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    // ! NEEDS TO BE CALLED AFTER discoverListings() 
    while (everyAnime.length == 0) {
      await sleep(10);
    }
        
    const anime = everyAnime[parseInt(playlistId)];

    return await new PlaylistEpisodesScraper(anime).scrape()
  }
  
  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    const sources: string[] = JSON.parse(req.episodeId);
    const servers = sources.map((source) => {
      let domain: string | string[] = source.split("/")[2].split(".");
      domain = domain.splice(domain.length-2, 2).join(".")
      return {
        id: source,
        displayName: sourceNames[domain]
      };
    })
    
    return [{
      id: "anime-sama",
      displayName: "Anime Sama",
      servers: servers
    }]
  }


  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    throw new Error("Not implemented");
  }

  async searchFilters(): Promise<SearchFilter[]>  {
    console.log("getting every filter");
    
    return everyFilter;
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {
    const search = searchQuery.query.toLowerCase();

    
    const usedFilters: [SearchQueryFilter, SearchFilter][] = []
    searchQuery.filters.forEach(searchQueryFilter => {
      const filterObj = everyFilter.find(filter => filter.id === searchQueryFilter.id);
      if (filterObj == undefined) {
        console.error(searchQueryFilter);        
        throw Error("Filter didn't match !");
      }
      usedFilters.push([searchQueryFilter, filterObj])
    })    

    const items: Playlist[] = [];

    searchLoop:
    for (const [index, anime] of everyAnime.entries()) {
        for (const [searchQueryFilter, searchFilter] of usedFilters) {
          const enabledFilterOptions = searchQueryFilter.optionIds;
          const filterId = searchFilter.id;
          console.log(filterId);
          
          const match = enabledFilterOptions.every(enabledOption => anime.filters[filterId].includes(enabledOption));
          if (!match)
            continue searchLoop;
        }
        
        if (anime.title.includes(search) || anime.altTitle?.includes(search)) {          
            items.push({
                id: index.toString(),
                title: anime.title,
                posterImage: anime.posterImage,
                url: anime.url,
                status: PlaylistStatus.unknown,
                type: PlaylistType.video
            } satisfies Playlist)
        }
    }

    return {
        id: "search",
        title: "Searching for " + searchQuery.query,
        items: items
    } satisfies Paging<Playlist>
  }
}
