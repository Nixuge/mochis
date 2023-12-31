import { VkE } from "../shared/extractors/vk"
import { SibnetE } from "../shared/extractors/sibnet";
import { SendVidE } from "../shared/extractors/sendvid";
import { ISource } from "../shared/models/types";
import { isTesting } from "../shared/utils/isTesting";

// Why is this used?
// Basically, the .text() function works on most responses, but it seems like
// on sibnet's response, only on Mochi, it returns an empty string. (fine on runner)
// This may be because it has russian characters?
// For the time being, keeping it like this.
function arrayBufferToString(buffer: ArrayBuffer) {
    let str = '';
    const array = new Uint8Array(buffer);
    for (let i = 0; i < array.length; i++) {
      str += String.fromCharCode(array[i]);
    }
    return str;
}

export async function getVideo(url: string): Promise<ISource> {    
    if (url.includes(".anime-sama.fr/videos/")) {
        return { videos: [{ url: url, isDASH: true }] }
    }

    const html = await request.get(url).then(resp => {
        return isTesting() ? resp.text() : arrayBufferToString(resp.data())
    });

    if (url.startsWith("https://video.sibnet.ru/shell.php?")) {
        return new SibnetE(url, html).extract();
    }
    if (url.startsWith("https://vk.com/video_ext.php?")) {
        return new VkE(url, html).getSource();
    }
    if (url.startsWith("https://sendvid.com/embed/")) {
        return new SendVidE(url, html).getSource();
    }
    
    throw Error("No extractor for url " + url);
}