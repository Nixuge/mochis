import { VideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';

type PlayerImage = {
  success: boolean,
  image: string,
  hash_image: string,
  m: number // Not sure what that's for
}
type PlayerImageFail = {
  success?: boolean, // Actually never set if fail, but easier to check for success since it's just undefined
  try_again: string,
  isec: number
}

type DataResponse = {
  pending: string,
  need_captcha: string,
  ip: string,
  hash: string,
  t: string,
  blocked: string,
  adscore: string,
  try_again: string,
  updatecxt: string,
  ip_c: string,
  cat: string,
  obf_link: string
}

function imageGetSuccess(object: any): object is PlayerImage {
  return !!object.success;
}

function deobfLink(target: string) {
  if (target.indexOf('.') == -1) {
    target = target.substr(1);
    let s2 = '';
    for (let i = 0; i < target.length; i += 3) s2 += '%u0' + target.slice(i, i + 3);
    target = unescape(s2)
  }
  return target
}
function makeid() {
  return makeid_var(32); //default netu value, from embed.js
}
function makeid_var(length: number) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_*';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export class NetuE extends VideoExtractor {
  protected override serverName = 'netu';

  override extract = async (): Promise<ISource> => {
    const url = this.referer;
    const hostname = url.split("/").splice(0, 3).join("/");
    
    let iframe_url = this.htmlContent.match(/<iframe src=\"(\/e\/.*?)\"/)![1];
    let v = iframe_url.replace("/e/", "").split("?")[0];
    iframe_url = hostname + iframe_url;

    const iframe_text = await request.get(iframe_url).then(resp => resp.text());
    const adb = iframe_text.match(/adbn = \'(.*?)\',$/m)![1];

    const [_, video_id, video_key] = iframe_text.match(/'videoid': '([0-9]*)',.*?'videokey': '(.*?)'/s)!;
    const image_payload = {
        "videoid": video_id,
        "videokey": video_key,
        "width": 1324,
        "height": 563
    }    

    const image_res: PlayerImage | PlayerImageFail = await request.post(hostname + "/player/get_player_image.php", {
        body: JSON.stringify(image_payload),
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": hostname
        }
    }).then(resp => resp.json());
    
    if (!imageGetSuccess(image_res)) {
      throw Error("Getting image failed! isec: " + image_res.isec)
    }    
    
    const playButtonCoords: number[] = await request.post("https://mochi_back.nixuge.me/epicImageFinder", {
      body: JSON.stringify({"b64image": image_res.image}),
      headers: {"Content-Type": "application/json"}
    }
    ).then(req => req.json());
    
    const [x, y, radius] = playButtonCoords;

    // Note:
    // Hardcoded for now as this doesn't seem to change.
    // This is located inside the embed.js, in the super long line with chinese characters.
    // If this becomes variable, here's a way to get it:
    // const shh = eval(`function owo(){${CHINESE_LINE_HERE}; return shh;} owo()`)
    // This will require another request tho, which is why i'm not doing it rn.
    const shh = "762384534ad2168058529199987f15351806dc76";
    
    const body = {
      'sh': shh, 
      'ver':'4',
      'secure':"0",
      'adb': adb,
      'v':encodeURIComponent(v),
      'token':"",
      'gt':"",
      'embed_from':"0",
      'wasmcheck':1,
      'adscore':"",
      'click_hash':encodeURIComponent(image_res.hash_image),
      'clickx':x,
      'clicky':y
    };
    const headers = {
      "content-type": "application/json",
      "cookie": `EU_COOKIE_LAW_CONSENT=true; uid=${makeid()}`,
      "origin": "https://waaw.to",
      "pragma": "no-cache",
      "referer": iframe_url,
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest"
    };
    console.log(JSON.stringify(body));
    console.log(JSON.stringify(headers));
    
    
    const finalResp: DataResponse = await request.post(hostname + "/player/get_md5.php", {
      body: JSON.stringify(body), headers
    }).then(resp => resp.json());

    const link = finalResp.obf_link;
    if (!link || link == "#") {
      if (finalResp.ip)
        finalResp.ip = "xxx.xxx.xxx.xxx"; // Avoid leaking ips when sending logs
      throw Error("Failed to grab link!" + JSON.stringify(finalResp));
    }

    let clearLink = deobfLink(link);
    if (clearLink.startsWith("//"))
      clearLink = "https:" + clearLink;
    else if (clearLink.startsWith("/"))
      clearLink = hostname + clearLink;

    console.log("SUCCESS GRABBING NETU LINK! " + clearLink);

    return {
      headers: { 
        "Referer": hostname,
        "Origin": iframe_url
      },
      videos: [{
        url: clearLink,
        isDASH: false
      }]
    } satisfies ISource
  };
}
