import { VideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../utils/subtitles';
import { rc4Cypher } from '../utils/aniwave/rc4';
import { PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';
import { b64encode, b64decode } from '../utils/b64';
import { deserializeText, reverse, serializeText } from '../utils/aniwave/aniwaveUtils';
import { substituteString } from '../utils/aniwave/substituteString';

interface IMediaInfo {
  status: number,
  result: {
    sources: Object[],
    tracks: IRawTrackMedia[]
  }
}

interface ParsedKeys {
  encodeVideoId: string,
  encodeH: string,
  decodeResult: string
}

// Note: those keys are valid, but the algorithm has changed.
async function tempDirtyKeys(): Promise<ParsedKeys> {
  return {
    encodeVideoId: "3aBkbZuYYg0nyUkQ",
    encodeH: "BvxAphQAmWO9BIJ8",
    decodeResult: "48viMBoCGDnap1Qe"
  }
}

async function grabKeysFromGithub(url: string): Promise<ParsedKeys> {
  const resp = await request.get(url).then(s => s.text())!
  const rawKeysHtml = resp.match(/"rawLines":\["(.+?)"],"styling/)![1];

  const keys = JSON.parse(rawKeysHtml.replaceAll("\\", ""));
  return {
    encodeVideoId: keys.encrypt[1],
    encodeH: keys.encrypt[2],
    decodeResult: keys.decrypt[1]
  } satisfies ParsedKeys;
}

async function grabKeysFromMe(url: string, method: string = "get"): Promise<ParsedKeys> {
    const requestFunc = method == "get" ? request.get : request.post;
    
    const keys = JSON.parse(await requestFunc(url).then(r => r.text()!))
    
    return {
      encodeVideoId: keys[0],
      encodeH: keys[1],
      decodeResult: keys[2]
    } satisfies ParsedKeys;
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

  let encodedVideoId = encodeElement(videoId, keys.encodeVideoId);
  let h = encodeElement(videoId, keys.encodeH);
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

async function doAllForKeySource(url: string, keySource: (string | Promise<ParsedKeys>)[]) {
  console.log("attempting extraction using keys from " + keySource[1]);

  let keys = await keySource[0] as ParsedKeys;
  console.log("Grabbed keys:");
  console.log(keys);
  
  let mediaInfo = await attemptDecodingKeys(url, keys);
  console.log("Successfully got mediaInfo. Now attempting to decrypt result.");
  mediaInfo.result = JSON.parse(decodeResult(mediaInfo.result as unknown as string, keys.decodeResult));
  console.log("Successfully decrypted result !");
  return mediaInfo;
}

// This is really quite dirty, but will do the job
// until Aniwave stabilizes to a specific key format.
async function temporaryMyCloudHandling(url: string): Promise<ISource> {  
  let urlSplit = url.split("?")[0].split("/");

  let domain = urlSplit[2];

  let key = urlSplit[urlSplit.length-1];
  key = substituteString(key, "E1KyOcIMf9v7XHg", "gMvO97yE1cfKIXH")
  key = reverse(key)
  key = rc4Cypher("dawQCziL2v", key)
  key = serializeText(key)
  
  key = reverse(key)
  key = substituteString(key, "ZSsbx4NtMpOoCh", "ZCo4MthpsNxSOb");
  key = rc4Cypher("thDz4uPKGSYW", key)
  key = serializeText(key)

  key = rc4Cypher("QIP5jcuvYEKdG", key)
  key = serializeText(key)

  key = reverse(key)
  key = substituteString(key, "fH0n3GZDeKCE6", "0GCn6e3ZfDKEH")
  key = serializeText(key)

  urlSplit = urlSplit = url.split("?t=");
  let tParam = urlSplit[urlSplit.length-1].split("&")[0];  
  
  let a = await request.get(`https://${domain}/mediainfo/${key}?t=${tParam}&autostart=true`)
  let jsonBody: any = a.json();
  
  let res: string = jsonBody.result;

  console.log("GOT RES !");
  console.log(jsonBody);
  
  res = deserializeText(res)
  res = substituteString(res, "0GCn6e3ZfDKEH", "fH0n3GZDeKCE6")
  res = reverse(res)
  res = deserializeText(res)
  res = rc4Cypher("QIP5jcuvYEKdG", res);

  res = deserializeText(res)
  res = rc4Cypher("thDz4uPKGSYW", res)
  res = substituteString(res, "ZCo4MthpsNxSOb", "ZSsbx4NtMpOoCh")
  res = reverse(res)

  res = deserializeText(res)
  res = rc4Cypher("dawQCziL2v", res)
  res = reverse(res)
  res = substituteString(res, "gMvO97yE1cfKIXH", "E1KyOcIMf9v7XHg")
  
  const jsonResult = JSON.parse(res);

  console.log(jsonResult);
  const videos = await getM3u8Qualities(jsonResult.sources[0]["file"]);
  
  const subtitles = parseSubtitles(jsonResult.tracks, PlaylistEpisodeServerSubtitleFormat.vtt, true);

  return {
    videos: videos,
    subtitles: subtitles
  } satisfies ISource
}


// Note: this is named mycloud but works for both mycloud & vidplay (now named vidstream & megaf)
export class MyCloudE extends VideoExtractor {
  protected override serverName = 'mycloud';

  override extract = async (): Promise<ISource> => {
    const url = this.referer;    
    
    return temporaryMyCloudHandling(url);

    // Note:
    // There are 4.5 major iterations of this extractor:
    // - before (including) commit https://github.com/Nixuge/mochis/commit/ce615f9ff486ec82b01dcdcb8e6d08a987871d8d, where things are handled in a good part server side but using keys extracted myself.
    // - before (including) commit https://github.com/Nixuge/mochis/commit/e30e87e5e9c56bd767bc1e3af3454903fcad2295, where things were only almost all handled using a browser on the server side (basically a hotfix done in haste because I didn't have a lot of time).
    // - before (including) commit https://github.com/Nixuge/mochis/commit/c7f49451da720ee35925b502bfb3e1fa6750746d, where third party keys are used for faster loading, still with the browser fallback from the previous commits.
    // - after (including) commit https://github.com/Nixuge/mochis/commit/246db5ff82a1b06d4820e791bdb1dba0789b0580, where they changed how the mediaInfo response worked, having its response's result encrypted.
    // (semi major iter - refactored a lot in 0.7.0 to allow for other keys etc + removed Selenium fallback as not useful anymore)
    
    // If possible in the future should setup my own key extractor for better stability
    const keySources = [
      [tempDirtyKeys(), "temp dirty keys"],
      [grabKeysFromGithub("https://github.com/Ciarands/vidsrc-keys/blob/main/keys.json"), "github"],
      [grabKeysFromMe("https://mochi_back.nixuge.me/thanksForTheServerRessources"), "my server"]
    ]
    let mediaInfo: IMediaInfo | undefined = undefined;
    for (const keySource of keySources) {
      try {
        mediaInfo = await doAllForKeySource(url, keySource);
        break;
      } catch(e) {
        console.warn("Couldn't use keys from " + keySource[1]);
        // Dirty - if from my server try refreshing keys
        if (keySource[1] == "my server") {
          try {
            mediaInfo = await doAllForKeySource(url, [grabKeysFromMe("https://mochi_back.nixuge.me/thanksForTheServerRessources", "post"), "my server (refresh)"]);            
            break;
          } catch(e) {}
        }
      }
    }

    if (!mediaInfo) {
      throw Error("Couldn't get source !")
    }

    // @ts-ignore - TODO: REMOVE, dead code warn
    const sourcesJson = mediaInfo.result.sources;
    
    const videos = await getM3u8Qualities(sourcesJson[0]["file"]);
    // @ts-ignore - TODO: REMOVE, dead code warn
    const subtitles = parseSubtitles(mediaInfo.result.tracks, PlaylistEpisodeServerSubtitleFormat.vtt, true);

    return {
      videos: videos,
      subtitles: subtitles
    } satisfies ISource
  };
}
