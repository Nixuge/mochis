import CryptoJS from 'crypto-js';
import { RawVideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../utils/subtitles';

// Mostly from consumet,
// thanks to them & theonlymo

type ResponseType = {
    source: string,
    subtitle: string[]
}

export class VidCloudE extends RawVideoExtractor {
    protected override serverName = 'VidCloud';

    override extract = async (): Promise<ISource> => {
        const hostname = this.referer.split("/").slice(0, 3).join("/");
        const id = this.referer.split('/').pop()?.split('?')[0];

        console.log("Note: this is a beta. I have no idea if it's going to hold when a lot of users use it.");
        console.log("If you see this in the logs followed by an error for the request, consider it normal.");
        
        const data: ResponseType = await request.post("https://rabbitthunder-test.vercel.app/api/upcloud", {
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({"id": id})}
        ).then(req => req.json())


        const videos = await getM3u8Qualities(data.source);
        
        return {
            videos,
            // subtitles: parseSubtitles(data.subtitle)
        };
    };
}
