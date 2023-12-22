import { VkE } from "./vk"
import { SibnetE } from "./sibnet";
import { SendVidE } from "./sendvid";
import { ISource, IVideo } from "../../shared/models/types";

export async function getVideo(url: string): Promise<ISource> {
    console.log(url);
    
    if (url.includes(".anime-sama.fr/videos/")) {
        return { sources: [{ url: url, isDASH: true }] }
    }

    const html = (await request.get(url)).text();

    if (url.startsWith("https://video.sibnet.ru/shell.php?videoid=")) {
        return new SibnetE(url, html).extract()
    }
    if (url.startsWith("https://vk.com/video_ext.php?")) {
        return new VkE(url, html).getSource();
    }
    if (url.startsWith("https://sendvid.com/embed/")) {
        return new SendVidE(url, html).getSource()
    }
    
    throw Error("No extractor for url " + url);
}