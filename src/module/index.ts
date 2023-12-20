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
} from '@mochiapp/js/dist';
import {
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
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
    version: '0.1.28',
  }

  async discoverListings(listingRequest?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    const html = await request.get(`${BASENAME}/home`)

    console.log(listingRequest?.listingId);
    console.log(listingRequest?.page);
    
    
    const $ = load(html.text());
    const swiper = $(".swiper-wrapper .swiper-slide.item");
    
    const hotestItems = swiper.map((i, anime) => {
      const animeRef = $(anime)
      const title = animeRef.find("h2.title.d-title").text()
      const image = animeRef.find("div.image > div").attr("style")?.replace("background-image: url('", "").replace("');", "")
      const url = animeRef.find(".info .actions > a").attr("href")!;
      return {
        id: url,
        title: title,
        posterImage: image,
        url: url,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video
      } satisfies Playlist
    }).get()
    
    const hotestListing = {
      title: "Hotest",
      id: "hotest",
      type: DiscoverListingType.featured,
      orientation: DiscoverListingOrientationType.landscape,
      paging: {
        id: "hotest",
        title: "Hotest",
        items: hotestItems
        // Note: might do nextPage, since i think it's just the /trending? (kinda)
        // edit: to see, seeems like it's partially using ajax, check f12 when clicking on "all" "sub" "dub" etc on "Recently Updates"
      } satisfies Paging<Playlist>
    } satisfies DiscoverListing

    const recentUpdatesSec = $("#recent-update .body .ani.items .item");
    // TODO: MOVE THIS TO SCRAPER/ANIMEITEMS & USE IN SEARCH()
    const recentlyUpdatedItems = recentUpdatesSec.map((i, anime) => {
      const animeRef = $(anime);
      const titleElem = animeRef.find("a.name.d-title");
      const title = titleElem.text();
      const url = titleElem.attr("href")!;
      const image = animeRef.find("div.ani.poster > a > img").attr("src");      
      return {
        id: url,
        title: title,
        posterImage: image,
        url: url,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video
      } satisfies Playlist
    }).get()

    // Note: as of now those aren't working for some reason?
    const previousRecentlyUpdatedPage = (listingRequest == undefined || listingRequest.page == "1") ? undefined : (parseInt(listingRequest.page) - 1).toString();
    const nextRecentlyUpdatedPage = (listingRequest == undefined) ? "2" : (parseInt(listingRequest.page) + 1).toString();
        
    const recentlyUpdatedListing = {
      title: "Recently Updated",
      id: "recently-updated",
      type: DiscoverListingType.default,
      orientation: DiscoverListingOrientationType.portrait,
      paging: {
        id: "recently-updated",
        title: "Recently Updated",
        items: recentlyUpdatedItems,
        previousPage: previousRecentlyUpdatedPage,
        nextPage: nextRecentlyUpdatedPage
      } satisfies Paging<Playlist>
    } satisfies DiscoverListing

    return [hotestListing, recentlyUpdatedListing]
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {   
    const watch = id.startsWith("/watch/") ? "" : "/watch/";
    const fullUrl = `${BASENAME}${watch}${id}`;
    const html = await request.get(fullUrl);

    const $ = load(html.text());

    const synopsis = $(".info .synopsis .shorting .content").text();

    const mainTitle = $(".info h1.title.d-title").text(); // have to get that to remove it from altTitles
    const altTitles = $(".info .names.font-italic").text().split("; ").filter((altTitle) => altTitle != mainTitle);

    let altPoster: string | string[] | undefined = $("div#player").attr("style")?.replace("background-image:url('", "").replace("')", "");
    altPoster = (altPoster == undefined) ? [] : [altPoster];

    const playlistDetails: PlaylistDetails = { 
      synopsis: synopsis, genres: [], previews: [],
      altBanners: [], altPosters: altPoster, altTitles: altTitles
    }
    $(".info .bmeta .meta > div").map((i, meta) => {
      const metaRef = $(meta);
      const metaType = metaRef.contents().first().text().trim().replace(":", "").toLowerCase(); // get non deep text
      
      switch (metaType) {
        case "genres":
          playlistDetails.genres = metaRef.text().trim().replace("Genres:  ", "").split(", ");
          break;
        case "date aired":
          playlistDetails.yearReleased = parseInt(metaRef.text().match(/, ([0-9]{4}) to /)![1]);
          break;
        default:
          break;
      }
    })
    
    return playlistDetails;
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    const watch = playlistId.startsWith("/watch/") ? "" : "/watch/"
    const fullUrl = `${BASENAME}${watch}${playlistId}`
    
    const html = await request.get(fullUrl)
    const $ = load(html.text());
    const data_id = $("div#watch-main").attr("data-id");
    // @ts-ignore
    const episodesHtml = (await request.get(`${AJAX_BASENAME}/episode/list/${data_id}?vrf=${getVrf(parseInt(data_id))}`)).json()["result"] 
    const $$ = load(episodesHtml);
    
    const episodeCounts = $$(".dropdown.filter.range .dropdown-menu .dropdown-item");
    const firstEpisode = parseInt(episodeCounts.first().text().split("-")[0]);
    const lastEpisode = parseInt(episodeCounts.last().text().split("-")[1]);
    const allEpisodes = `${firstEpisode}-${lastEpisode}`;
    
    const answer: PlaylistGroup = {
      id: playlistId,
      number: 1, // not much way to reliably grab this
      variants: []
    }

    function makeDummyVariantObject(type: string) {
      return {
        id: type.toLowerCase(),
        title: type,
        pagings: [
          {
            id: allEpisodes,
            title: allEpisodes,
            items: []
          }
        ]

      } satisfies PlaylistGroupVariant
    }

    $$("li").map((i, li) => {
        const inScraper = $$(li);
        // data ids needed for next step
        const dataIds = inScraper.find("a").attr("data-ids")!;                
        // episode number
        const episodeNum = parseInt(inScraper.find("a").attr("data-num")!);
        // episode title
        const titleDiv = inScraper.find("a").find("span.d-title");
        const episodeTitle = (titleDiv.text()) ? titleDiv.text() : undefined;

        // the "title" attribute on the lis has all the properties to grab sub/dub/softsub
        let episodeReleaseDate: string | undefined = undefined;
        let variantReleaseDates: string | IterableIterator<RegExpMatchArray> | undefined = inScraper.attr("title");
        variantReleaseDates = variantReleaseDates?.matchAll(/- ([a-zA-Z]*?): ([0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2} .*?) /g)!;

        
        for (let match of variantReleaseDates) {
          const variantType = match[1];
          if (variantType == "Release") {
            episodeReleaseDate = match[2]; // SHOULD work (should)
            continue;
          }
          // Never happens, but makes the compiler happy
          if (answer.variants == undefined)
            answer.variants = [];
          
          // get playlist group for variantType
          let playlistGroup: PlaylistGroupVariant | undefined = undefined;
          const playlistGroups = answer.variants.filter(variant => variant.title == variantType);
          if (playlistGroups.length == 0) {
            playlistGroup = makeDummyVariantObject(variantType);
            answer.variants.push(playlistGroup)
          } else {
            playlistGroup = playlistGroups[0];
          }
          playlistGroup.pagings?.[0].items?.push({
            id: dataIds + " | " + variantType.toLowerCase(), // kinda dirty but idk how else to pass data through to the next step
            title: episodeTitle,
            number: episodeNum,
            timestamp: episodeReleaseDate as unknown as Date,
            tags: []
          } satisfies PlaylistItem)
        }
    })
    return [answer];
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
    const videos = sourceData.sources;

    return {
        links: videos.map((video) => ({
          url: video.url,
          // @ts-ignore
          quality: PlaylistEpisodeServerQualityType[video.quality] ?? PlaylistEpisodeServerQualityType.auto,
          format: video.isM3U8 ? PlaylistEpisodeServerFormatType.hsl : PlaylistEpisodeServerFormatType.dash
        })).sort((a, b) => b.quality - a.quality),
        skipTimes: skipData,
        headers: sourceData.headers ?? {},
        subtitles: sourceData.subtitles ?? [],
      }
  }

  async searchFilters(): Promise<SearchFilter[]>  {
    return [];
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {
    const currentPageInt = (searchQuery.page == undefined) ? 1 : parseInt(searchQuery.page)
    const html = await request.get(`${BASENAME}/filter?keyword=${encodeURIComponent(searchQuery.query)}&page=1`)

    
    // const html = await request.get(`https://aniwave.to/filter?keyword=${searchQuery.query}&page=${currentPageInt}`)
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
