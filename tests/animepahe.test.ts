import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/animepahe";

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
//   console.log(await source.playlistDetails("3958/9c94444a-37ce-87a1-bc5d-100094414436"))
// })

let episodeId: string = ""

// test("gets the episode count", async() => {
//   const data = await source.playlistEpisodes("3958/9c94444a-37ce-87a1-bc5d-100094414436");
//   log(JSON.stringify(data))
//   episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "3958/9c94444a-37ce-87a1-bc5d-100094414436", episodeId: "c685cd14dde128977877651e162750dbe40f25e26c74f8a0e349e794b40c0484"})))
// })

test("gets an episode server", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "a", episodeId: "b", sourceId:"c", serverId:'[{"id":"https://kwik.si/e/jC3tkihxKzZG","quality":"360p"},{"id":"https://kwik.si/e/U8jG62THYN9y","quality":"720p"},{"id":"https://kwik.si/e/cwZF4BCrhaQs","quality":"1080p"}]'})))
})


// test("get main page", async() => {
//   try {
//     log((await source.playlistEpisodeSources({
//       playlistId: "1d6b96ff-45c4-c842-1a91-45af89eb8474",
//       episodeId: "b06a55779d98a5d91908fa5ddd5ba24d49c9a145277d6dc18db178432c657e34"
//     }))[0])
//   } catch(e) {
//     log(e)
//   }
// })