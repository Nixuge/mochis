import { IVideo } from '../models/types';
// Note: this regex gets the vertical resolution only, only thing we need for the quality enum.
const M3U8_PATTERN = /#EXT-X-STREAM-INF:[^\n]*RESOLUTION=\d+x(\d+)[^\n]*\n([^\n]+)/g; 

export type M3u8Opts = {
    keepAuto?: boolean,
    customPattern?: RegExp,
    headers?: Record<string, string>
}

export async function getM3u8Qualities(mainFileUrl: string, opts: M3u8Opts = {}): Promise<IVideo[]> {
    const usedPattern = opts.customPattern ? opts.customPattern : M3U8_PATTERN;

    const urlSplit = mainFileUrl.split("/")
    const baseDomain = urlSplit.slice(0, 3).join("/") + "/"
    urlSplit.pop()
    const baseUrl = urlSplit.join("/") + "/"

    const sources: IVideo[] = []
    if (opts.keepAuto === undefined || opts.keepAuto)
        sources.push({
            url: mainFileUrl,
            quality: "auto",
            isDASH: false,
          } satisfies IVideo)
    
    let m3u8Data: string = "";
    try {
        m3u8Data = await request.get(mainFileUrl, { headers: opts.headers }).then(resp => resp.text());
    } catch(e) {
        throw Error("Error grabbing m3u8data for url '" + mainFileUrl + "': " + e);
    }
    const m3u8Sources = m3u8Data.matchAll(usedPattern);
    for (const m3u8Source of m3u8Sources) {
        const quality = m3u8Source[1];
        let url = m3u8Source[2];
        if (url.startsWith("/"))
            url = baseDomain + url;
        else if (url.startsWith("https://") || url.startsWith("http://"))
            url = url // do nothing, just for clarity reasons
        else
            url = baseUrl + url;

        sources.push({
            url: url,
            quality: `q${quality}p`,
            isDASH: false
        } satisfies IVideo)
        
    }
    return sources;
}