import CryptoJS from 'crypto-js';
import { RawVideoExtractor } from '../../shared/models/Iextractor';
import { ISource } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../../shared/utils/subtitles';

// Mostly from consumet,
// thanks to them & theonlymo

type ResponseType = {
    sources: string,
    tracks: IRawTrackMedia[]
}

export class VidCloudE extends RawVideoExtractor {
    protected override serverName = 'VidCloud';

    override extract = async (): Promise<ISource> => {
        const hostname = this.referer.split("/").slice(0, 3).join("/");
        const id = this.referer.split('/').pop()?.split('?')[0];

        const options = { headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Referer: hostname,
        }};

        const data: ResponseType = await request.get(`${hostname}/ajax/embed-4/getSources?id=${id}`, options).then(resp => resp.json())
        // console.log(`${hostname}/ajax/embed-4/getSources?id=${id}`);
        
        // console.log(data);
        

        const key: any = await request.get('https://raw.githubusercontent.com/theonlymo/keys/e4/key').then(resp => resp.json());
        const sourcesArray = data.sources.split('');
        let extractedKey = '';

        let currentIndex = 0;
        for (const index of key) {
            const start = index[0] + currentIndex;
            const end = start + index[1];
            for (let i = start; i < end; i++) {
                extractedKey += data.sources[i];
                sourcesArray[i] = '';
            }
            currentIndex += parseInt(index[1]);
        }

        data.sources = sourcesArray.join('');

        const decryptedVal = JSON.parse(CryptoJS.AES.decrypt(data.sources, extractedKey).toString(CryptoJS.enc.Utf8));

        // Making assumption that there's only 1 m3u8 element (which should basically always be the case).
        const url: string = decryptedVal[0].file;
        const videos = await getM3u8Qualities(url);
        
        return {
            videos,
            subtitles: parseSubtitles(data.tracks)
        };
    };
}
