import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/aniwave";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides correct search info", async () => {
//   log(await source.search({ query: "pokemon", page: "1", filters: [] }))
// })

// test("provides discover listings", async () => {
//   log((await source.discoverListings())[1]["paging"])
// })

// test("load filters", async () => {
//   log(await source.searchFilters())
// })

// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("/watch/pokemon.nz8g"))
// })

// test("gets the episode count", async() => {
//   log((await source.playlistEpisodes("/watch/pokemon.nz8g")))
// })
// test("gets the episode count", async() => {
//   log(JSON.stringify(await source.playlistEpisodes("/watch/hunter-x-hunter-2011.x7mz")))
// })
// test("gets the episode count", async() => {
//   log(JSON.stringify(await source.playlistEpisodes("/watch/how-not-to-summon-a-demon-lord-w.3vog")))
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "/watch/how-not-to-summon-a-demon-lord-w.3vog", episodeId: "Hj-WA8Im,Hj-WA8In | sub"})))
// })
// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "/watch/how-not-to-summon-a-demon-lord-w.3vog", episodeId: "HTmfCckh,HTSZAsIh,HTqXDM8i | sub"})))
// })

// timeout 15s as the deobfuscation can take some time when the js changes.
test("gets an episode server", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "/watch/how-not-to-summon-a-demon-lord-w.3vog", episodeId: "HTmfCcgl,HTSZA8sl,HTqXDM4m", sourceId:"servers", serverId:"HzuaDckilg=="})))
}, {timeout: 20000})
// test("gets an episode server", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "/watch/how-not-to-summon-a-demon-lord-w.3vog", episodeId: "HTmfCckh,HTSZAsIh,HTqXDM8i | sub", sourceId:"servers", serverId:"HzuaDckjlg=="})))
// }, {timeout: 20000})
