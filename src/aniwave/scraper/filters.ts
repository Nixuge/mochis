import { SearchFilter, SearchFilterOption } from "@mochiapp/js/dist";
import { load } from "cheerio";

export async function scrapeFilters() {
    if (filters.length > 0)
        return;
    
    const html = await request.get("https://aniwave.to/filter").then(resp => resp.text())
    const $ = load(html);
    // 3 special cases:
    // - search: type text, to ignore
    // - genre: ✅/❌ for each option + "must have all selected genres" special toggle
    // - sort: single value (all other are multi select)

    const allInputs: { [id: string]: SearchFilterOption[] } = {}
    $("form.filters div[class='filter']").map((i, filter) => {
        const filterRef = $(filter);
        filterRef.find("input").map((i, option) => {
            const optionRef = $(option);
            const attrs = option.attribs
            
            const type = attrs["type"]
            if (type == "text") // ignore search
                return undefined
            
            const id = attrs["name"]
            if (allInputs[id] === undefined)
                allInputs[id] = []

            allInputs[id].push({
                id: attrs["value"],
                displayName: optionRef.next().text()
            })
        })
    })

    const parsedFilters: SearchFilter[] = Object.entries(allInputs).map((val) => {
        const filter = val[0]
        const options = val[1]
        return {
            id: filter,
            displayName: filter.replace("[]", "").replaceAll("_", " "),
            multiselect: filter.endsWith("[]"),
            required: false,
            options
        } satisfies SearchFilter
    })
    filters = parsedFilters;    
}

export let filters: SearchFilter[] = []