import CryptoJS from 'crypto-js';
import { RawVideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../utils/subtitles';

// Mostly from consumet,
// thanks to them & theonlymo

type ResponseType = {
    sources: string,
    tracks: IRawTrackMedia[]
}

const R = (z, Q0) => {
    try {
      for (let Q1 = 0x0; Q1 < z.length; Q1++) {
        z[Q1] = z[Q1] ^ Q0[Q1 % Q0.length];
      }
    } catch (Q2) {
      return null;
    }
  };

  const o = z => {
    var Q0;
    var Q1 = null;
    // return null == (Q1 = z.clipboard) || (Q0 = z.localStorage.getItem("ktime"), z.t != Q0) ? null : (z = Q1(), new Uint8Array(z));
  return null;
};

  const decrypt = (z, Q0) => {
    try {
      var Q1 = CryptoJS.AES.decrypt(z, Q0);
      var str = Q1.toString(CryptoJS.enc.Utf8);      
      return JSON.parse(str);
    } catch (Q2) {
      console.log(Q2);
    }
    return [];
  };
export class VidCloudE extends RawVideoExtractor {
    protected override serverName = 'VidCloud';

    override extract = async (): Promise<ISource> => {
        const hostname = this.referer.split("/").slice(0, 3).join("/");
        const hostnameNoHttps = hostname.replace("https://", "");
        const id = this.referer.split('/').pop()?.split('?')[0];
        
        console.log(hostnameNoHttps);
        
        const options = { headers: {
            'Host': hostnameNoHttps,
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        }};
                
        const resp = await request.get(`${hostname}/ajax/v2/embed-4/pv`, options)
        const Q7: ResponseType = resp.json()
        // console.log(Q7);
        const Q6: ResponseType = {
            'sources': "",
            'tracks': []
          };
        var Q2 = 1878522368;
        // var Q3 = '43202' || Q2
        var Q3 = "43202"
        // var Q5 = o(window);
        var Q5 = o();

        var Q8;
        if (Array.isArray(Q7.sources)) {
          Q6.sources = Q7.sources;
        } else {
          let Q1 = [(0xff000000 & Q3) >> 0x18, (0xff0000 & Q3) >> 0x10, (0xff00 & Q3) >> 0x8, 0xff & Q3];
          console.log(Q1);
          console.log(Q3);
          
          Q8 = 0x0 != Q7.t ? (R(Q5, Q1), Q5) : (Q8 = Q7.k, R(Q8, Q1), Q8);
          Q8 = [234,120,84,161,60,47,106,96,88,67,91,19,255,69,64,229];
          console.log('a');
          
        //   console.log(String.fromCharCode.apply([234, 120, 84, 161, 60, 47, 106, 96, 88, 67, 91, 19, 255, 69, 64, 229]));
          console.log('b');
          
          Q8 = btoa(String.fromCharCode.apply(null, new Uint8Array(Q8)));
          console.log("Q8: " + Q8)
        //   https://discord.com/channels/1066496628757901472/1180253163698270268/1219809484507975710
          Q6.sources = decrypt("AES", Q8);
          console.log("out: " + Q6.sources);
          if (Q6.sources != "")
            console.log("Success !");
          
          
        }
        Q6.tracks = Q7.tracks;
        // console.log(Q6);
                
        // For some unknown reason, they removed the keys altogether?
        // so now the raw playlist.m3u8 url is in the response directly
        // If they do enable keys again, uncomment all below.
        
        // const keys: any = await request.get('https://raw.githubusercontent.com/eatmynerds/key/e4/key.txt').then(resp => resp.text());
        // const keyString = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(JSON.parse(keys)))));
        // console.log("aa");
        
        // console.log(keyString);
        // console.log("bb");
        
        var sources = "AES"
        const decryptedVal = CryptoJS.AES.decrypt(sources, "TEST").toString(CryptoJS.enc.Utf8);
        // console.log(decryptedVal);
        
        // const sourcesArray = data.sources.split('');
        // let extractedKey = '';

        // let currentIndex = 0;
        // for (const index of key) {
        //     const start = index[0] + currentIndex;
        //     const end = start + index[1];
        //     for (let i = start; i < end; i++) {
        //         extractedKey += data.sources[i];
        //         sourcesArray[i] = '';
        //     }
        //     currentIndex += parseInt(index[1]);
        // }

        // data.sources = sourcesArray.join('');
        // console.log(sourcesArray.join(''));

        return  {
            videos: []
        };

        // const decryptedVal = JSON.parse(CryptoJS.AES.decrypt(data.sources, extractedKey).toString(CryptoJS.enc.Utf8));

        // Making assumption that there's only 1 m3u8 element (which should basically always be the case).
        // const url: string = decryptedVal[0].file;
        // const videos = await getM3u8Qualities(url);

        const videos = await getM3u8Qualities(data.sources[0]["file"]);
        
        return {
            videos,
            subtitles: parseSubtitles(data.tracks)
        };
    };
}
