import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/animesama";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings()))
// })


// test("provides correct search info", async () => {
//   log(await source.search({ query: "hxh", page: "1", filters: [] }))
// })




// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("360"))
// })

let episodeId: string = ""

// test("gets the episode count", async() => {
//   const data = await source.playlistEpisodes("360");
//   log(JSON.stringify(data))
//   episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "0", episodeId: episodeId})))
// })

test("gets an episode server", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "a", episodeId: "b", sourceId:"c", serverId:"https://vk.com/video_ext.php?oid=755747641&id=456240187&hd=3"})))
}, {timeout: 15000})
