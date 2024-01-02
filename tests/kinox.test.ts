import { test } from 'vitest'
import runner from "@mochiapp/runner";
import Source from "../src/kinox";

import { log, logEnabled } from "./utils/log"
logEnabled(true)

const source = runner(Source)

// test("provides discover listings", async () => {
//   log((await source.discoverListings())[0]["paging"]["items"])
// })

// test("provides correct search info", async () => {
//   log(await source.search({ query: "family", filters: [] }))
// })

// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("/Stream/Percy_Jackson_Die_Serie.html,s1e3"))
// })
// test("provides playlist details", async () => {
//   console.log(await source.playlistDetails("/Stream/Freelance-1.html"))
// })
// test("provides playlist details", async () => {
//     console.log(await source.playlistDetails("/Stream/Fluch_der_Karibik_2.html"))
//   })

// test("gets the episode count", async() => {
//   log(await source.playlistEpisodes("/Stream/Fluch_der_Karibik_2.html"));
// })
// test("gets the episode count", async() => {
//   log((await source.playlistEpisodes("/Stream/T-I-M.html"))[0]["variants"]![0]["pagings"]![0]["items"]);
//   // /aGET/MirrorByEpisode/?Addr=What_If-1&SeriesID=112525&Season=1&Episode=7
//   // /Stream/T-I-M.html
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "", episodeId: "/aGET/MirrorByEpisode/?Addr=What_If-1&SeriesID=112525&Season=1&Episode=7"})))
// })

// test("gets the episode sources", async() => {
//   log(JSON.stringify(await source.playlistEpisodeSources({playlistId: "", episodeId: "/Stream/Aquaman_2_Lost_Kingdom-Neueste_Version-Gute_Qualitaet.html"})))
// })

test("gets an episode server (Movie)", async() => {
  log(JSON.stringify(await source.playlistEpisodeServer({
    playlistId: "/Stream/Aquaman_2_Lost_Kingdom-Neueste_Version-Gute_Qualitaet.html", 
    episodeId: "/Stream/Aquaman_2_Lost_Kingdom-Neueste_Version-Gute_Qualitaet.html", 
    sourceId: "Kinox",
    serverId: "Aquaman_2_Lost_Kingdom-Neueste_Version-Gute_Qualitaet&Hoster=73"
  })))
})

// test("gets an episode server (Movie)", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({
//     playlistId: "/Stream/South_Park_Post_Covid-1.html", 
//     episodeId: "/Stream/South_Park_Post_Covid-1.html", 
//     sourceId: "Kinox",
//     serverId: "91"
//   })))
// })


// test("gets an episode server (TV)", async() => {
//   log(JSON.stringify(await source.playlistEpisodeServer({
//     playlistId: "/Stream/Tacoma_FD-1.html,s3", 
//     episodeId: "/aGET/MirrorByEpisode/?Addr=Tacoma_FD-1&SeriesID=115074&Season=1&Episode=1", 
//     sourceId: "Kinox",
//     serverId: "92"
//   })))
// })
