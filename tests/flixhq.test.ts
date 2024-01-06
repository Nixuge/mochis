import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/flixhq";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings()))
// })

// test("gets filters", async () => {
//   log((await source.searchFilters()))
// })



// test("provides correct search info", async () => {
//   log(await source.search({ query: "word", filters: [] }))
// })


// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("/movie/watch-stash-house-252"))
// })

let episodeId: string = ""

// test("gets the episode count", async() => {
//   const data = await source.playlistEpisodes("/movie/watch-stash-house-252");
//   log(JSON.stringify(data))
//   // episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })
// test("gets the seasons", async() => {
//   const data = await source.playlistEpisodes("/tv/watch-hunter-x-hunter-36456");
//   // log(JSON.stringify(data))
//   episodeId = data[0].variants?.[0].pagings?.[0]
//   log(episodeId)
// })
test("gets the episodes for season 7", async() => {
  const data = await source.playlistEpisodes("/tv/watch-hunter-x-hunter-36456", {type: 'group', groupId: "16717"});
  log(JSON.stringify(data))
  episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
  log(episodeId)
})


test("gets the episode sources", async() => {
  log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "", episodeId: episodeId})))
})

test("gets an episode server", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({
    playlistId: "/tv/watch-hunter-x-hunter-36456", 
    episodeId: "", 
    sourceId:"", 
    serverId:"{\"id\":\"7489777\",\"provider\":\"Voe\"}"})))
})
