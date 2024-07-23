import { VideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../utils/subtitles';
import { rc4Cypher } from '../utils/aniwave/rc4';
import { PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';
import { b64encode, b64decode } from '../utils/b64';

interface IMediaInfo {
  status: number,
  result: {
    sources: Object[],
    tracks: IRawTrackMedia[]
  }
}

interface ParsedKeys {
  encrypt: string[],
  decrypt: string[]
}

async function grabKeysFromGithub(e) {
  const resp = await request.get(e).then(s => s.text())!
  const rawKeysHtml = resp.match(/"rawLines":\["(.+?)"],"styling/)![1];

  return JSON.parse(rawKeysHtml.replaceAll("\\", ""));
}

function encodeElement(input: string, key: string) {
  input = encodeURIComponent(input);
  const e = rc4Cypher(key, input);
  const out = b64encode(e).replace(/\//g, "_").replace(/\+/g, '-');
  return out;
}

function decodeResult(input: string, key: string) {
  const i = b64decode((input).replace(/_/g, "/").replace(/-/g, "+"));
  let e = rc4Cypher(key, i);
  e = decodeURIComponent(e);
  return e;
}

async function getUrl(fullUrl: string, keys: ParsedKeys) {
  let videoId = fullUrl.split("/e/")[1].split("?")[0];
    
  const urlEnd = "?" + fullUrl.split("?").pop();

  let encodedVideoId = encodeElement(videoId, keys.encrypt[1]);
  let h = encodeElement(videoId, keys.encrypt[2]);
  let mediainfo_url = `https://vid2v11.site/mediainfo/${encodedVideoId}${urlEnd}&ads=0&h=${encodeURIComponent(h)}`;
  
  return mediainfo_url;
}

async function attemptDecodingKeys(url: string, keys: ParsedKeys) {
  const sourcesUrl = await getUrl(`${url}&autostart=true`, keys);

  let sourcesRes: IMediaInfo = await request.get(sourcesUrl, {headers: {Referer: url}}).then(f => f.json());
  
  // Basically, when the url is invalid, result is set to "404" instead of the normal object
  // with sources & tracks.
  if (sourcesRes.result as unknown as number != 404) {
      return sourcesRes;
  }

  throw Error("Couldn't get source.")
}

async function attemptDecodingSelenium(url: string) {
  const mediaInfo: IMediaInfo = await request.post("https://anithunder.vercel.app/api/mcloud", {
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"url": url})}
  ).then(req => req.json());

  return mediaInfo;
}

// Note: this is named mycloud but works for both mycloud & vidplay (now named vidstream & megaf)
export class MyCloudE extends VideoExtractor {
  protected override serverName = 'mycloud';

  override extract = async (): Promise<ISource> => {
    const url = this.referer;
    
    // Note:
    // There are 3 major iterations of this extractor:
    // - before (including) commit https://github.com/Nixuge/mochis/commit/ce615f9ff486ec82b01dcdcb8e6d08a987871d8d, where things are handled in a good part server side but using keys extracted myself.
    // - before (including) commit https://github.com/Nixuge/mochis/commit/e30e87e5e9c56bd767bc1e3af3454903fcad2295, where things were only almost all handled using a browser on the server side (basically a hotfix done in haste because I didn't have a lot of time).
    // - before (including) commit https://github.com/Nixuge/mochis/commit/c7f49451da720ee35925b502bfb3e1fa6750746d, where third party keys are used for faster loading, still with the browser fallback from the previous commits.
    // - after (including) commit https://github.com/Nixuge/mochis/commit/246db5ff82a1b06d4820e791bdb1dba0789b0580, where they changed how the mediaInfo response worked, having its response's result encrypted.
    
    // If possible in the future should setup my own key extractor for better stability
    
    let keys: ParsedKeys;
    try {
      keys = await grabKeysFromGithub("https://github.com/Ciarands/vidsrc-keys/blob/main/keys.json");
    } catch(e) {
      throw Error("Couldn't get keys to decrypt url " + this.referer);
    }
    

    let mediaInfo: IMediaInfo;
    try {
      console.log("attempting extraction using keys");
      mediaInfo = await attemptDecodingKeys(url, keys);
    } catch(e) {
      // Note: this isn't really that useful anymore since we rely on keys to decrypt
      console.log("attempting extraction using a browser");
      mediaInfo = await attemptDecodingSelenium(url);
      // If this fails again, just let it throw an error...
    }

    console.log("Successfully got mediaInfo. Now attempting to decrypt result.");
    try {
      mediaInfo.result = JSON.parse(decodeResult(mediaInfo.result as unknown as string, keys.decrypt[1]));
    } catch(e) {
      throw Error("Couldn't get mediaInfo. This is usually due to outdated keys. Please try another server for now.");
    }
    console.log("Successfully decrypted result !");

    const sourcesJson = mediaInfo.result.sources;
    
    const videos = await getM3u8Qualities(sourcesJson[0]["file"]);
    
    const subtitles = parseSubtitles(mediaInfo.result.tracks, PlaylistEpisodeServerSubtitleFormat.vtt, true);

    return {
      videos: videos,
      subtitles: subtitles
    } satisfies ISource
  };
}
