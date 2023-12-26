import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/flixhq";

import { log, logEnabled } from "./utils/log"
logEnabled(false)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings()))
// })

// test("gets filters", async () => {
//   log((await source.searchFilters()))
// })



test("provides correct search info", async () => {
  log(await source.search({ query: "word", filters: [] }))
})


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
//   const data = await source.playlistEpisodes("/tv/watch-hunter-x-hunter-39509");
//   log(JSON.stringify(data))
//   // episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })
// test("gets the episodes for season 7", async() => {
//   const data = await source.playlistEpisodes("/tv/watch-hunter-x-hunter-39509", {type: 'group', groupId: "358"});
//   log(JSON.stringify(data))
//   // episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })


// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "", episodeId: "/ajax/episode/servers/6366"})))
// })

// test("gets an episode server", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({
//     playlistId: "/tv/watch-hunter-x-hunter-39509", 
//     episodeId: "", 
//     sourceId:"", 
//     serverId:"{\"id\":\"4857184\",\"provider\":\"UpCloud\"}"})))
// })
