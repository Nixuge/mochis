import { VkE } from "./vk"
import { SibnetE } from "./sibnet";
import { SendVidE } from "./sendvid";
import { IVideo } from "../../shared/models/types";

export async function getVideo(url: string): Promise<IVideo[]> {
    console.log(url);
    
    if (url.includes(".anime-sama.fr/videos/")) {
        return [{ url: url, isDASH: true }]
    }

    const html = (await request.get(url)).text();

    if (url.startsWith("https://video.sibnet.ru/shell.php?videoid=")) {
        return new SibnetE(url, html).extract()
    }
    if (url.startsWith("https://vk.com/video_ext.php?")) {
        return new VkE(url, html).extract()
    }
    if (url.startsWith("https://sendvid.com/embed/")) {
        return new SendVidE(url, html).extract()
    }
    
    throw Error("No extractor for url " + url);
}