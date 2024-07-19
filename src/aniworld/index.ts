import {
  DiscoverListing,
  DiscoverListingOrientationType,
  DiscoverListingType,
  Paging,
  Playlist,
  PlaylistDetails,
  PlaylistEpisodeServerFormatType,
  PlaylistEpisodeServerQualityType,
  PlaylistEpisodeServerRequest,
  PlaylistEpisodeServerResponse,
  PlaylistEpisodeSource,
  PlaylistEpisodeSourcesRequest,
  PlaylistItemsOptions,
  PlaylistItemsResponse,
  PlaylistStatus,
  PlaylistType,
  SearchFilter,
  SearchQuery,
  SourceModule,
  VideoContent,
} from "@mochiapp/js";
import { getUrlInfo, getPlaylistImages, convertPosterSize, sanitizeHtml } from "./utils";
import * as cheerio from "cheerio";
import { scrapeAvailableLanguages, scrapeGenres, scrapeGroups, scrapeSynopsis } from "./scraper";
import { VoeE } from "../shared/extractors/voe";
import { ISource } from "../shared/models/types";
import { VidozaE } from "../shared/extractors/vidoza";
import { StreamtapeE } from "../shared/extractors/streamtape";
import { SAFARI_USER_AGENT } from "../shared/utils/userAgent";
import { DoodE } from "../shared/extractors/dood";
import { isTesting } from "../shared/utils/isTesting";

// very ugly hack to change BASE_URL
// this is needed bc mochi js implementation cannot read class properties
// pls fix erik :-(
let BASE_URL = "https://aniworld.to";

export default class AniWorld extends SourceModule implements VideoContent {
  static LANGUAGES = new Map(
    Object.entries({
      german: "GerDub",
      "japanese-german": "GerSub",
      "japanese-english": "EngSub",
    })
  );

  metadata = {
    id: "aniworld",
    name: "AniWorld (@dominik)",
    description: "Almost all credits to @d9menik for this.",
    icon: `${BASE_URL}/favicon.ico`,
    version: '1.1.8',
  };

  constructor(baseUrl?: string) {
    super();
    BASE_URL = baseUrl || "https://aniworld.to";
  }

  async searchFilters(): Promise<SearchFilter[]> {
    return [];
  }

