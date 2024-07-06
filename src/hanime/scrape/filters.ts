import { SearchFilter, SearchFilterOption } from "@mochiapp/js/dist";
import { FilterScrape } from "../models/filter";

export async function scrapeFilters() {
    if (filters.length > 0)
        return;
    
    // Note: this is quite dirty lmao
    const rawHanimeJs = await request.get("https://hanime.tv/dist/774702ea5de712d430ef.js");
    
    let res: FilterScrape = new Function(`return {${rawHanimeJs.text().match(/order_options:\[.*?}\]}/g)![0]}`)();

    const parsedFilters: SearchFilter[] = []
    
    // Order
    // Note that due to how things are handled from hanime's pov, the order_by & ordering are in a dict on this one. This needs to be processed in search()
    // to turn them back to their original tags.
    const orderOptions: SearchFilterOption[] = res.order_options.map(opt => 
        ({displayName: opt.text, id: JSON.stringify({order_by: opt.order_by, ordering: opt.ordering})} satisfies SearchFilterOption) 
    )
    parsedFilters.push({
        id: "order_by_to_process",
        displayName: "Order By",
        multiselect: false,
        required: true,
        options: orderOptions
    } satisfies SearchFilter)

    // Tags
    parsedFilters.push({
        id: "tags_mode",
        displayName: "Tags mode",
        multiselect: false,
        required: true,
        options: [{displayName: "And", id:"AND"}, {displayName: "Or", id:"OR"}]
    } satisfies SearchFilter)

    const tagOptions: SearchFilterOption[] = res.tags.map(opt => ({displayName: opt.text, id: opt.text.toLowerCase()} satisfies SearchFilterOption))
    parsedFilters.push({
        id: "tags",
        displayName: "Tags",
        multiselect: true,
        required: false,
        options: tagOptions
    } satisfies SearchFilter)
    // Not sure if I need a second list (does it get mutated? idk, guess not but meh)
    const blacklistedTagOptions: SearchFilterOption[] = res.blacklisted_tags.map(opt => ({displayName: opt.text, id: opt.text.toLowerCase()} satisfies SearchFilterOption))
    parsedFilters.push({
        id: "blacklist",
        displayName: "Blacklisted tags",
        multiselect: true,
        required: false,
        options: blacklistedTagOptions
    } satisfies SearchFilter)

    // Brand
    const brandOptions: SearchFilterOption[] = res.brands.map(opt => ({displayName: opt.text, id: opt.text.toLowerCase()} satisfies SearchFilterOption))
    parsedFilters.push({
        id: "brands",
        displayName: "Brand",
        multiselect: true,
        required: false,
        options: brandOptions
    } satisfies SearchFilter)

    filters = parsedFilters;
}

export let filters: SearchFilter[] = []