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
} from '@mochiapp/js/dist';
import {
//   PlaylistEpisodeServerFormatType,
//   PlaylistEpisodeServerQualityType,
//   PlaylistEpisodeServerRequest,
//   PlaylistEpisodeServerResponse,
//   PlaylistEpisodeSource,
//   PlaylistEpisodeSourcesRequest,
//   PlaylistID,
//   PlaylistItemsOptions,
//   PlaylistItemsResponse,
  PlaylistGroup,
  PlaylistStatus,
  PlaylistType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';
import { load } from 'cheerio';
import { getVrf, decodeVideoSkipData } from './utils/urlGrabber';
const BASENAME = 'https://aniwave.to'
// const AJAX_BASENAME = 'https://ajax.gogo-load.com/ajax/'

export default class Source extends SourceModule implements VideoContent {
    // todo: see if use stores (pinia?)
    data_id!: string
    constructor() {
        super()
    }
  discoverListings(request?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
      throw new Error('Method not implemented.');
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
    const html = await request.get(`https://aniwave.to/${playlistId}`)
    // const html = await request.get(`https://aniwave.to/filter?keyword=${searchQuery.query}&page=${currentPageInt}`)
    const $ = load(html.text());
    const data_id = $("div#watch-main").attr("data-id");
    // @ts-ignore
    const episodesHtml = (await request.get(`https://aniwave.to/ajax/episode/list/${data_id}?vrf=${getVrf(parseInt(data_id))}`)).json()["result"] 
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
    const html = (await request.get(`https://aniwave.to/ajax/server/list/${req.episodeId}?vrf=${getVrf(req.episodeId)}`)).json()["result"];
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
  playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
      throw new Error('Method not implemented.');
  }

  metadata = {
    id: 'AniwaveSource',
    name: 'Aniwave Source',
    version: '0.0.1',
  }

  async searchFilters(): Promise<SearchFilter[]>  {
    return [];
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {
    const currentPageInt = (searchQuery.page == undefined) ? 1 : parseInt(searchQuery.page)
    const html = await request.get(`https://aniwave.to/filter?keyword=${searchQuery.query}&page=1`)
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


//   async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
//     const sources = await getServerSources(`${BASENAME}/${req.episodeId}`, req.sourceId);
//     return {
//       links: sources.map((source) => ({
//         url: source.url,
//         // @ts-ignore
//         quality: PlaylistEpisodeServerQualityType[source.quality] ?? PlaylistEpisodeServerQualityType.auto,
//         format: PlaylistEpisodeServerFormatType.dash
//       })).sort((a, b) => b.quality - a.quality),
//       skipTimes: [],
//       headers: {},
//       subtitles: [],
//     }
//   }

//   async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
//     const html = await request.get(`${BASENAME}/${req.episodeId}`).then(t => t.text())
//     const $ = load(html)
//     const servers = $('div.anime_muti_link > ul > li').map((i, el) => {
//       const nodes = $(el).find('a').get(0)?.childNodes ?? [];
//       const displayName = nodes.length > 2 ? nodes[nodes.length - 2] : undefined;
//       return {
//         id: $(el).attr('class') ?? `${BASENAME}/${req.episodeId}-${i}`,
//         displayName: displayName && displayName.nodeType === 3 ? displayName.data : $(el).attr('class') ?? 'NOT_FOUND',
//       } satisfies PlaylistEpisodeServer
//     }).get();

//     return [{
//       id: 'servers',
//       // Filter only working ones
//       servers: servers.filter(s => s.id === 'anime' || s.id === 'vidcdn'),
//       displayName: "Servers",
//     }]
//   }

//   async playlistEpisodes(playlistId: PlaylistID, options?: PlaylistItemsOptions): Promise<PlaylistItemsResponse> {
//     const variantGroups = playlistId.endsWith('-dub') ? [playlistId, playlistId.replace('-dub', '')] : [playlistId, `${playlistId}-dub`]
//     let variants = await Promise.all(variantGroups.map(async id => {
//       const variantId = id.endsWith("-dub") ? "DUB" : "SUB";
//       const html = await request.get(`${BASENAME}/category/${id}`);
//       const $ = load(html.text());
//       const pages = $('#episode_page > li').map((_, page) => {
//         const a = $(page).find('a')
//         return ({
//           episodeStart: a.attr('ep_start'),
//           episodeEnd: a.attr('ep_end'),
//         })
//       }).get()
//       const movieId = $('#movie_id').attr('value')
//       const pagings = await Promise.all(pages.map(async (page) => {
//         const episodes = load(await request.get(`${AJAX_BASENAME}/load-list-episode?ep_start=${page.episodeStart}&ep_end=${page.episodeEnd}&id=${movieId}&default_ep=${0}&alias=${id}`).then(t => t.text()))
//         const video = episodes('#episode_related > li').map((i, episode) => {
//           const link = episodes(episode).find('a').attr('href')?.slice(2) ?? id
//           const title = $(episode).find('.name').text();
//           return {
//             id: link,
//             title,
//             number: parseInt(title.split(" ")[1], 10),
//             tags: [],
//           } satisfies PlaylistItem
//         }).get().reverse()
//         return {
//           id: `${movieId}-${page.episodeStart}-${page.episodeEnd}`,
//           title: `${page.episodeStart}-${page.episodeEnd}`,
//           items: video
//         }
//       }))
//       return {
//         id: `${movieId}-${variantId}`,
//         title: variantId,
//         pagings,
//       }
//     }))
//     return [{
//       id: 'gogo-playlist',
//       number: 1,
//       variants,
//     }]
//   }
}