  async search(query: SearchQuery): Promise<Paging<Playlist>> {
    const response = await request.post(`${BASE_URL}/ajax/search`, {
      body: `keyword=${query.query}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const data = response.json() as { title: string; description: string; link: string }[];

    const ids: string[] = [];

    const playlists: Promise<Playlist>[] = data
      // .filter(({ link }) => link.startsWith("/anime/stream/")) // animes only
      .filter(({ link }) => link.split("/").length === 4) // no specific season or episode results
      .filter(({ link }) => {
        const id = link.split("/")[3];
        if (ids.includes(id)) return false;
        ids.push(id);
        return true;
      }) // remove duplicate results
      .map(async (item) => {
        const { id } = getUrlInfo(item.link);
        const { posterImage, bannerImage } = await getPlaylistImages(id);

        return {
          id,
          title: sanitizeHtml(item.title),
          url: `${BASE_URL}${item.link}`,
          posterImage,
          bannerImage,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video,
        } satisfies Playlist;
      });

    return {
      id: "",
      items: await Promise.all(playlists), // thx @ElNixu for parallel loading of images
    };
  }

  async discoverListings(): Promise<DiscoverListing[]> {
    console.log(BASE_URL);

    const response = await request.get(`${BASE_URL}`);
    const $ = cheerio.load(response.text());

    const carousels = $(".carousel:not(.animeNews)")
      .toArray()
      .map((carousel) => {
        return {
          id: $(carousel).find("h2").text().toLowerCase().replace(" ", "-"),
          title: $(carousel).find("h2").text(),
          type: DiscoverListingType.default,
          orientation: DiscoverListingOrientationType.portrait,
          paging: {
            id: "0",
            items: $(carousel)
              .find(".coverListItem > a")
              .toArray()
              .map((a) => {
                return {
                  id: $(a).attr("href")!,
                  title: $(a).find("h3").text(),
                  posterImage: convertPosterSize(
                    `${BASE_URL}${$(a).find("img").attr("data-src")!}`,
                    220
                  ),
                  bannerImage: undefined,
                  url: `${BASE_URL}${$(a).attr("href")}`,
                  status: PlaylistStatus.unknown,
                  type: PlaylistType.video,
                } satisfies Playlist;
              }),
          },
        } satisfies DiscoverListing;
      });

    return [...carousels];
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {    
    const response = await request.get(`${BASE_URL}${id}`);
    const $ = cheerio.load(response.text());

    let yearReleased;
    try {
      yearReleased = parseInt($("span[itemprop='startDate'] > a").text());
    } catch {
      yearReleased = undefined;
    }

    return {
      synopsis: scrapeSynopsis($),
      altTitles: [],
      altPosters: [],
      altBanners: [],
      genres: scrapeGenres($),
      yearReleased,
      ratings: undefined,
      previews: [],
    };
  }

  async playlistEpisodes(
    playlistId: string,
    options?: PlaylistItemsOptions | undefined
  ): Promise<PlaylistItemsResponse> {
    const groupId = options?.groupId || "";

    const response = await request.get(`${BASE_URL}${playlistId}/${groupId}`);
    const $ = cheerio.load(response.text());

    return scrapeGroups($);
  }

  async playlistEpisodeSources(
    req: PlaylistEpisodeSourcesRequest
  ): Promise<PlaylistEpisodeSource[]> {
    const { playlistId, episodeId: _episodeId } = req;
    const [groupId, episodeId, variantId] = _episodeId.split("/");

    const response = await request.get(
      `${BASE_URL}${playlistId}/${groupId}/${episodeId}`
    );
    const $ = cheerio.load(response.text());

    const availableLanguages = scrapeAvailableLanguages($);
    const langKey =
      availableLanguages.find(({ id }) => id === variantId)?.langKey ||
      availableLanguages[0].langKey;

    const servers = $(".hosterSiteVideo > ul.row > li")
      .toArray()
      .filter((li) => $(li).attr("data-lang-key") == langKey) // filter by language
      .map((li) => {
        const id = $(li).attr("data-link-target")!.split("/").at(-1)!;
        const displayName = $(li).find("h4").text();
        return { id: `${displayName.toLowerCase()}/${id}`, displayName };
      })
      // .filter(({ displayName }) => displayName.toLowerCase() == "doodstream"); // filter for supported servers

    return [
      {
        id: "aniworld",
        displayName: "AniWorld",
        description: undefined,
        servers,
      },
    ];
  }

  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    const { serverId: _serverId } = req;
    const [serverId, redirectId] = _serverId.split("/");

    const url = `${BASE_URL}/redirect/${redirectId}`;

    const resp = await request.get(
      url, {headers: {"User-Agent": SAFARI_USER_AGENT}} // Seems to flag CF less (especially for streamtape)
    );
    const content = resp.text();
    
    // For some obscure reason this thing DOES NOT SPIT OUT THE REDIRECTED URL.
    // We try to get it using the response cookies in a dirty way.
    let domain = redirectId;
    try {
      let cookieKey = isTesting() ? "set-cookie" : "Set-Cookie";

      domain = resp.headers[cookieKey].match(/domain=\.(.*?);/s)![1];
      domain = `https://${domain}/`;
      console.log("Got domain: " + domain)
    } catch(e) {
      console.warn("Couldn't get domain. Things may go wrong.")
    }

    let source: ISource;
    if (serverId == "voe") {
      source = await new VoeE(domain, content).extract()
    } else if (serverId == "vidoza") {
      source = await new VidozaE(domain, content).extract()
    } else if (serverId == "streamtape") {
      source = await new StreamtapeE(domain, content).extract()
    } else if (serverId == "doodstream") {
      source = await new DoodE(domain, content).extract()
    } else {
      console.error(serverId);
      console.error(redirectId);
      throw Error("Unimplemented server.")
    }

    
    return {
      links: source.videos.map((video) => ({
        url: video.url,
        quality: PlaylistEpisodeServerQualityType[video.quality!] ?? PlaylistEpisodeServerQualityType.auto,
        format: video.isDASH ? PlaylistEpisodeServerFormatType.dash : PlaylistEpisodeServerFormatType.hsl
      })).sort((a, b) => b.quality - a.quality),
      subtitles: source.subtitles ?? [],
      skipTimes: [],
      headers: source.headers ?? {},
    };
  }
}
