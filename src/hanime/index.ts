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
  PlaylistItem,
  PlaylistItemsOptions,
  PlaylistItemsResponse,
  PlaylistStatus,
  PlaylistType,
  SearchFilter,
  SearchQuery,
  SearchQueryFilter,
  SourceModule,
  VideoContent
} from "@mochiapp/js";
import { load } from "cheerio";
import { HentaiVideo, PageMeta, Server } from "./models/pageMeta";
import { baseUrl, baseVideoUrl, nuxtJsonRegex } from "./utils/constants";
import { SearchResult } from "./models/search";
import { isTesting } from "../shared/utils/isTesting";
import { sleep } from "../shared/utils/sleep";
import { filters, scrapeFilters } from "./scrape/filters";

export default class Hstream extends SourceModule implements VideoContent {
  metadata = {
    id: 'hanime||NSFW||Nixuge\'s NSFW Mochi Repo||NSFW modules for Mochi||https://upload.wikimedia.org/wikipedia/commons/f/f8/Stylized_uwu_emoticon.svg',
    name: 'hanime',
    version: '0.1.0',
    icon: "https://hanime.tv/favicon.png"
  }

  async searchFilters(): Promise<SearchFilter[]> {
    while (isTesting() && filters.length == 0) {
      await sleep(10);
    }
    return filters;
  }

  async search(query: SearchQuery): Promise<Paging<Playlist>> {
    // Unwrap the "order by/ordering" tags
    const orderByToProcessIndex = query.filters.findIndex(element => element.id === "order_by_to_process");
    if (orderByToProcessIndex !== -1) {
      // Value required and no multiselect, we can index 0 everywhere.
      const jsonOrderValues = JSON.parse(query.filters.splice(orderByToProcessIndex, 1)[0].optionIds[0]);
      query.filters.push({id: "order_by", optionIds: [jsonOrderValues["order_by"]]} satisfies SearchQueryFilter)
      query.filters.push({id: "ordering", optionIds: [jsonOrderValues["ordering"]]} satisfies SearchQueryFilter)
    }

    const currentPage = query.page ?? "0";
    const currentPageInt = parseInt(currentPage);

    const basePayload = {
      search_text: query.query,
      tags: [],
      tags_mode: "OR",
      brands: [],
      blacklist: [],
      order_by: "created_at_unix",
      ordering: "desc",
      page: currentPage
    }
    // If default value is an array, add to array
    // Otherwise, replace value
    for (const filter of query.filters) {
      const defaultValue = basePayload[filter.id];
      if (Array.isArray(defaultValue)) {
        filter.optionIds.forEach(optionId => {
          basePayload[filter.id].push(optionId);
        });
      } else {
        basePayload[filter.id] = filter.optionIds[0];
      }
    }
     
    const response = await request.post("https://search.htv-services.com/", {body: JSON.stringify(basePayload), headers: {"Content-Type": "application/json"}});
    const searchResult: SearchResult = response.json();
        
    const prevPage = (currentPage=="0") ? undefined : (currentPageInt-1).toString();
    const nextPage = (searchResult.nbPages > currentPageInt) ? (currentPageInt+1).toString() : undefined;

    const items: Playlist[] = []
    if (searchResult.hits.length > 0) {
      const listingData: HentaiVideo[] = JSON.parse(searchResult.hits)
      for (const listing of listingData) {
        items.push({
          id: listing.slug.replace(/-\d+$/, "-1"),
          title: listing.name.replace(/ \d+$/, ""),
          posterImage: listing.cover_url,
          bannerImage: listing.poster_url,
          url: listing.slug,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video
        } satisfies Playlist)
      }
    }
    
    return {
      id: currentPage,
      previousPage: prevPage,
      nextPage: nextPage,
      title: `Search for ${query.query} - page ${currentPageInt+1}`,
      items
    }
  }

  
  async discoverListings(): Promise<DiscoverListing[]> {
    scrapeFilters()
    const html = await request.get(baseUrl).then(resp => resp.text());
    const jsonRes: PageMeta = JSON.parse(html.match(nuxtJsonRegex)![1]);

    const sections = jsonRes.state.data.landing.processed_sections;

    const listings: DiscoverListing[] = [];
    for (const [key, videos] of Object.entries(sections)) {
      const duplicateItems: Playlist[] = []
      for (const video of videos) {        
        duplicateItems.push({
          id: video.slug.replace(/-\d+$/, "-1"), // See if I also pass through the "id" property
          title: video.name.replace(/ \d+$/, ""),
          posterImage: video.cover_url,
          bannerImage: video.poster_url,
          url: video.slug,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video
        })
      }
      const items: Playlist[] = [];
      let seenIds = {};
      for (let item of duplicateItems) {
        if (!seenIds[item.id]) {
          items.push(item);
          seenIds[item.id] = true;
        }
      }
      
      listings.push({
        id: key,
        title: key,
        type: key == "Trending" ? DiscoverListingType.featured : DiscoverListingType.default,
        orientation: DiscoverListingOrientationType.portrait,
        paging: {
          id: "1",
          items
        }
      })
    }
    const order = ["Trending", "Recent Uploads", "New Releases", "Random"];    

    listings.sort((a, b) => {
      let indexA = order.indexOf(a.id);
      let indexB = order.indexOf(b.id);
      return indexA - indexB;
    });

    return listings;
  }

