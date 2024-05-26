import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/hanime";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

test("provides discover listings", async () => {
  log((await source.discoverListings())[0]["paging"])
})


// test("provides correct search info", async () => {
//   log(await source.search({ query: "f", page: "0", filters: [] }))
// })

test("provides correct search info", async () => {
  log(await source.searchFilters())
})




// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("tenioha-2-limit-over-mada-mada-ippai-ecchi-shiyo-2"))
// })

// test("gets the episode count", async() => {
//   log((await source.playlistEpisodes("sakusei-byoutou-1"))[0]["variants"]![0]["pagings"]![0]["items"]);
// })

// let ress = ""

// test("gets the episode sources", async() => {
//   const res = await source.playlistEpisodeSources({playlistId: "", episodeId: "sakusei-byoutou-1"})
//   ress = res[0].servers[0].id
//   log(JSON.stringify(res))
// })

// test("gets an episode server", async() => {  
//   log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "", episodeId: "", sourceId:"", 
//   serverId:ress})))
// })
