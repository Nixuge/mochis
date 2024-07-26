import { load } from "cheerio";
import { Anime, RequestingPlaylistGroup } from "../models/types";
import { FetchedPaging, MochiResponse, PlaylistGroup, PlaylistItem } from "@mochiapp/js/dist";

type TempSource = {
    number: number,
    urls: string[]
}


export class PlaylistEpisodesScraper {
    private mainUrl: string;
    constructor(private anime: Anime) {
        this.mainUrl = this.anime.url.substring(-1) == '/' ? this.anime.url : this.anime.url + "/";
    }

    async scrape(): Promise<PlaylistGroup[]> {
        const saisonsMatches = await this.grabSeasons();
        const requestingPlaylistGroups = this.parseSeasons(saisonsMatches);
        await this.grabParseServers(requestingPlaylistGroups);

        return requestingPlaylistGroups.map((requestingPlaylistGroup) => {
            return requestingPlaylistGroup.playlistGroup;
        })
    }

    private async grabSeasons(): Promise<IterableIterator<RegExpMatchArray>> {
        const mainPage = await request.get(this.mainUrl).then(resp => resp.text());        

        // const $ = load(mainPage);
        // const saisonsRef = $("h2.text-white.text-xl.font-bold.uppercase.border-b-2.mt-5.border-slate-500").map((i, elem) => {
        //   const elemRef = $(elem);
        //   if (elemRef.text() == "Anime")
        //     return $(elemRef.next())
        // }).get()[0]        
    
        const saisonsMatches = mainPage.matchAll(/^(?: *?|\t*?)panneauAnime\("(.*?)", "(.*?)"\)/gm);
        return saisonsMatches;
    }

    private parseSeasons(saisonsMatches: IterableIterator<RegExpMatchArray>): RequestingPlaylistGroup[] {
        const requestingPlaylistGroups: RequestingPlaylistGroup[] = []
        let i = 0;
        for (const saison of saisonsMatches) {      
          const title = saison[1];
          const id = saison[2].split("/")[0]; // format is 'saisonX/vostfr'
    
          const promises: Map<string, Promise<MochiResponse>> = new Map();
          this.anime.filters["type"].forEach((type) => {
            promises.set(type, request.get(this.mainUrl + id + "/" + type.toLocaleLowerCase() + "/episodes.js?"))
          })
    
          requestingPlaylistGroups.push({
            playlistGroup: {
              id: id,
              number: i, // Note: not really accurate as eg OAVs are mixed in there too, so just a simple counter, title is accurate anyways
              altTitle: title,
              variants: []
            },
            promises: promises
          } satisfies RequestingPlaylistGroup);
          i++;
        }
        return requestingPlaylistGroups;
    }

    private async grabParseServers(requestingPlaylistGroups: RequestingPlaylistGroup[]) {
        for (const requestingGroup of requestingPlaylistGroups) {
            const playlistGroup = requestingGroup.playlistGroup;
            for (const [type, promise] of requestingGroup.promises) {
              // NOTE: DIRTY WORKAROUND WHILE THE RUNNER IS FIXED !
              // THE FIRST PART INSIDE THE IF IS ENOUGH FOR THE APP ALONE
              let status;
              let html;
              try {
                const awaited = await promise;
                status = awaited.status;
                html = awaited.text()
              } catch(e) {
                // @ts-ignore
                status = e.response.status;
                // @ts-ignore
                html = e.response.data;
              }
              if (status != 200)
                continue;
            
              const urlArrays = this.extractArrays(html);
              const playlistItems = this.parseEpisodeSources(urlArrays);
              
            
              playlistGroup.variants?.push({
                id: type,
                title: type,
                pagings: [{
                    id: type,
                    title: type,
                    items: playlistItems
                }] satisfies FetchedPaging<PlaylistItem>[]
              })
            }
          }
    }



    // FUNCTIONS USED FOR grabServers
    private extractArrays = (content) => {
        const arrays: { [sourceNum: string]: string[]} = {};
        const arrayRegex = /var\s+(eps\d+|epsAS)\s*=\s*\[(.*?)\];/gs;
    
        let match;
        while ((match = arrayRegex.exec(content)) !== null) {
            const arrayName = match[1];
            let arrayItems: string[] = match[2].split(',').map(item => item.trim().replace(/['"]/g, ''));
            // If latest is empty, remove it
            if (arrayItems[arrayItems.length-1] == "") {
                arrayItems.splice(arrayItems.length-1, 1)
            }
            arrays[arrayName] = arrayItems;
        }
        return arrays;
      };

      private parseEpisodeSources = (arrays: { [type: string]: string[]}) => {
        const episodeSources: PlaylistItem[] = [];
        const maxEpisodes = Math.max(...Object.values(arrays).map(arr => arr.length));
        
        for (let i = 0; i < maxEpisodes; i++) {
            const episodeSource: TempSource = {
                number: i + 1,
                urls: []
            };
    
            Object.values(arrays).forEach(arr => {
                if (arr[i]) {
                    episodeSource.urls.push(arr[i]);
                }
            });
            
            episodeSources.push({
                id: JSON.stringify(episodeSource.urls),
                number:episodeSource.number,
                tags: []
            } satisfies PlaylistItem);
        }
        return episodeSources;
    };
}