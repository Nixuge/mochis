import { IVideo } from "../models/types";
import { FilemoonE } from "./filemoon"
import { Mp4uploadE } from "./mp4upload";

export async function getVideo(url: string): Promise<IVideo[]> {
    const html = (await request.get(url, {headers: {"Referer": "https://aniwave.to/"}})).text();
    
    // Dirty for now
    if (url.includes("https://filemoon.sx/")) {
        return new FilemoonE(url, html).extract()
    }
    if (url.includes("https://www.mp4upload.com/")) {
        return new Mp4uploadE(url, html).extract()
    }
    
    throw Error("No extractor for url " + url);
}