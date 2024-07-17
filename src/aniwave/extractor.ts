import { ISource } from '../shared/models/types';
import { FilemoonE } from "../shared/extractors/filemoon"
import { Mp4uploadE } from "../shared/extractors/mp4upload";
import { MyCloudE } from "../shared/extractors/mycloud";

export async function getVideo(url: string): Promise<ISource> {
    const html = (await request.get(url, {headers: {"Referer": "https://aniwave.to/"}})).text();
    
    // Check for URLs matches
    if (url.startsWith("https://filemoon.sx/") || url.startsWith("https://kerapoxy.cc/") || url.startsWith("https://hellnaw.cc/")) {
        return new FilemoonE(url, html).extract()
    }
    if (url.startsWith("https://www.mp4upload.com/")) {
        return new Mp4uploadE(url, html).extract()
    }
    if (url.startsWith("https://mcloud.bz/") || url.startsWith("https://vidplay.online/") || url.startsWith("https://ea1928580f.site/")) {
        return new MyCloudE(url, html).extract()
    }

    // If the url doesn't match anything, as of now it's either vidplay or filemoon, so check their html
    if (html.includes("Barracuda")) {
        return new FilemoonE(url, html).extract()
    }
    if (html.includes("mcloud/min/embed.js")) {
        return new MyCloudE(url, html).extract()
    }    

    console.warn(`No extractor found for url ${url}. 
    However, due to the fact vidplay really enjoy changing their domain often, the vidplay extractor is going to be used.
    If this doesn't work, consider it normal & report it.`);

    return new MyCloudE(url, html).extract()
}