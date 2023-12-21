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
} from '@mochiapp/js/dist';
import {
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
  PlaylistStatus,
  PlaylistType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';
import { load } from 'cheerio';
import { Anime } from './models/types';
import { everyAnime, everyFilter, loadEveryAnime } from './searcher';
  
export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'animesama',
    name: 'Anime-Sama',
    version: '0.0.6',
    icon: "https://cdn.statically.io/gh/Anime-Sama/IMG/img/autres/AS_border.png"
  }

  async discoverListings(listingRequest?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    loadEveryAnime();
    return []
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {   
    throw new Error("Not implemented");
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    throw new Error("Not implemented");
  }
  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    throw new Error("Not implemented");
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
    for (const anime of everyAnime) {
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
                id: anime.title,
                title: anime.title,
                posterImage: anime.posterImage,
                url: anime.url,
                status: PlaylistStatus.unknown,
                type: PlaylistType.video
            } satisfies Playlist)
        }
    }

    // Dirty workaround when the runner is broken for post requests
    // const url = "https://anime-sama.fr/catalogue/searchbar.php";
    // const query = `query=${encodeURIComponent(searchQuery.query)}`
    // let result: string;
    // try {
    //     URL
    //     const axios = (await import('axios')).default;
    //     result = (await axios.post(url, query)).data        
    // } catch {
    //     result = await request.post(url, { body: query }).then(resp => resp.text());
    // }

    return {
        id: "search",
        title: "Searching for " + searchQuery.query,
        items: items
    } satisfies Paging<Playlist>
  }
}
