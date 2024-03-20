import { RawVideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';
import { PlaylistEpisodeServerSubtitle, PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';


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
        
        const data: ResponseType = await request.post("https://rabbitthunder-test.vercel.app/api/vidcloud", {
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({"id": id})}
        ).then(req => req.json())


        const videos = await getM3u8Qualities(data.source);
        const subtitles: PlaylistEpisodeServerSubtitle[] = [];
        for (const subtitle of data.subtitle) {
          let name = subtitle;
          try {
            const splitted = subtitle.split("/");
            name = splitted[splitted.length-1].split(".vtt")[0]
          } catch {}
          subtitles.push({
            url: subtitle,
            name,
            format: PlaylistEpisodeServerSubtitleFormat.vtt,
            default: false,
            autoselect: false
          } satisfies PlaylistEpisodeServerSubtitle)
        }


        return {
            videos,
            subtitles
        };
    };
}
