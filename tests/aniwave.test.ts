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
//   console.log(await source.playlistDetails("/watch/pokemon.r9vq"))
// })

test("gets the episode count", async() => {
  log((await source.playlistEpisodes("/watch/pokemon.r9vq")))
})
// test("gets the episode count", async() => {
//   JSON.stringify(await source.playlistEpisodes("/watch/boushoku-no-berserk-ore-dake-reberu-to-iu-gainen-wo-toppa-suru.ojll4"))
// })
// test("gets the episode count", async() => {
//   log(JSON.stringify(await source.playlistEpisodes("/watch/hunter-x-hunter-2011.295")))
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "/watch/how-not-to-summon-a-demon-lord-w.oz6y", episodeId: "HTmfCcgl,HTSZA8sl,HTqXDM4m | softsub"})))
// })

// timeout 15s as the deobfuscation can take some time when the js changes.
// test("gets an episode server", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "/watch/how-not-to-summon-a-demon-lord-w.oz6y", episodeId: "HTmfCcgl,HTSZA8sl,HTqXDM4m", sourceId:"servers", serverId:"GDyXC84gkg=="})))
// }, {timeout: 20000})
