import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/animesama";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides correct search info", async () => {
//   log(await source.search({ query: "h", page: "1", filters: [] }))
// })


test("provides discover listings", async () => {
  log((await source.discoverListings()))
})


test("provides playlist details", async () => {
  console.log(await source.playlistDetails("0"))
})

let episodeId: string = ""

// test("gets the episode count", async() => {
//   const data = await source.playlistEpisodes("0");
//   log(JSON.stringify(data))
//   episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "0", episodeId: episodeId})))
// })

// timeout 15s as the deobfuscation can take some time when the js changes.
// test("gets an episode server", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({playlistId: "how-not-to-summon-a-demon-lord-w.oz6y/ep-1", episodeId: "HTmfCcgl,HTSZA8sl,HTqXDM4m", sourceId:"servers", serverId:"GDyXDcMlnw=="})))
// }, {timeout: 15000})
