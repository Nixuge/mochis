import { ISource, IVideo } from "../models/types";
import { FilemoonE } from "./filemoon"
import { Mp4uploadE } from "./mp4upload";
import { MyCloudE } from "./mycloud";

export async function getVideo(url: string): Promise<ISource> {
    const html = (await request.get(url, {headers: {"Referer": "https://aniwave.to/"}})).text();
    
    // Dirty for now
    if (url.startsWith("https://filemoon.sx/")) {
        return new FilemoonE(url, html).extract()
    }
    if (url.startsWith("https://www.mp4upload.com/")) {
        return new Mp4uploadE(url, html).extract()
    }
    if (url.startsWith("https://mcloud.bz/") || url.startsWith("https://vidplay.online/")) {
        return new MyCloudE(url, html).extract()
    }
    
    throw Error("No extractor for url " + url);
}