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
//   const data = await source.playlistEpisodes("/tv/watch-south-park-39503");
//   log(JSON.stringify(data))
//   // episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })
// test("gets the episodes for season 7", async() => {
//   const data = await source.playlistEpisodes("/tv/watch-south-park-39503", {type: 'group', groupId: "418"});
//   log(JSON.stringify(data))
//   // episodeId = data[0].variants?.[0].pagings?.[0].items?.[0].id!
// })


// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "", episodeId: "/ajax/episode/servers/7423"})))
// })

test("gets an episode server", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({
    playlistId: "/tv/watch-what-if-71031", 
    episodeId: "", 
    sourceId:"", 
    serverId:"{\"id\":\"4859866\",\"provider\":\"UpCloud\"}"})))
})
