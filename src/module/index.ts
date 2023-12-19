import { DiscoverListingOrientationType, DiscoverListingType, } from '@mochiapp/js/src/interfaces/source/types';

import type {
    DiscoverListing,
    DiscoverListingsRequest,
//   DiscoverListing,
//   DiscoverListingsRequest,
  Paging,
  Playlist,
  PlaylistDetails,
  PlaylistEpisodeServerRequest,
  PlaylistEpisodeServerResponse,
  PlaylistEpisodeSource,
  PlaylistEpisodeSourcesRequest,
  PlaylistItemsOptions,
  PlaylistItemsResponse,
//   PlaylistDetails,
  PlaylistItem,
  SearchFilter,
  SearchQuery,
  PlaylistEpisodeServer,
  MochiResponse,
} from '@mochiapp/js/dist';
import {
  PlaylistEpisodeServerFormatType,
//   PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
//   PlaylistEpisodeServerRequest,
//   PlaylistEpisodeServerResponse,
//   PlaylistEpisodeSource,
//   PlaylistEpisodeSourcesRequest,
//   PlaylistID,
//   PlaylistItemsOptions,
//   PlaylistItemsResponse,
  PlaylistStatus,
  PlaylistType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';
import { load } from 'cheerio';
import { getVrf, decodeVideoSkipData } from './utils/urlGrabber';
import { getVideo } from './extractors';
import { parseSkipData } from './utils/skipData';
const BASENAME = 'https://aniwave.to'
const AJAX_BASENAME = 'https://aniwave.to/ajax'

export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'AniwaveSource',
    name: 'Aniwave Source',
    version: '0.0.9',
  }

  async discoverListings(request?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    // REALLY DIRTY WORKAROUND
    // to just use search for this before i get to implementing it correctly
    // Edit: this doesn't even seem to be working lol
      return [{
        id: "0",
        title: "Hello there",
        type: DiscoverListingType.default,
        orientation: DiscoverListingOrientationType.portrait,
        paging: await this.search({query:"", page:"1", filters:[]})
      }]

  }
  async playlistDetails(id: string): Promise<PlaylistDetails> {
    return {
      synopsis: "Not yet implemented",
      genres: [],
      yearReleased: 1969,
      previews: [],
      altBanners: [],
      altPosters: [],
      altTitles: [],
    } satisfies PlaylistDetails
  }
  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    console.log(playlistId);
    let html;
    try {
    html = await request.get(`${BASENAME}/watch/${playlistId}`)
    } catch(e) {
      console.log(e);
    }
    const $ = load(html.text());
    const data_id = $("div#watch-main").attr("data-id");
    // @ts-ignore
    const episodesHtml = (await request.get(`${AJAX_BASENAME}/episode/list/${data_id}?vrf=${getVrf(parseInt(data_id))}`)).json()["result"] 
    const $$ = load(episodesHtml);
    // Note: THIS CURRENTLY DOES NOT HANDLE THINGS PROPERLY, ONLY IF THERES A SINGLE EPISODE ON A SINGLE SOURCE LIKE IN THE TEST
    // THIS IS MORE OF A WIP THAN ANYTING AS OF NOW
    // See Gogo module for a proper implementation
    // Note after:
    // HOW TO PARSE THIS:
    // Bad news: we can't differentiate between softsub and hardsub.
    // Good news: we can differentiate between sub and dub, thanks to aniwave providing a selector to choose the episode based on your preference:
    // "sub & dub", "only sub" or "dub only"
    // This should be implemented & made so that if "sub only" is selected, it also shows the softsub options.
    const allEpisodesRawNoOrganization =  $$("a").map((i, li) => {
        const inScraper = $$(li);
        const data_ids = inScraper.attr("data-ids")!;
        const num = parseInt(inScraper.text());
        return {
            id: data_ids,
            number: num, // episode number
            tags: []
        } satisfies PlaylistItem
    }).get()
    // this is the good structure, except hardcoded for a quick & ez try at setup
    return [
      {
        id: playlistId,
        number: 1,
        variants: [{
          id: "subtemp",
          title: "sub",
          pagings: [
            {
              id: "1-1things",
              title: "1-1",
              items: allEpisodesRawNoOrganization
            }
          ]
        }]
      }
    ]
    
  }
  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    // for now will return every server, dub or sub.
    // @ts-ignore
    const html = (await request.get(`${AJAX_BASENAME}/server/list/${req.episodeId}?vrf=${getVrf(req.episodeId)}`)).json()["result"];
    const $ = load(html);
    
    const servers: PlaylistEpisodeServer[] = $(".type").map((i, serverCategory) => {
      const categoryRef = $(serverCategory);
      const sourceType = categoryRef.find("label").text().trim()
      return categoryRef.find("ul").find("li").map((i, server) => {
        const serverRef = $(server);
        const serverName = serverRef.text();
        const linkId = serverRef.attr("data-link-id")!;
        return {
          id: linkId,
          displayName: `[${sourceType}] ${serverName}`
        } satisfies PlaylistEpisodeServer
      }).get()
    }).get();
    
    return [{
      id: "servers",
      description: "hello, test",
      servers: servers.filter(s => s.displayName.includes("Mp4upload") || s.displayName.includes("Filemoon")),
      displayName: "Servers"
    }];
  }



  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    // @ts-ignore
    const result: string = (await request.get(`${AJAX_BASENAME}/server/${req.serverId}?vrf=${getVrf(req.serverId)}`)).json()["result"];
    const url = decodeVideoSkipData(result["url"])
    let skipData = parseSkipData(decodeVideoSkipData(result["skip_data"]))
    
    const videos = await getVideo(url);

    return {
      links: videos.map((video) => ({
        url: video.url,
        // @ts-ignore
        quality: PlaylistEpisodeServerQualityType[video.quality] ?? PlaylistEpisodeServerQualityType.auto,
        format: video.isM3U8 ? PlaylistEpisodeServerFormatType.hsl : PlaylistEpisodeServerFormatType.dash
      })).sort((a, b) => b.quality - a.quality),
      skipTimes: skipData,
      headers: videos[0]?.headers ?? {},
      subtitles: [],
    }
  }

  async searchFilters(): Promise<SearchFilter[]>  {
    return [];
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {
    const currentPageInt = (searchQuery.page == undefined) ? 1 : parseInt(searchQuery.page)
    // NOTE: THIS IS A DIRTY WORKAROUND FOIR THE DISCOVERLISTINGS.
    // WHEN IT'S PRESENT, JUST SORT AS TRENDING.
    // THIS WILL NEED TO GO AWAY.
    let html: MochiResponse;
    if (searchQuery.filters)
      html = await request.get(`${BASENAME}/filter?keyword=${searchQuery.query}&page=1`)
    else
      html = await request.get(`${BASENAME}/filter?keyword=${searchQuery.query}&page=1&sort=trending`)
    
    // const html = await request.get(`https://aniwave.to/filter?keyword=${searchQuery.query}&page=${currentPageInt}`)
    const $ = load(html.text());

    const pages = $('ul.pagination > li.page-item');    
    const lastPageSelector = parseInt(pages.contents().filter(function() {
        const text: string = $(this).text()
        // @ts-ignore
        return text == parseInt(text, 10)
    }).last().text())

    const hasNextPage = (lastPageSelector != Number.NaN) && (lastPageSelector > currentPageInt)
    // console.log(html.text());
    
    // console.log($("#list-items"));
    

    const items: Playlist[] = $('#list-items > div.item').map((i, anime) => {
      const animeRef = $(anime);
      
      const metaRef = animeRef.find('div.b1 > a.name.d-title');
      const url = metaRef.attr('href')?.split('/').pop() ?? '';
      
      const name = metaRef.text();
      const img = animeRef.find('div > a > img').attr('src') ?? '';
      return {
        id: url,
        url: `${BASENAME}/category/${url}`,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video,
        title: name,
        bannerImage: img,
        posterImage: img,
      } satisfies Playlist
    }).get();

    

    return {
      id: `${BASENAME}/search.html?keyword=${searchQuery.query}&page=${searchQuery.page ?? 1}`,
      nextPage: hasNextPage ? `${BASENAME}/search.html?keyword=${searchQuery.query}&page=${currentPageInt+1}` : undefined,
      items: items,
      previousPage: `${BASENAME}/search.html?keyword=${searchQuery.query}&page=${Math.max(1, currentPageInt)}`,
      title: "Test scraper",
    };
  }
}
