import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/aniworld";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings())[0]["paging"])
// })

test("provides discover listings", async () => {
  log((await source.search({
    query: "a",
    filters: []
  })))
});

test("gets the episode count", async() => {
  log((await source.playlistEpisodes("/anime/stream/quality-assurance-in-another-world"))[0]["variants"]![0]["pagings"]![0]["items"]);
})

test("gets the episode sources", async() => {
  log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "/anime/stream/quality-assurance-in-another-world", episodeId: "staffel-1/episode-1/japanese-german"})))
})

test("gets an episode server (Movie)", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({
    playlistId: "/anime/stream/quality-assurance-in-another-world", 
    episodeId: "staffel-1/episode-1/japanese-german",
    sourceId: "aniworld",
    serverId: "doodstream/2593611"
  })))
})
