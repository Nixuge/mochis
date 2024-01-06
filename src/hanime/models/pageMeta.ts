// Thanks https://app.quicktype.io/?l=ts
// To replicate:

// const html = await request.get(baseVideoUrl + "/" + id).then(resp => resp.text())
// const jsonRes: PageMeta = JSON.parse(html.match(nuxtJsonRegex)![1]);
// const html2 = await request.get(baseUrl).then(resp => resp.text());
// const jsonRes2: PageMeta = JSON.parse(html2.match(nuxtJsonRegex)![1]);

// const html3 = await request.get(baseUrl + "/search").then(resp => resp.text());
// const jsonRes3: PageMeta = JSON.parse(html3.match(nuxtJsonRegex)![1]);

// const html4 = await request.get(baseUrl + "/browse/trending").then(resp => resp.text());
// const jsonRes4: PageMeta = JSON.parse(html4.match(nuxtJsonRegex)![1]);

// then use the mergeObject utils on all 4 jsons & pass through the website


export type PageMeta = {
    layout: string;
    data: Datum[];
    error: null;
    serverRendered: boolean;
    state: State;
}

export type Datum = {
}

export type State = {
    scrollY: number;
    version: number;
    is_new_version: boolean;
    r: null;
    country_code: null;
    page_name: string;
    user_agent: string;
    ip: null;
    referrer: null;
    geo: null;
    is_dev: boolean;
    is_wasm_supported: boolean;
    is_mounted: boolean;
    is_loading: boolean;
    is_searching: boolean;
    browser_width: number;
    browser_height: number;
    system_msg: string;
    data: Data;
    auth_claim: null;
    session_token: string;
    session_token_expire_time_unix: number;
    env: Env;
    user: null;
    user_setting: null;
    user_search_option: null;
    playlists: null;
    shuffle: boolean;
    account_dialog: AccountDialog;
    contact_us_dialog: ContactUsDialog;
    general_confirmation_dialog: GeneralConfirmationDialog;
    snackbar: Snackbar;
    search: StateSearch;
}

export type AccountDialog = {
    is_visible: boolean;
    active_tab_id: string;
    tabs: Tab[];
}

export type Tab = {
    id: string;
    icon: string;
    title: string;
}

export type ContactUsDialog = {
    is_visible: boolean;
    is_video_report: boolean;
    subject: string;
    email: string;
    message: string;
    is_sent: boolean;
}

export type Data = {
    video: Video;
    landing: Landing;
    search: DataSearch;
    trending: Trending;
}

export type Landing = {
    sections: Section[];
    hentai_videos: HentaiVideo[];
    bs: LandingBs;
    hvs: { [key: string]: HentaiVideo };
    processed_sections: ProcessedSections;
}

export type LandingBs = {
    footer_0: Adhesion0;
    adhesion_2: Adhesion0;
    adhesion_1: Adhesion0;
    adhesion_0: Adhesion0;
}

export type Adhesion0 = {
    mobile: Desktop;
    desktop: Desktop;
}

export type Desktop = {
    id: number;
    ad_id: string;
    ad_type: AdType;
    placement: string;
    image_url: null | string;
    iframe_url: null | string;
    click_url: null | string;
    width: number;
    height: number;
    page: Page;
    form_factor: FormFactor;
    video_url: null;
    impressions: number;
    clicks: number;
    seconds: number;
    placement_x: null | string;
}

export enum AdType {
    Ifr = "ifr",
    Native = "native",
}

export enum FormFactor {
    Desktop = "desktop",
    Mobile = "mobile",
}

export enum Page {
    Landing = "landing",
    Search = "search",
    Video = "video",
}

export type HentaiVideo = {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    released_at: string;
    views: number;
    interests: number;
    poster_url: string;
    cover_url: string;
    is_hard_subtitled: boolean;
    brand: string;
    duration_in_ms: number;
    is_censored: boolean;
    rating: number | null;
    likes: number;
    dislikes: number;
    downloads: number;
    monthly_rank: number | null;
    brand_id: string;
    is_banned_in: IsBannedIn;
    preview_url: null;
    primary_color: null;
    created_at_unix: number;
    released_at_unix: number;
    is_visible?: boolean;
    description?: string;
    hentai_tags?: HentaiVideoHentaiTag[];
    titles?: Title[];
}

export type HentaiVideoHentaiTag = {
    id: number;
    text: string;
}

export enum IsBannedIn {
    Jp = "JP",
    JpUs = "JP,US",
}

export type Title = {
    lang: string;
    kind: string;
    title: string;
}

export type ProcessedSections = {
    "Recent Uploads": HentaiVideo[];
    "New Releases": HentaiVideo[];
    Trending: HentaiVideo[];
    Random: HentaiVideo[];
}

