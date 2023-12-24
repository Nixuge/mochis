import { ISource } from '../../shared/models/types';
import { VidCloudE } from './vidcloud';

export async function getVideo(url: string, provider: string): Promise<ISource> {
    provider = provider.toLowerCase()

    if (provider == "mixdrop")
        throw Error("Mixdrop is down")

    if (provider == "upcloud" || provider == "vidcloud")
        return await new VidCloudE(url, "").getSource()
    
    throw Error("No extractor for url " + url + "(provider: " + provider + ")");
}