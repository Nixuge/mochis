import { MochiResponse } from "@mochiapp/js/dist";
import { RawVideoExtractor, VideoExtractor } from "./Iextractor";
import { ISource, IVideo } from "./types";

function isVideoArray(obj: IVideo[] | ISource): obj is IVideo[] {
  return Array.isArray(obj);
}
type ExtractorConstructor = new (...args: any[]) => RawVideoExtractor;

function isVideoExtractorConstructor(obj: any): obj is ExtractorConstructor {
  return obj.prototype instanceof RawVideoExtractor;
}

export type AnyExtractor = typeof RawVideoExtractor | typeof VideoExtractor;

export class UrlMatcher {
  protected providers: {[provider: string]: AnyExtractor};
  protected provider?: string;
  protected url: string;
  protected useStartWith: boolean;
  constructor(providerMap: {[provider: string]: AnyExtractor}, url: string, provider?: string, useStartWith: boolean = false) {
    this.providers = providerMap;
    this.provider = provider;
    this.url = url;
    this.useStartWith = useStartWith;
  }

  // Note: should prolly be moved somewhere else & made public as it handles both axios & the app
  private async requestHtmlSafe() {
    let req: MochiResponse;
    let status: number = 0;
    let statusText: string = "";
    try {
        req = await request.get(this.url);
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
        throw Error(`Server request failed url: ${this.url} (${this.provider})! Response code: ${status}, ${statusText}`)
    }
    const html = req!.text();
    return html;
  }

  public async getResult(): Promise<ISource> {
    // Find the provider to be used
    let match: [string, AnyExtractor] | undefined = undefined;
    for (const [provider, extractor] of Object.entries(this.providers)) {
        if (this.provider === undefined) {
            // Fallback for url check if no provider set
            if (this.url.startsWith(provider)) {
                match = [provider, extractor];
                break;
            }
        } else {
            if (this.useStartWith) {
                // useStartWith w provider defined
                if (this.provider.startsWith(provider)) {
                    match = [provider, extractor];
                    break;
                }
            } else {
                // Normal case, direct match
                if (this.provider == provider) {
                    match = [provider, extractor];
                    break;
                }
            }
        }
    }
    if (match == undefined)
        throw Error(`No extractor found for provider ${this.provider} (url ${this.url})`);
    
    // Get it out of the array & make sure it's an actual extractor and not an abstract class
    const [_usedProviderName, usedExtractor] = match;
    if (!isVideoExtractorConstructor(usedExtractor)) {
        throw new Error("Class is abstract, can't instantiate !")
    }
    let returnData: IVideo[] | ISource | undefined = undefined;

    // Actually make the request
    // = VideoExtractor, needs an html request
    if (usedExtractor.prototype instanceof VideoExtractor) {
        const html = await this.requestHtmlSafe();
        returnData = await new usedExtractor(this.url, html).extract();
    } else { // = RawVideoExtractor, doesn't need anything
        returnData = await new usedExtractor(this.url).extract();
    }

    // If is a video array, convert to an ISource
    if (isVideoArray(returnData)) {
        return {
            videos: returnData
        }
    }
    return returnData;
  }
}
