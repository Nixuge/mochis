import { ISource } from '../shared/models/types';
import { FilemoonE } from "../shared/extractors/filemoon"
import { Mp4uploadE } from "../shared/extractors/mp4upload";
import { MyCloudE } from "../shared/extractors/mycloud";

export async function getVideo(url: string): Promise<ISource> {
    const html = (await request.get(url, {headers: {"Referer": "https://aniwave.to/"}})).text();
    
    // Dirty for now
    if (url.startsWith("https://filemoon.sx/") || url.startsWith("https://kerapoxy.cc/") || url.startsWith("https://hellnaw.cc/")) {
        return new FilemoonE(url, html).extract()
    }
    if (url.startsWith("https://www.mp4upload.com/")) {
        return new Mp4uploadE(url, html).extract()
    }
    if (url.startsWith("https://mcloud.bz/") || url.startsWith("https://vidplay.online/") || url.startsWith("https://ea1928580f.site/")) {
        return new MyCloudE(url, html).extract()
    }

    console.warn(`No extractor found for url ${url}. 
    HOWEVER, due to the fact vidplay really enjoy changing their domain often, the vidplay extractor is going to be used.
    I could rewrite some parts of the module to simply pass along the name of the server instead of the url only, but too much work ngl (5mins).
    (+ w how the system is made it's technically made to only pass 1 property which is the url here)`);

    return new MyCloudE(url, html).extract()
}