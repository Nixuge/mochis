// 'set-cookie': 'XSRF-TOKEN=eyJpdiI6ImIvaVh4YjNocGYzSWFiOTM2ZDBqcEE9PSIsInZhbHVlIjoiZ3hLcjhKV0hwcU1NbnhNREpUM2VudGhLMkdobEhEYXZnTjFteE0wTHVJRkZFU204c1BFSmMyRktWTGx2bFYxSE5CUlVGdFprSWV3UWNmK2phY2Q4ZnlFaUM5N2JwZ2xreWdXTlI5dGRUeXVZeEI5WHJTaVcrcTYvdUtqcUgwb1IiLCJtYWMiOiJmNzcyOGM0OTExNTg1N2ZjMWI2OWM0NzllNDFlYTA3Y2JmMmIxOTVlMzUyY2NjZmE3NjAwYTM0NGJmMzhmNjZjIiwidGFnIjoiIn0%3D; expires=Fri, 27 Dec 2024 17:12:55 GMT; Max-Age=31536000; path=/; samesite=lax, hstream_session=eyJpdiI6IjNTaFlwcm14VHVwVXA1T2ZRRFFoUUE9PSIsInZhbHVlIjoiSTdNemc1Mnp2WHdvUzExb3BoWWtwU1psdm1LcGxOdytMcVZrRTJOT2xDcnVxVGpLOUY2Uk13WTI4N3RiZ3VsaEJ5VndqQ0VmMEJYVXM0bG1iSy9TMkhndFRHdDZpeEZhZCsxRlRRdGpNdXl6QmU2WHFBRS80NWlDbXZrdVV0Y3UiLCJtYWMiOiI0OGNjODVlMzMzNDk2MjhkMjZjMzgwMmE0NmJmMzBlMmNhMGVjMDJmOWQxY2UwOTQyMDcyNjBmZTFmNTZlYzYwIiwidGFnIjoiIn0%3D; expires=Fri, 27 Dec 2024 17:12:55 GMT; Max-Age=31536000; path=/; httponly; samesite=lax',


export function grabSetCookieValues(headers: Record<string, string>): {[name: string]: string} {
    const setCookieHeaderName = Object.keys(headers).find(key => key.toLowerCase() === "set-cookie")!;
    const cookie = headers[setCookieHeaderName];
    const splitted = cookie.split(",")
    const result = {}
    for (let part of splitted) {
        part = part.trim();
        part = part.split(";")[0]
        const [key, value] = part.split("=")
        result[key] = value
    }

    return result;
}