import { PlaylistGroup, PlaylistGroupVariant, } from '@mochiapp/js/src/interfaces/source/types';

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
import { getVrf, decodeVideoSkipData } from './utils/urlGrabber';
import { getVideo } from './extractor';
import { parseSkipData } from './utils/skipData';
import { HomeScraper } from './scraper/homeScraper';
import { BASENAME, AJAX_BASENAME } from './utils/variables';
import { filters, scrapeFilters } from './scraper/filters';
import { isTesting } from '../shared/utils/isTesting';
import { sleep } from '../shared/utils/sleep';
import { scrapeEpisodes, scrapeSeasonsDiv } from './scraper/episodesScraper';


export default class Source extends SourceModule implements VideoContent {
  metadata = {
    id: 'aniwave',
    name: 'Aniwave',
    version: '0.5.0',
    icon: "https://s2.bunnycdn.ru/assets/sites/aniwave/favicon1.png"
  }

  async discoverListings(listingRequest?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    scrapeFilters()
    return await new HomeScraper(listingRequest).scrape()
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    const fullUrl = `${BASENAME}${id}`;
    const html = await request.get(fullUrl);

    const $ = load(html.text());

    const synopsis = $(".info .synopsis .shorting .content").text();

    const mainTitle = $(".info h1.title.d-title").text(); // have to get that to remove it from altTitles
    const altTitles = $(".info .names.font-italic").text().split("; ").filter((altTitle) => altTitle != mainTitle);

    let altPosters: string | string[] | undefined = $("div#player").attr("style")?.replace("background-image:url('", "").replace("')", "");
    
    altPosters = (altPosters == undefined || altPosters == "") ? [] : [altPosters];
    

    const playlistDetails: PlaylistDetails = { 
      synopsis: synopsis, genres: [], previews: [],
      altBanners: [], altPosters, altTitles
    }
    $(".info .bmeta .meta > div").map((i, meta) => {
      const metaRef = $(meta);
      const metaType = metaRef.contents().first().text().trim().replace(":", "").toLowerCase(); // get non deep text
      
      switch (metaType) {
        case "genres":
          playlistDetails.genres = metaRef.text().trim().replace("Genres:  ", "").split(", ");
          break;
        case "date aired":
          const metaText = metaRef.text();
          let year = metaText.match(/, ([0-9]{4}) to /)
          if (year == null)
            year = metaText.match(/, ([0-9]{4})/)
          
          if (year != null)
            playlistDetails.yearReleased =  parseInt(year[1]);
          break;
        default:
          break;
      }
    })
    
    return playlistDetails;
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    // If grabbing another season, just grab that one
    if (options != null) {
      if (options.type != "group")
        throw Error("How did you even end up here ?")
      const currentSeasonEpisodes = (await scrapeEpisodes(options.groupId))!;
      return [currentSeasonEpisodes];
    }
    
    // Otherwise, grab it & check for the all seasons slider
    const currentSeasonEpisodes = (await scrapeEpisodes(playlistId))!;
    const allSeasons = await scrapeSeasonsDiv(playlistId);

    // If only one, obv return that one only
    if (allSeasons.length == 0)
      return [currentSeasonEpisodes];
    
    // Otherwise add its episode data in there.
    // Could also just do allSeasons in there & do the rest in other func calls after,
    // but doing it that way saves one whole request (which is pretty nice since its for the initial load).
    for (const season of allSeasons) {
      if (season.id == currentSeasonEpisodes.id) {
        season.variants = currentSeasonEpisodes.variants;
        season.default = true;
        break;
      }
    }
    
    return allSeasons;
  }

  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    const [episodeId, variantType] = req.episodeId.split(" | ");
    
    
    // @ts-ignore
    const html = (await request.get(`${AJAX_BASENAME}/server/list/${episodeId}?vrf=${getVrf(episodeId)}`)).json()["result"];
    
    const $ = load(html);
    
    const servers: PlaylistEpisodeServer[] = $(".type").map((i, serverCategory) => {
      const categoryRef = $(serverCategory);
      // const sourceType = categoryRef.find("label").text().trim()
      const sourceType = categoryRef.attr("data-type");
      if (sourceType != variantType)
        return undefined;
      
      return categoryRef.find("ul").find("li").map((i, server) => {        
        const serverRef = $(server);
        const serverName = serverRef.text();
        const linkId = serverRef.attr("data-link-id")!;
        return {
          id: linkId,
          displayName: `${serverName}`
        } satisfies PlaylistEpisodeServer
      }).get()
    }).get();
    
    return [{
      id: "servers",
      description: "Aniwave servers",
      servers: servers,
      displayName: "Aniwave"
    }];
  }

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    // @ts-ignore
    const result: string = (await request.get(`${AJAX_BASENAME}/server/${req.serverId}?vrf=${getVrf(req.serverId)}`)).json()["result"];
    const url = decodeVideoSkipData(result["url"])
    let skipData = parseSkipData(decodeVideoSkipData(result["skip_data"]))
    
    const sourceData = await getVideo(url);
    const videos = sourceData.videos;

    return {
        links: videos.map((video) => ({
          url: video.url,
          // @ts-ignore
          quality: PlaylistEpisodeServerQualityType[video.quality] ?? PlaylistEpisodeServerQualityType.auto,
          format: video.isDASH ? PlaylistEpisodeServerFormatType.dash : PlaylistEpisodeServerFormatType.hsl
        })).sort((a, b) => b.quality - a.quality),
        skipTimes: skipData,
        headers: sourceData.headers ?? {},
        subtitles: sourceData.subtitles ?? [],
      }
  }

  async searchFilters(): Promise<SearchFilter[]> {
    while (isTesting() && filters.length == 0) {
      await sleep(10);
    }
    return filters;
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {    
    const currentPageInt = (searchQuery.page == undefined) ? 1 : parseInt(searchQuery.page)
    let filterString = "";
    for (const filter of searchQuery.filters) {
      for (const filterOption of filter.optionIds) {
        filterString += `&${filter.id}=${filterOption}`
      }
    }

    const html = await request.get(`${BASENAME}/filter?keyword=${encodeURIComponent(searchQuery.query)}&page=${currentPageInt}${filterString}`)

    const $ = load(html.text());

    const pages = $('ul.pagination > li.page-item');    
    const lastPageSelector = parseInt(pages.contents().filter(function() {
        const text: string = $(this).text()
        // @ts-ignore
        return text == parseInt(text, 10)
    }).last().text())

    const hasNextPage = (lastPageSelector != Number.NaN) && (lastPageSelector > currentPageInt)

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
      id: `${BASENAME}/search.html?keyword=${searchQuery.query}&page=${searchQuery.page ?? 1}`,
      previousPage: currentPageInt == 1 ? undefined : (currentPageInt+1).toString(),
      nextPage: hasNextPage ? (currentPageInt+1).toString() : undefined,
      items: items,
      title: "Search",
    };
  }
}
