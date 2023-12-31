import { MochiResponse } from '@mochiapp/js/dist';
import { ISource } from '../shared/models/types';
import { VoeE } from '../shared/extractors/voe';
import { StreamtapeE } from '../shared/extractors/streamtape';
import { DoodE } from '../shared/extractors/dood';
import { UpstreamE } from '../shared/extractors/upstream';


export async function getVideo(url: string, provider: string): Promise<ISource> {
    let req: MochiResponse;
    let status: number = 0;
    let statusText: string = "";

    console.log(`"${url}"`);
    try {
        req = await request.get(url, {headers: {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"}});
        status = req.status; statusText = req.statusText; // Mochi bad response code
    } catch(e) {
        // @ts-ignore
        if (e.status) {
            // @ts-ignore
            status = e.response.status; statusText = e.response.statusText; // Axios bad response code
        } else {
            console.warn(e); // Actual issue
        }
    }
    if (status != 200) {
        throw Error(`Server request failed url: ${url} (${provider})! Response code: ${status}, ${statusText}`)
    }
    const html = req!.text();

    switch (provider) {
        case "Voe.SX":
            return new VoeE(url, html).extract();
        case "Streamtape.com":
            return new StreamtapeE(url, html).getSource();
        case "Dood.to":
            return new DoodE(url, html).getSource() //Note: cloudflare's flagging this :/
        case "Upstream.to":
            return new UpstreamE(url, html).getSource()
        default:
            break;
    }

    throw Error("No extractor for url " + url + "(provider: " + provider + ")");
}