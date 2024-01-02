import {
  DiscoverListing,
  DiscoverListingOrientationType,
  DiscoverListingType,
  Paging,
  Playlist,
  PlaylistDetails,
  PlaylistEpisodeServer,
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerLink,
  PlaylistEpisodeServerQualityType,
  PlaylistEpisodeServerRequest,
  PlaylistEpisodeServerResponse,
  PlaylistEpisodeServerSubtitleFormat,
  PlaylistEpisodeSource,
  PlaylistEpisodeSourcesRequest,
  PlaylistItem,
  PlaylistItemsOptions,
  PlaylistItemsResponse,
  PlaylistStatus,
  PlaylistType,
  SearchFilter,
  SearchQuery,
  SourceModule,
  VideoContent
} from "@mochiapp/js";
import { load } from "cheerio";
import { baseURL, mirrorUrl } from "./utils/constants";
import { EpisodesScraper } from "./scraper/episodesScraper";
import { KinoxServerRequestType } from "./models/types";
import { getVideo } from "./extractor";

export default class Kinox extends SourceModule implements VideoContent {
  metadata = {
    id: 'kinox',
    name: 'kinox.to',
    version: '0.1.0',
    icon: `${baseURL}/gr/favicon.ico`
  }

  async searchFilters(): Promise<SearchFilter[]> {
    // Doesn't seem like there's any
    return [];
  }

  async search(query: SearchQuery): Promise<Paging<Playlist>> {
    const html = await request.get(`${baseURL}/Search.html?q=${query.query.replace(" ", "+")}`).then(resp => resp.text());
    const $ = load(html);
    const items: Playlist[] = $("table.SearchTable tbody tr").map((i, tr) => {
      const trRef = $(tr);
      const titleDiv = trRef.find("td.Title");
      const url = titleDiv.find("a").attr("href")!;

      let title = titleDiv.find("a").text().trim();
      const year = titleDiv.find("span.Year").text().trim();
      if (year != "")
        title = `${title} (${year})`
      
      return {
        id: url,
        title,
        // posterImage?: string;
        // bannerImage?: string;
        url,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video
      } satisfies Playlist;
    }).get()

    return {
      id: "1",
      items
    }
  }

  async discoverListings(): Promise<DiscoverListing[]> {
    const html = await request.get(baseURL).then(resp => resp.text());
    const $ = load(html);
    const tables: DiscoverListing[] = $("div.ModuleHead.mHead").map((i, head) => {
      if (i == 0)
        return undefined; // First "news" tab, ignore lmao
      const headRef = $(head);
      const title = headRef.find("div.Headlne h1").text()

      const tableRef = headRef.nextAll("table.FullModuleTable.CommonTable").first();
      const items: Playlist[] = tableRef.find("tbody tr").map((i, tr) => {
        const trRef = $(tr);
        
        const titleDiv = trRef.find("td.Title");
        const posterImage = baseURL + titleDiv.attr("rel");
        const innerTitleDiv = trRef.find("a, span");
        const id = innerTitleDiv.attr("href")!;
        const title = innerTitleDiv.text();

        return {
          id,
          title,
          posterImage,
          url: id,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video
        }
      }).get()
      
      return {
        id: title,
        title,
        type: DiscoverListingType.default,
        orientation: DiscoverListingOrientationType.portrait,
        paging: {
          id: "0",
          title,
          items,
        }
      }
    }).get()

    return tables;
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    const html = await request.get(baseURL + id).then(resp => resp.text())
    const $ = load(html);

    const yearReleased = parseInt($("span.Year").text().trim().replace("(", "").replace(")", "")); // Lazy but works
    const synopsis = $("div.ModuleDefault div.Descriptore").text().trim(); //Note: seems like it got newlines? To analyse after

    const playlistDetails: PlaylistDetails = {
      synopsis, //Done
      altTitles: [], // X
      altPosters: [], // X
      altBanners: [], // X
      genres: [], // Done in tr loop
      yearReleased, // Done
      ratings: 0, // Done in tr loop
      previews: [] // X
    }

    $("table.CommonModuleTable tbody tr").map((i, tr) => {
      const trRef = $(tr);
      const propName = trRef.find("td.Label").text().toLowerCase().replace(":", "");
      const valueRef = trRef.find("td.Value");
      switch (propName) {
        case "imdb wertung":
          playlistDetails.ratings = parseFloat(valueRef.find("div.IMDBRatingLabel").text().split("/")[0].trim());
          break;
        case "genre":
          const genres = trRef.find("a").map(function() {
            return $(this).text();
          }).get();
          playlistDetails.genres = genres;
        default:
          break;
      }
    })
    
    return playlistDetails;
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    return await new EpisodesScraper(playlistId).scrape()
  }

  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    const html = await request.get(baseURL + req.episodeId).then(resp => resp.text());
    const $ = load(html);

    const servers: PlaylistEpisodeServer[] = $("ul#HosterList li").map((i, host) => {
      const hostRef = $(host);
      return {
        id: hostRef.attr("rel")!,
        displayName: hostRef.find("div.Named").text().trim()
      }
    }).get()

    return [{
      id: "Kinox",
      displayName: "Kinox",
      servers
    }]
  }

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    // movie: https://ww18.kinox.to/aGET/Mirror/T-I-M&Hoster=102
    // episode: https://ww18.kinox.to/aGET/Mirror/What_If-1&Hoster=92&Season=2&Episode=6
    
    let episodeIdMatch: string | RegExpMatchArray | null = req.episodeId.match(/&Season=\d+&Episode=\d+/);
    episodeIdMatch = (episodeIdMatch == null) ? "" : episodeIdMatch[0];
    
    const serverData: KinoxServerRequestType = await request.get(`${baseURL}${mirrorUrl}/${req.serverId}${episodeIdMatch}`).then(resp => resp.json())
    
    const $ = load(serverData.Stream);
    const serverUrl = $("a").attr("href")!;

    const res = await getVideo(serverUrl, serverData.HosterName);
        
    return {
      links: res.videos.map((video) => ({
        url: video.url,
        // @ts-ignore
        quality: PlaylistEpisodeServerQualityType[video.quality] ?? PlaylistEpisodeServerQualityType.auto,
        format: video.isDASH ? PlaylistEpisodeServerFormatType.dash : PlaylistEpisodeServerFormatType.hsl
      })).sort((a, b) => b.quality - a.quality),
      subtitles: res.subtitles ?? [],
      skipTimes: [],
      headers: res.headers ?? {}
    }
  }
}