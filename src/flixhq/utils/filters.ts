import { SearchFilter, SearchFilterOption } from "@mochiapp/js/dist";
import { load } from "cheerio";

export let filters: SearchFilter[] = []

export async function loadFilters() {
    if (filters.length > 0)
        return;
    
    const html = await request.get("https://flixhq.to/search/hunter-x-hunter").then(resp => resp.text());
    const $ = load(html);

    filters = $("div.category_filter-content div.cfc-item").map((i, item) => {
        const $ = load(item);
        const title = $("div.ni-head").text().replace(":", "");
        let multiSelect = false;
        let filterId: string | undefined;
        
        const options: SearchFilterOption[] = $("div.ni-list div.form-check div.custom-control").map((i, elem) => {
            const elemRef = $(elem);
            const input = elemRef.find("input");
            if (!filterId) {
                multiSelect = input.attr("name")!.includes("[]");
                filterId = input.attr("id")!.split("-")[0];
            }
                
            const optionId = input.attr("value")!;
            const optionText = elemRef.find("label").text();
            return {
                id: optionId,
                displayName: optionText
            }
        }).get()
    
        return {
            id: filterId!,
            displayName: title,
            multiselect: multiSelect,
            required: false,
            options
        }
    }).get()
}