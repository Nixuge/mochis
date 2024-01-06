// import { DoodE } from '../shared/extractors/dood';
// import { UpstreamE } from '../shared/extractors/upstream';
// import { VidCloudE } from '../shared/extractors/vidcloud';
// import { VoeE } from '../shared/extractors/voe';
import { ISource } from '../shared/models/types';


export async function getVideo(url: string, provider: string): Promise<ISource> {
    provider = provider.toLowerCase()

    console.warn("You SHOULD see this");
    

    // if (provider == "mixdrop")
    //     throw Error("Mixdrop is down");

    // if (provider == "upcloud" || provider == "vidcloud")
    //     return await new VidCloudE(url).extract();
        
    // const html = await request.get(url).then(resp => resp.text())
    // if (provider == "upstream")
    //     return await new UpstreamE(url, html).getSource();

    // if (provider == "doodstream")
    //     return await new DoodE(url, html).getSource();

    // if (provider == "voe")
    //     return await new VoeE(url, html).extract();
    console.log("If you see this, it's a good sign. v0.1.16");
    
    
    throw Error("No extractor for url " + url + "(provider: " + provider + ")");
}