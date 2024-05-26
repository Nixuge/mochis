export type FilterScrape = {
    order_options: OrderOption[],
    brands: Brand[],
    tags: Tag[],
    blacklisted_tags: Tag[] // same data as tags.
}

export type OrderOption = {
    text: string,
    order_by: string,
    ordering: "asc" | "desc",
    is_active: boolean
}

export type Brand = {
    text: string,
    is_active: boolean
}

export type Tag = {
    text: string,
    is_active: boolean
}