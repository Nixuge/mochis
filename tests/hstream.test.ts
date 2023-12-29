import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/hstream";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings())[0]["paging"]["items"])
// })


// test("provides correct search info", async () => {
//   log(await source.search({ query: "hxh", page: "1", filters: [] }))
// })




// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("https://hstream.moe/hentai/ane-wa-yanmama-junyuu-chuu-1"))
// })

// test("gets the episode count", async() => {
//   log(await source.playlistEpisodes("https://hstream.moe/hentai/eroge-h-mo-game-mo-kaihatsu-zanmai-1"));
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "", episodeId: "https://hstream.moe/hentai/eroge-h-mo-game-mo-kaihatsu-zanmai-1"})))
// })

test("gets an episode server", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "", episodeId: "", sourceId:"", 
  serverId:"{\"title\":\"Eroge! H mo Game mo Kaihatsu Zanmai - 1\",\"poster\":\"/images/hentai/eroge-h-mo-game-mo-kaihatsu-zanmai/gallery-ep-1-0.webp\",\"legacy\":0,\"resolution\":\"4k\",\"stream_url\":\"2023/Eroge.H.mo.Game.mo.Kaihatsu.Zanmai/E01\",\"stream_domains\":[\"https://str1.h-dl.xyz\",\"https://str2.h-dl.xyz\",\"https://str1.dl-h.xyz\",\"https://str2.dl-h.xyz\"]}"})))
})
