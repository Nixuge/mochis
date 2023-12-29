import { DiscoverListingOrientationType, DiscoverListingType, DiscoverListingsRequest, MochiResponse, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist"
import { Paging } from "@mochiapp/js/src/common/types"
import { DiscoverListing, Playlist } from "@mochiapp/js/src/interfaces/source/types"
import { CheerioAPI, load } from "cheerio"
import { AJAX_BASENAME, BASENAME } from "../utils/variables";


export class HomeScraper {
    $!: CheerioAPI;
    listingId?: string;
    page: number;

    constructor(listingRequest?: DiscoverListingsRequest) {
      this.page = 1;
      if (listingRequest) {
        this.listingId = listingRequest.listingId;
        this.page = parseInt(listingRequest.page);
      }
    }

    async scrape(): Promise<DiscoverListing[]> {
      if (!this.listingId) {
        const html = await request.get(`${BASENAME}/home`).then(resp => resp.text());
        this.$ = load(html);
        return this.scrapeAll();
      }
      if (this.listingId == "recently-updated") {
        const html = await request.get(`${AJAX_BASENAME}/home/widget/trending?page=${this.page}`).then(resp => resp.json()!["result"]);
        this.$ = load(html);
        return [this.scrapeRecentlyUpdated()]
      }
      
      throw Error("How did you even get here? Unhandled listingId (" + this.listingId + ")");
    }

    // Note sure if/how I add "Top anime",
    // as it has "Day/Week/Month" selectors
    private scrapeAll() {
        return [
            this.scrapeHotest(), 
            this.scrapeRecentlyUpdated(),
            // Can look at scraping the actual page for subpages on those ones maybe?
            this.scrapeBottomThreeColumns("completed"), 
            this.scrapeBottomThreeColumns("new-added"), 
            this.scrapeBottomThreeColumns("new-release")
        ]
    }

    private scrapeHotest(): DiscoverListing {
        const $ = this.$;

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

          return hotestListing;
    }

    private scrapeRecentlyUpdated(): DiscoverListing {
        const $ = this.$;
        // const recentUpdatesSec = $("#recent-update .body .ani.items .item"); // more accurate for home, but doesnt work w subpages
        const recentUpdatesSec = $(".ani.items .item");
        // TODO: MOVE THIS TO SCRAPER/ANIMEITEMSCRAPER & USE THE SAME IN SEARCH() AS THEY'RE SIMILAR
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
    
        const previousRecentlyUpdatedPage = (this.page == 1) ? undefined : this.page - 1;
        const nextRecentlyUpdatedPage = this.page + 1;

        const recentlyUpdatedListing = {
          title: "Recently Updated",
          id: "recently-updated",
          type: DiscoverListingType.default,
          orientation: DiscoverListingOrientationType.portrait,
          paging: {
            id: this.page.toString(),
            title: "Recently Updated",
            items: recentlyUpdatedItems,
            previousPage: previousRecentlyUpdatedPage?.toString(),
            nextPage: nextRecentlyUpdatedPage?.toString()
          } satisfies Paging<Playlist>
        } satisfies DiscoverListing

        return recentlyUpdatedListing;
    }

    private scrapeBottomThreeColumns(id: string): DiscoverListing {
      const table = this.$("div.top-tables.mb-3 .body .top-table").filter((i, table) => {
        return table.attribs["data-name"] == id;
      })[0];
      const $ = load(table);

      const title = $("div.head a.title").contents().first().text();
      
      const items = $("div.body div.scaff.items a.item").map((i, item) => {
        const itemRef = $(item);
        
        const url = itemRef.attr("href")!;
        const posterImage = itemRef.find("div.poster span img").attr("src")?.replace("-w100", "-w9999"); // higher quality
        
        const title = itemRef.find("div.info div.name.d-title").text()

        return {
          id: url,
          title,
          posterImage,
          url,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video
        } satisfies Playlist
      }).get()

      const listing = {
        title: title,
        id: id,
        type: DiscoverListingType.default,
        orientation: DiscoverListingOrientationType.portrait,
        paging: {
          title: title,
          id: id,
          items: items,
        } satisfies Paging<Playlist>
      } satisfies DiscoverListing

      return listing;
    }
}