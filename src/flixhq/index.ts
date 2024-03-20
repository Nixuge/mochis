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
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';

import { load } from 'cheerio';
import { baseUrl } from './utils/constants';
import { HomeScraper } from './scraper/homeScraper';
import { scrapeItemsBlock } from './scraper/item';
import { EpisodesScraper } from './scraper/episodes';
import { genericPlaylistDetails } from './scraper/details';
import { filters, loadFilters } from './utils/filters';
import { UrlMatcher } from '../shared/models/matcher';
import { VidCloudE } from '../shared/extractors/vidcloud';
import { UpstreamE } from '../shared/extractors/upstream';
import { DoodE } from '../shared/extractors/dood';
import { VoeE } from '../shared/extractors/voe';

export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'flixhq',
    name: 'FlixHQ',
    version: '0.2.3',
    icon: "https://img.flixhq.to/xxrz/100x100/100/bc/3c/bc3c462f0fb1b1c71288170b3bd55aeb/bc3c462f0fb1b1c71288170b3bd55aeb.png"
  }

  async searchFilters(): Promise<SearchFilter[]> {
    return filters;
  }
  async discoverListings(discoverRequest?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    loadFilters()
    const html = await request.get(`${baseUrl}/home`).then(resp => resp.text());
    return new HomeScraper(html).scrape()
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {    
    // Handle tags or search based query
    let url: string;
    if (searchQuery.filters.length == 0)
      url = `${baseUrl}/search/${searchQuery.query.replaceAll(" ", "-")}`
    else {
      url = "https://flixhq.to/filter?";
      for (const filter of searchQuery.filters) {
        url += `&${filter.id}=`
        filter.optionIds.forEach(option => { url += option + "-" });
        url = url.slice(0, -1);
      }
    }
    if (searchQuery.page) {
      url += (url.includes("?")) ? "&" : "?";
      url += "page=" + searchQuery.page;
    }    

    const html = await request.get(url).then(resp => resp.text());
    const $ = load(html);

    // Load items
    const items: Playlist[] = scrapeItemsBlock($("div#main-wrapper"));
    
    // Handle pages
    let currentPage = parseInt($("ul.pagination li.page-item.active a.page-link").first().text());
    let hasPages = !isNaN(currentPage);

    // If on last page, lastPage will be equal to currentPage. Otherwise, it'll be a », which is NaN
    let isLastPage = !isNaN(parseInt($("ul.pagination li.page-item a.page-link").last().text()))
    
    let nextPage = (!isLastPage && hasPages) ? currentPage+1 : undefined;
    let previousPage = (currentPage==1 || !hasPages) ? undefined : currentPage-1;
    
    return {
      id: "0",
      items,
      nextPage: nextPage?.toString(),
      previousPage: previousPage?.toString()
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
    const html = await request.get(`${baseUrl}${req.episodeId}`).then(resp => resp.text())
    const $ = load(html);
    const servers: PlaylistEpisodeServer[] = $("div.server-select ul.nav li.nav-item").map((i, item) => {
      const itemRef = $(item);
      const displayName = itemRef.find("span").text();
      const navLink = itemRef.find("a.nav-link");

      let sourceId = navLink.attr("data-id");
      if (!sourceId)
        sourceId = navLink.attr("data-linkid");

      const description = navLink.attr("title"); // Kinda useless but oh well
      
      return { 
        id: JSON.stringify({id: sourceId, provider: displayName}), // Quite dirty, but easier for comparaisons after. 
        displayName, 
        description 
      } 
    }).get()    
    
    return [{
      id: "FlixHQ",
      displayName: "FlixHQ",
      servers
    }]
  };

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    const serverJson = JSON.parse(req.serverId);
    const url = `${baseUrl}/ajax/episode/sources/${serverJson.id}`
    const data: any = await request.get(url).then(resp => resp.json())

    const provider = serverJson["provider"].toLowerCase();
    const source = await new UrlMatcher({
      "upcloud": VidCloudE,
      "vidcloud": VidCloudE,
      "upstream": UpstreamE,
      "doodstream": DoodE,
      "voe": VoeE
    }, data["link"], provider).getResult()
    
    return {
      links: source.videos.map((video) => ({
        url: video.url,
        // @ts-ignore
        quality: PlaylistEpisodeServerQualityType[video.quality] ?? PlaylistEpisodeServerQualityType.auto,
        format: video.isDASH ? PlaylistEpisodeServerFormatType.dash : PlaylistEpisodeServerFormatType.hsl
      })).sort((a, b) => b.quality - a.quality),
      skipTimes: [], // Don't think there's any?
      headers: {},
      subtitles: source.subtitles ?? [],
    }
  }
}
