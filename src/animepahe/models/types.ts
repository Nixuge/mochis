export type PaheAiringRequest = {
    total: number,
    per_page: number,
    current_page: number,
    last_page: string,
    next_page_url: string,
    prev_page_url: string,
    from: number,
    to: number,
    data: [{ [prop: string]: string}] // can't be bothered lmao
}

export type PaheRelease = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    next_page_url?: string;
    prev_page_url?: string;
    from: number;
    to: number;
    data: PaheEpisode[]
}

export type PaheEpisode = {
    id: number,
    anime_id: number,
    episode: number,
    episode2: number,
    edition: string,
    title: string,
    snapshot: string,
    disc: string,
    audio: string,
    duration: string,
    session: string,
    filler: number,
    created_at: string
}