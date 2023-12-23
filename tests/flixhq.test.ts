import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/flixhq";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings()))
// })


// test("provides correct search info", async () => {
//   log(await source.search({ query: "h", filters: [] }))
// })


test("provides playlist details", async () => {
  console.log(await source.playlistDetails("/movie/watch-stash-house-252"))
})

let episodeId: string = ""

// test("gets the episode count", async() => {
//   const data = await source.playlistEpisodes("3958/9c94444a-37ce-87a1-bc5d-100094414436");
//   log(JSON.stringify(data))
//   episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "3958/9c94444a-37ce-87a1-bc5d-100094414436", episodeId: "c685cd14dde128977877651e162750dbe40f25e26c74f8a0e349e794b40c0484"})))
// })

// test("gets an episode server", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "a", episodeId: "b", sourceId:"c", serverId:"https://kwik.cx/e/WjyZUGlA38xp/"})))
// })
