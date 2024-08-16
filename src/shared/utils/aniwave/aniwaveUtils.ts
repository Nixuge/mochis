import { b64encode, b64decode } from "../b64";

export function serializeText(t: string) {
    return "".concat(b64encode(t)).replace(/\//g, "_").replace(/\+/g, "-");
}

export function deserializeText(t: string) {    
    return b64decode(t.replace(/_/g, '/').replace(/-/g, '+'));
}

export function reverse(t: string) {
    return t.split("").reverse().join("");
}