import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/aniwave";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides correct search info", async () => {
//   console.log(await source.search({ query: "ogre slayer", page: "1", filters: [] }))
// })

// test("provides discover listings", async () => {
//   log((await source.discoverListings())[0]["paging"])
// })

// test("load filters", async () => {
//   log(await source.searchFilters())
// })

test("provides playlist details", async () => {
  console.log(await source.playlistDetails("ogre-slayer.q33v"))
})

// test("gets the episode count", async() => {
//   log(JSON.stringify(await source.playlistEpisodes("/watch/kage-no-jitsuryokusha-ni-naritakute-2nd-season.vvqkv/ep-1")))
// })
// test("gets the episode count", async() => {
//   JSON.stringify(await source.playlistEpisodes("/watch/boushoku-no-berserk-ore-dake-reberu-to-iu-gainen-wo-toppa-suru.ojll4/ep-1"))
// })
// test("gets the episode count", async() => {
//   log(JSON.stringify(await source.playlistEpisodes("/watch/hunter-x-hunter-2011.295")))
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "how-not-to-summon-a-demon-lord-w.oz6y/ep-1", episodeId: "HT2aDw==,HTSbA88j,GjicAs4= | softsub"})))
// })

// timeout 15s as the deobfuscation can take some time when the js changes.
// test("gets an episode server", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "how-not-to-summon-a-demon-lord-w.oz6y/ep-1", episodeId: "HTmfCcgl,HTSZA8sl,HTqXDM4m", sourceId:"servers", serverId:"GDyXDcMlnw=="})))
// }, {timeout: 15000})
