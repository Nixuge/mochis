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
import { getVideo } from './extractors';

export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'flixhq',
    name: 'FlixHQ',
    version: '0.0.35',
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
    console.log(`${baseUrl}${req.episodeId}`);
    
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
    // TODO: PARSE SUBTITLES (TRACKS) HERE !
    // SHOULD BE IN DATA !!
    console.log('a');
    console.log(data);
    console.log(req.serverId);
    
    const source = await getVideo(data["link"], serverJson["provider"])
    
    return {
      links: source.videos.map((video) => ({
        url: video.url,
        // @ts-ignore
        quality: PlaylistEpisodeServerQualityType[video.quality] ?? PlaylistEpisodeServerQualityType.auto,
        format: video.isDASH ? PlaylistEpisodeServerFormatType.dash : PlaylistEpisodeServerFormatType.hsl
      })).sort((a, b) => b.quality - a.quality),
      skipTimes: [], // Don't think there's any?
      headers: {},
      subtitles: [], // TODO!!!
    }
  }
}
