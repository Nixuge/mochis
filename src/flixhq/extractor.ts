import { VidCloudE } from '../shared/extractors/vidcloud';
import { ISource } from '../shared/models/types';

export async function getVideo(url: string, provider: string): Promise<ISource> {
    provider = provider.toLowerCase()

    if (provider == "mixdrop")
        throw Error("Mixdrop is down")

    if (provider == "upcloud" || provider == "vidcloud")
        return await new VidCloudE(url).extract()
    
    throw Error("No extractor for url " + url + "(provider: " + provider + ")");
}