export type Section = {
    title: string;
    hentai_video_ids: number[];
}

export type DataSearch = {
    bs: SearchBs;
}

export type SearchBs = {
    smart_0: Adhesion0;
    top_0: Top0;
}

export type Top0 = {
    mobile: Desktop;
}

export type Trending = {
    hentai_videos: HentaiVideo[];
    time: string;
    page_size: number;
    page: number;
    number_of_pages: number;
    breadcrumb_items: BreadcrumbItem[];
}

export type BreadcrumbItem = {
    title: string;
    to: string;
}

export type Video = {
    player_base_url: string;
    hentai_video: HentaiVideo;
    hentai_tags: VideoHentaiTag[];
    hentai_franchise: HentaiFranchise;
    hentai_franchise_hentai_videos: HentaiVideo[];
    hentai_video_storyboards: HentaiVideoStoryboard[];
    brand: Brand;
    watch_later_playlist_hentai_videos: null;
    like_dislike_playlist_hentai_videos: null;
    playlist_hentai_videos: null;
    similar_playlists_data: null;
    next_hentai_video: HentaiVideo;
    next_random_hentai_video: HentaiVideo;
    videos_manifest: VideosManifest;
    user_license: null;
    bs: VideoBs;
    ap: number;
    pre: string;
    host: string;
}

export type Brand = {
    id: number;
    title: string;
    slug: string;
    website_url: null;
    logo_url: null;
    email: null;
    count: number;
}

export type VideoBs = {
    ntv_1: Ntv;
    ntv_2: Ntv;
    footer_0: Adhesion0;
    native_1: Top0;
    native_0: Top0;
    ntv_0: Ntv;
}

export type Ntv = {
    desktop: Desktop;
}

export type HentaiFranchise = {
    id: number;
    name: string;
    slug: string;
    title: string;
}

export type VideoHentaiTag = {
    id: number;
    text: string;
    count: number;
    description: string;
    wide_image_url: string;
    tall_image_url: string;
}

export type HentaiVideoStoryboard = {
    id: number;
    num_total_storyboards: number;
    sequence: number;
    url: string;
    frame_width: number;
    frame_height: number;
    num_total_frames: number;
    num_horizontal_frames: number;
    num_vertical_frames: number;
}

export type VideosManifest = {
    servers: Server[];
}

export type Server = {
    id: number;
    name: string;
    slug: string;
    na_rating: number;
    eu_rating: number;
    asia_rating: number;
    sequence: number;
    is_permanent: boolean;
    streams: Stream[];
}

export type Stream = {
    id: number;
    server_id: number;
    slug: string;
    kind: string;
    extension: string;
    mime_type: string;
    width: number;
    height: string;
    duration_in_ms: number;
    filesize_mbs: number;
    filename: string;
    url: string;
    is_guest_allowed: boolean;
    is_member_allowed: boolean;
    is_premium_allowed: boolean;
    is_downloadable: boolean;
    compatibility: string;
    hv_id: number;
    server_sequence: number;
    video_stream_group_id: string;
    extra2: null;
}

export type Env = {
    vhtv_version: number;
    premium_coin_cost: number;
    mobile_apps: MobileApps;
}

export type MobileApps = {
    code_name: string;
    _build_number: number;
    _semver: string;
    _md5: string;
    _url: string;
}

export type GeneralConfirmationDialog = {
    is_visible: boolean;
    is_persistent: boolean;
    is_mini_close_button_visible: boolean;
    is_cancel_button_visible: boolean;
    cancel_button_text: string;
    title: string;
    body: string;
    confirm_button_text: string;
    confirmation_callback: null;
}

export type StateSearch = {
    cache_sorting_config: Array<CacheSortingConfigClass | string>;
    cache_tags_filter: null;
    cache_active_brands: null;
    cache_blacklisted_tags_filter: null;
    search_text: string;
    search_response_payload: null;
    total_search_results_count: number;
    order_by: string;
    ordering: string;
    tags_match: string;
    page_size: number;
    offset: number;
    page: number;
    number_of_pages: number;
    tags: any[];
    active_tags_count: number;
    brands: any[];
    active_brands_count: number;
    blacklisted_tags: any[];
    active_blacklisted_tags_count: number;
    is_using_preferences: boolean;
}

export type CacheSortingConfigClass = {
    created_at_unix: CreatedAtUnix;
}

export type CreatedAtUnix = {
    order: string;
}

export type Snackbar = {
    timeout: number;
    context: string;
    mode: string;
    y: string;
    x: string;
    is_visible: boolean;
    text: string;
}
