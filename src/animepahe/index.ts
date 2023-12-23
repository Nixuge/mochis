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
  PlaylistStatus,
  PlaylistType,
  SourceModule,
  VideoContent
} from '@mochiapp/js/dist';
import { PaheRelease } from './models/types';
import { baseUrl } from './utils/constants';
import { fetchScrapeEpisodes, paheToPlaylistItem } from './scraper/episodeScraper';
import { KwikE } from './extractors/kwik';
import { load } from 'cheerio';

// NOTE:
// unlike my other scrapers, a bunch of things here are from consumet.
// Adapted & sometimes made faster (anime's episodes requests now parallel)

export default class Source extends SourceModule implements VideoContent {
  async searchFilters(): Promise<SearchFilter[]> {
    return [];
  }
  async discoverListings(request?: DiscoverListingsRequest | undefined): Promise<DiscoverListing[]> {
    return [];
  }
  metadata = {
    id: 'animepahe',
    name: 'AnimePahe',
    version: '0.1.0',
    icon: "https://animepahe.com/pikacon.ico"
  }

  async search(searchQuery: SearchQuery): Promise<Paging<Playlist>> {
    try {
      // TODO: HANDLE MULTI PAGES SEARCH
      const data: PaheRelease = await request.get(`${baseUrl}/api?m=search&q=${encodeURIComponent(searchQuery.query)}`).then(resp => resp.json());

      const res: Playlist[] = data.data.map((item: any) => ({
        id: `${item.id}/${item.session}`,
        title: item.title,
        posterImage: item.poster,
        url: `${item.id}/${item.session}`,
        status: PlaylistStatus.unknown, // TODO: SCRAPE THIS
        type: PlaylistType.video,
      } satisfies Playlist))

      return {
        id: "0",
        previousPage: data.prev_page_url,
        nextPage: data.next_page_url,
        items: res
      }
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    const animeInfo: PlaylistDetails = {
      altTitles: [],
      altPosters: [],
      altBanners: [],
      genres: [],
      previews: []
    } satisfies PlaylistDetails;

    try {
      const res = await request.get(
        `${baseUrl}/anime/${id.split('/')[1]}?anime_id=${id.split('/')[0]}`
      );
      const $ = load(res.text());

      animeInfo.altTitles = [$('div.title-wrapper > h1 > span').first().text()];
      animeInfo.altPosters = [$('div.anime-poster a').attr('href')!];
      animeInfo.altBanners = [`https:${$('div.anime-cover').attr('data-src')}`]; // not sure about that one
      animeInfo.synopsis = $('div.anime-summary').text();
      animeInfo.genres = $('div.anime-genre ul li')
        .map((i, el) => $(el).find('a').attr('title'))
        .get();

      return animeInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    // TODO: FIX THAT TO USE PAGE
    // EXPLANATION: on pahe, if page is -1 (def) scrape everything, otherwise scrape page selected
    // here (simpler): scrape everything (lol)
    const id = playlistId.split('/')[1];

    const data = await fetchScrapeEpisodes(id, 1)
    const lastPage = data.last_page;
    const episodes = [...data.data];
    if (lastPage > 1) {
      // Run all requests in parralel
      const tasks: Promise<PaheRelease>[] = []
      for (let i = 2; i <= lastPage; i++) {
        tasks.push(fetchScrapeEpisodes(id, i))
      }
      for (const task of tasks) {
        episodes.push(...((await task).data))
      }
    }
    return [{
      id: "1",
      number: 1,
      variants: [{
        id: "1",
        title: "Episodes",
        pagings: [{
          id: "1",
          // previousPage?: PagingID,
          // nextPage?: PagingID,
          items: episodes.map((ep) => paheToPlaylistItem(ep))
        }]
      }]
    }]
  }

  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    const playlistId = req.playlistId.split('/')[1];

    try {
      const html = await request.get(`${baseUrl}/play/${playlistId}/${req.episodeId}`, {
        headers: {
          Referer: `${baseUrl}`,
        },
      }).then(resp => resp.text());

      const $ = load(html);

      const servers = $('div#resolutionMenu > button').map((i, el) => ({
        id: $(el).attr('data-src')!,
        displayName: $(el).text(),
        // audio: $(el).attr('data-audio'),
      } satisfies PlaylistEpisodeServer)).get();

      return [{
        id: "animepahe",
        displayName: "AnimePahe",
        servers
      }];
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    const video = (await new KwikE(req.serverId, "").extract())[0];

    return {
      links: [{
        url: video.url,
        quality: PlaylistEpisodeServerQualityType.auto,
        format: PlaylistEpisodeServerFormatType.hsl
      }],
      skipTimes: [],
      headers: {},
      subtitles: [],
    }
  }
}
