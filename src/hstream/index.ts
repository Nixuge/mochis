import {
  DiscoverListing,
  DiscoverListingOrientationType,
  DiscoverListingType,
  Paging,
  Playlist,
  PlaylistDetails,
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
import { baseUrl } from "./utils/constants";
import { load } from "cheerio";
import { grabSetCookieValues } from "../shared/utils/cookies";
import { PlayerApiResponse } from "./models/types";

export default class Hstream extends SourceModule implements VideoContent {
  metadata = {
    id: 'hstream||NSFW||Nixuge\'s NSFW Mochi Repo||NSFW modules for Mochi||https://upload.wikimedia.org/wikipedia/commons/f/f8/Stylized_uwu_emoticon.svg',
    name: 'hstream.moe',
    version: '0.0.27',
    icon: "https://hstream.moe/images/cropped-HS-1-270x270.png"
  }

  async searchFilters(): Promise<SearchFilter[]> {
    // TODO
    return [];
  }

  async search(query: SearchQuery): Promise<Paging<Playlist>> {
    // TODO
    // Note: their search api seems a bit hard to use, will see if use that (which returns html anyways)
    // or if i just scrape the /page=X things
    return {
      id: "0",
      items: []
    }
  }

  async discoverListings(): Promise<DiscoverListing[]> {
    const html = await request.get(baseUrl).then(resp => resp.text())
    // Scraping top 3 tabs
    const $ = load(html);

    // Note: this may look weird (using a map for a single element? But i just want to avoid polluting the function's namespace w too many var names)
    const recentAndTrendingTabs = $("main div.mx-auto.pt-2.z-10:not(.relative)").map((i, tab) => {      
      const tabRef = $(tab);
      
      const titles = tabRef.find("ul li");
      const elements = tabRef.find("div.mb-6 div.transition-opacity");
      if (titles.length != elements.length)
        throw Error("Assertion failed! titles.length & elements.length must be the same (scraping recentsAndTrendingTabs)")

      
      const elems: DiscoverListing[] = []
      for (let i = 0; i < titles.length; i++) {
        const titleRef = $(titles[i]);
        const title = titleRef.text().trim();
        
        const elementRef = $(elements[i]);
        const itemsDuplicates: Playlist[] = elementRef.find("div.grid.grid-cols-2 div.w-full.p-1.mb-8.relative.transition.ease-in-out.duration-300 a.hover\\\:text-blue-600").map((i, item) => {
          const itemRef = $(item);

          let url: string[] | string = itemRef.attr("href")!.split("-"); url.pop(); url.push("1");
          url = url.join("-")


          const posterImage = baseUrl + itemRef.find("img").attr("src")!;
          let title: string | string[] = itemRef.find("div.absolute p.text-center").text().split(" - "); title.pop();
          title = title.join(" - ");

          return {
            id: url,
            title,
            posterImage,
            url,
            status: PlaylistStatus.unknown,
            type: PlaylistType.video,
          } satisfies Playlist
        }).get()

        let items: Playlist[] = [];
        let seenTitles = new Set();

        itemsDuplicates.forEach(item => {
          if (!seenTitles.has(item.title)) {
            seenTitles.add(item.title);
            items.push(item);
          }
        });
        
        
        elems.push({
          id: title,
          title: title,
          type: (title == "Trending") ? DiscoverListingType.featured : DiscoverListingType.default,
          orientation: DiscoverListingOrientationType.portrait,
          paging: {
            id: "0",
            items
          }
        })
      }
      return elems
    }).get()

    // Move "featured" at the top of everything else
    const index = recentAndTrendingTabs.findIndex(item => item.type === DiscoverListingType.featured);
    if (index > 0) {
      const [item] = recentAndTrendingTabs.splice(index, 1);
      recentAndTrendingTabs.unshift(item);
    }

    return recentAndTrendingTabs;
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    const html = await request.get(id).then(resp => resp.text());
    const $ = load(html);

    const dataRef = $('div.relative.overflow-hidden.z-10 > div.float-left > div');
    const altTitleWrap = dataRef.find("h2").contents();
    const altTitles = (altTitleWrap.length == 3) ? [altTitleWrap.first().text().trim().replace(" |", "")] : [];
    const dateWrap = dataRef.find("div > a.text-l.text-gray-800.dark\\\:text-gray-400.leading-tight");
    const yearReleased = (dateWrap.length == 2) ? parseInt(dateWrap.last().text().trim().split("-")[0]) : undefined;
    
    const infoRef = $("div.bg-transparent.rounded-lg.overflow-hidden.bg-white.dark\\\:bg-neutral-700\\\/40.p-5 div.relative");
    const synopsis = infoRef.find("p.text-gray-800.dark\\\:text-gray-200.leading-tight").text().trim()
    const genres = infoRef.find("ul.list-none li.inline-block.m-1").map((i, elem) => {
      const elemRef = $(elem);
      return elemRef.text().trim()
    }).get()
    

    return {
      synopsis,
      altTitles,
      altPosters: [],
      altBanners: [],
      genres,
      yearReleased,
      previews: [] // Note: image previews could be grapped from the "Gallery" tab, but not sure if it exists every time & meh (+ would be 1st episode specific)
    }
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    const html = await request.get(playlistId).then(resp => resp.text());
    const $ = load(html);
    
    // Find the right wrapper on the right - fuck tailwind
    const wrappers = $("div.bg-white.dark\\\:bg-neutral-950.rounded-xl.overflow-hidden.border-\\\[1px\\\].border-zinc-400.dark\\\:border-zinc-600")

    const wrapper = wrappers.filter((i, elem) => {
      const wrapperRef = $(elem);
      const title = wrapperRef.find("p.leading-normal.font-bold.text-lg.text-neutral-800.dark\\\:text-white.bg-zinc-200.dark\\\:bg-zinc-800.p-4").text().trim()
      if (title.includes("More from Studio"))
        return false;
      if (!title.includes("More from"))
        return false;
      return true;
    }).get()[0]
    const wrapperRef = $(wrapper);

    const firstItem: PlaylistItem = {
      id: playlistId,
      number: 1,
      tags: []
    } satisfies PlaylistItem // Too lazy for first thumbnail rn ngl, will seel after (need to scrape gallery like on playlistDetails)

    const otherItems: PlaylistItem[] = wrapperRef.find("div.grid.grid-cols-1.gap-2.p-4 div.w-full.p-1.md\\\:p-2.mb-8.relative.transition.ease-in-out.hover\\\:-translate-y-1.hover\\\:scale-110.duration-300 a.hover\\\:text-blue-600").map((i, item) => {
      const itemRef = $(item);
      const id = itemRef.attr("href")!;
      let number = parseInt(id.split("-").pop()!);
      const thumbnail = baseUrl + itemRef.find("img.block").attr("src")
      
      return {
        id,
        thumbnail,
        number,
        tags: []
      } satisfies PlaylistItem
    }).get()

    const items = [firstItem, ...otherItems];

    return [{
      id: "0",
      number: 0,
      altTitle: "Content",
      variants: [{
        id: "0",
        title: "Content",
        pagings: [{
          id: "0",
          items
        }]
      }]
    }]
  }
  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    const resp = await request.get(req.episodeId);

    // can be set-cookie or Set-Cookie depending on app/testing. Just to make sure instead of using isTesting using this.
    const cookies = grabSetCookieValues(resp.headers);
    const xsrfToken = cookies["XSRF-TOKEN"];
    const hstreamSession = cookies["hstream_session"];

    const html = resp.text();
    const episode_id = html.match(/<input id="e_id".*?value="([0-9]*?)"/)![1];
    
    const headers = {
      "x-xsrf-token": decodeURI(xsrfToken).replace("%3D", "="), // decodeUri doesn't seem to replace %3D by =
      "Cookie": `XSRF-TOKEN=${xsrfToken}; hstream_session=${hstreamSession}`,
      "Content-Type": "application/json"
    }
    const body = {
      "episode_id": episode_id
    }
    
    let apiResp: PlayerApiResponse;
    try {
        apiResp = await request.post("https://hstream.moe/player/api", {body: JSON.stringify(body), headers}).then(resp => resp.json());
    } catch(e: any) {
      console.log(e.response.status);
      throw Error("Request failed. Config issue lol.")
    }
    const res = JSON.stringify(apiResp)
    
    if (res === undefined) {
      console.error("Request failed. Couldn't parse the JSON. See below for the failing response.");
      console.error(apiResp);
      throw Error()
    }
    
    return [{
      id: "main",
      displayName: "hstream",
      servers: [{
        id: res,
        displayName: "Main server"
      }]
    }]
  }
  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    const serverData: PlayerApiResponse = JSON.parse(req.serverId);
    serverData.resolution = serverData.resolution.toLowerCase(); // just in case

    const domain = serverData.stream_domains[Math.floor(Math.random() * serverData.stream_domains.length)]; // actual code used in their js

    // Seems like there's always only 1 and it's always eng.ass
    const subtitle = `${domain}/${serverData.stream_url}/eng.ass`;


    const links: PlaylistEpisodeServerLink[] = [];
    // If 4K: use the 3 .mpds
    // If smth else (even 1080p), use the single 720p x264 mp4 fallback
    // if (serverData.resolution == "4k") {
    //   for (const quality of ["720", "1080", "2160"]) {
    //       links.push({
    //         url: `${domain}/${serverData.stream_url}/${quality}/manifest.mpd`,
    //         quality: PlaylistEpisodeServerQualityType[`q${quality}p`] ?? PlaylistEpisodeServerQualityType.auto,
    //         format: PlaylistEpisodeServerFormatType.dash // I think?
    //       })
    //   }
    // } 
    // mpd seems to be broken :/ quick if-else fallback below
    // 720p always available
    links.push({
      url: `${domain}/${serverData.stream_url}/x264.720p.mp4`,
      quality: PlaylistEpisodeServerQualityType.q720p,
      format: PlaylistEpisodeServerFormatType.dash
    })
    if (serverData.resolution == "1080p" || serverData.resolution == "4k") {
      links.push({
        url: `${domain}/${serverData.stream_url}/av1.1080p.webm`,
        quality: PlaylistEpisodeServerQualityType.q1080p,
        format: PlaylistEpisodeServerFormatType.dash
      })
    }
    if (serverData.resolution == "4k") {
      links.push({
        url: `${domain}/${serverData.stream_url}/av1.2160p.webm`,
        quality: PlaylistEpisodeServerQualityType.auto,
        format: PlaylistEpisodeServerFormatType.dash
      })
    }
    
    return {
      links,
      subtitles: [{
        url: subtitle,
        name: "English",
        format: PlaylistEpisodeServerSubtitleFormat.ass,
        default: true,
        autoselect: true
      }],
      skipTimes: [],
      headers: {"Referer": "https://hstream.moe/"}
    } satisfies PlaylistEpisodeServerResponse
  }
}