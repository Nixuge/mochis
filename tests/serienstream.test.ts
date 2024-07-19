import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/serienstream";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings())[0]["paging"]["items"])
// })

// NOTE: SEARCH BROKEN ON SERIEN !
// test("provides correct search info", async () => {
//   log(await source.search({ query: "a", filters: [] }))
// })

// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("/serie/stream/mayor-of-kingstown"))
// })


// test("gets the episode count", async() => {
//   log((await source.playlistEpisodes("/serie/stream/mayor-of-kingstown"))[0]["variants"][0]["pagings"][0]["items"]);
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "/serie/stream/mayor-of-kingstown", episodeId: "staffel-1/episode-7/public"})))
// })


test("gets an episode server (TV)", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({
    playlistId: "/serie/stream/mayor-of-kingstown", 
    episodeId: "staffel-1/episode-7/public", 
    sourceId: "aniworld",
    serverId: "voe/14148964"
  })))
})
