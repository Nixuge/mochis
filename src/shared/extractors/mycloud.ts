import { VideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../utils/subtitles';
import { rc4Cypher } from '../utils/aniwave/rc4';
import { b64encode } from '../utils/aniwave/b64encode';

interface IMediaInfo {
  status: number,
  result: {
    sources: Object[],
    tracks: IRawTrackMedia[]
  }
}

// KEYS DECRYPTION //
async function grabKeysFromGithub(e) {
  const resp = await request.get(e).then(s => s.text())!
  return resp.match(/"rawLines":\["\[\\"(.+)\\"]"\]/)![1].split('\\",\\"')
}

async function getToken(domain: string, useCached: boolean) {
  // Note: it doesn't seem like grabbing a new token is necessary for some reason?
  if (useCached)
    return 'ViFRsqNPsIHKpYB0WLBjGjDGLa4flllPaeQmJ2GWwnXjR6wupwiKOdg92mKTSXrGkg==';
  
  const futokenText = await request.get(`https://vidplay.online/futoken`, {
      headers: {
          referer: domain
      }
  }).then(u => u.text())
  return futokenText.match(/var\s+k\s*=\s*'([^']+)'/)?.[1] ?? "";
}

function futoken(v: string, location: string, domain: string, token: string): string {
  const a: (string | number)[] = [token];
  
  for (let i = 0; i < v.length; i++) {
      a.push(token.charCodeAt(i % token.length) + v.charCodeAt(i));
  }

  return `https://${domain}/mediainfo/${a.join(',')}${location}`;
}

async function getUrl(fullUrl: string, keyUrl: string, cachedFutoken: boolean) {
  let videoId = fullUrl.split("/e/")[1].split("?")[0];
  let keys = await grabKeysFromGithub(keyUrl);

  const firstPass = rc4Cypher(keys[0], videoId);
  const secondPass = rc4Cypher(keys[1], firstPass);
  const secondPassEncoded = b64encode(secondPass).replace("/", "_");

  const urlEnd = "?" + fullUrl.split("?").pop();
  const domain = fullUrl.split('/')[2];

  const token = await getToken(fullUrl, cachedFutoken);

  return futoken(secondPassEncoded, urlEnd, domain, token)
}

async function attemptDecodingKeys(url: string, cachedToken: boolean) {
  const keyUrls = ["https://github.com/KillerDogeEmpire/vidplay-keys/blob/keys/keys.json", "https://github.com/Ciarands/vidsrc-keys/blob/main/keys.json"];
  for (let keyUrl of keyUrls) {
      const sourcesUrl = await getUrl(`${url}&autostart=true`, keyUrl, cachedToken);

      let sourcesRes: IMediaInfo = await request.get(sourcesUrl, {
              headers: {
                  Referer: url
              }
          }).then(f => f.json());
      
      // @ts-ignore
      // Basically, when the url is invalid, result is set to "404" instead of the normal object
      // with sources & tracks.
      if (sourcesRes.result != 404) {
          return sourcesRes;
      }
  }
  throw Error("Couldn't get source.")
}
// KEYS DECRYPTION END //

// SELENIUM DECRYPTION //
async function attemptDecodingSelenium(url: string) {
  const mediaInfo: IMediaInfo = await request.post("https://anithunder.vercel.app/api/mcloud", {
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({"url": url})}
  ).then(req => req.json())

  return mediaInfo;
}
// SELENIUM DECRYPTION END //

// Note: this is named mycloud but works for both mycloud & vidplay
export class MyCloudE extends VideoExtractor {
  protected override serverName = 'mycloud';

  override extract = async (): Promise<ISource> => {
    const url = this.referer;
    
    // Note:
    // Server side is handling more things than previously.
    // If I want to reverse to how it was done before, check commit before (including) this one:
    // https://github.com/Nixuge/mochis/commit/ce615f9ff486ec82b01dcdcb8e6d08a987871d8d

    let mediaInfo: IMediaInfo;
    try {
      console.log("attempting extraction using a cached token");
      mediaInfo = await attemptDecodingKeys(url, true);
    } catch(e) {
      try {
        console.log("attempting extraction using a fresh token");
        mediaInfo = await attemptDecodingKeys(url, false);
      } catch(e) {
        console.log("attempting extraction using a browser");
        mediaInfo = await attemptDecodingSelenium(url);
        // If this fails again, just let it throw an error...
      }
    }

    const sourcesJson = mediaInfo.result.sources;
    
    const videos = await getM3u8Qualities(sourcesJson[0]["file"])
    
    const subtitles = parseSubtitles(mediaInfo.result.tracks)

    return {
      videos: videos,
      subtitles: subtitles
    } satisfies ISource
  };
}