  async playlistDetails(id: string): Promise<PlaylistDetails> {
    const html = await request.get(baseVideoUrl + "/" + id).then(resp => resp.text())
    const jsonRes: PageMeta = JSON.parse(html.match(nuxtJsonRegex)![1]);
    
    // console.log(JSON.stringify(jsonRes.state.data));
    
    const videoData = jsonRes.state.data.video;
    console.log(JSON.stringify(videoData));
    
    const hentaiVideo = videoData.hentai_video;

    const synopsis = hentaiVideo.description ? load(hentaiVideo.description).text() : undefined;
    
    const altTitles = hentaiVideo.titles ? hentaiVideo.titles.map((title) => title.title) : [];
    
    const genres = hentaiVideo.hentai_tags ? hentaiVideo.hentai_tags.map((tag) => tag.text) : [];
    
    // No access to Date() iirc in JavaScriptCore so might as well use the string instead of Unix time
    let yearReleased: number | undefined;
    try {
      yearReleased = parseInt(hentaiVideo.released_at.split("-")[0]);
    } catch (error) {}
    
    return {
      synopsis,
      altTitles,
      altPosters: [],
      altBanners: [],
      genres,
      yearReleased,
      previews: []
    }
  }

  async playlistEpisodes(playlistId: string, options?: PlaylistItemsOptions | undefined): Promise<PlaylistItemsResponse> {
    // console.log(baseVideoUrl + "/" + id);
    const html = await request.get(baseVideoUrl + "/" + playlistId).then(resp => resp.text())
    const jsonRes: PageMeta = JSON.parse(html.match(nuxtJsonRegex)![1]);

    const videoData = jsonRes.state.data.video;

    const items: PlaylistItem[] = [];

    for (const video of videoData.hentai_franchise_hentai_videos) {
      // console.log(video);
      
      items.push({
        id: video.slug,
        // title: video.name, //Not really useful, just the hentai name + its number
        thumbnail: video.poster_url,
        number: parseInt(video.slug.match(/\d+$/)![0]),
        timestamp: video.released_at as unknown as Date, // Not sure if I should use unix
        tags: []
      })
    }
    
    return [{
      id: "1",
      number: 0,
      variants: [{
        id: "1",
        title: "Content",
        pagings: [{
          id: "1",
          items
        }]
      }]
    }]
  }
  async playlistEpisodeSources(req: PlaylistEpisodeSourcesRequest): Promise<PlaylistEpisodeSource[]> {
    const html = await request.get(baseVideoUrl + "/" + req.episodeId).then(resp => resp.text())
    const jsonRes: PageMeta = JSON.parse(html.match(nuxtJsonRegex)![1]);

    const videoData = jsonRes.state.data.video;
    
    const servers = videoData.videos_manifest.servers.map((server) => {
      return {
        id: JSON.stringify(server),
        displayName: server.name
      }
    });
    
    return [{
      id: "hanime",
      displayName: "hanime",
      servers
    }]
  }
  async playlistEpisodeServer(req: PlaylistEpisodeServerRequest): Promise<PlaylistEpisodeServerResponse> {
    const server: Server = JSON.parse(req.serverId);

    return {
      links: server.streams.filter((stream) => stream.url != "").map((stream) => {
        return {
          url: stream.url,
          quality: PlaylistEpisodeServerQualityType[`q${stream.height}p`] ?? PlaylistEpisodeServerQualityType.auto,
          format: PlaylistEpisodeServerFormatType.hsl
        }
      }),
      subtitles: [], // I don't think hanime supports softsubs
      skipTimes: [],
      headers: {}
    }
  }
}