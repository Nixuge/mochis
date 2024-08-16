import { rc4Cypher } from "../../shared/utils/aniwave/rc4";
import { substituteString } from "../../shared/utils/aniwave/substituteString";
import { b64encode } from "../../shared/utils/b64";

function serializeText(t: string) {
    return "".concat(b64encode(t)).replace(/\//g, "_").replace(/\+/g, "-");
}

export function getVrf(input: string) {
    const reverse = (str: string) => str.split("").reverse().join("");

    // required - transform to string
    input = '' + input;

    input = substituteString(input, "AP6GeR8H0lwUz1", "UAz8Gwl10P6ReH");
    input = rc4Cypher("ItFKjuWokn4ZpB", input);
    input = serializeText(input);
    input = reverse(input);

    input = reverse(input);
    input = rc4Cypher("fOyt97QWFB3", input);
    input = serializeText(input);
    input = substituteString(input, "1majSlPQd2M5", "da1l2jSmP5QM");

    input = substituteString(input, "CPYvHj09Au3", "0jHA9CPYu3v");
    input = reverse(input);
    input = rc4Cypher("736y1uTJpBLUX", input);
    input = serializeText(input);

    input = serializeText(input);
    return input;
}


function b64decode(t: string) {
    if ((t = (t = (t = "".concat(t)).replace(/[\t\n\f\r]/g, "")).length % 4 == 0 ? t.replace(/==?$/, "") : t).length % 4 == 1 || /[^+/0-9A-Za-z]/.test(t)) {
        return null!;
    }
    var r;
    var s = "";
    var o = 0;
    var u = 0;
    for (var h = 0; h < t.length; h++) {
        r = t[h];
        // @ts-ignore
        o = (o <<= 6) | ((r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(r)) < 0 ? undefined : r);
        if (24 === (u += 6)) {
            s = (s = (s += String.fromCharCode((16711680 & o) >> 16)) + String.fromCharCode((65280 & o) >> 8)) + String.fromCharCode(255 & o);
            o = u = 0;
        }
    }
    if (12 === u) {
        o >>= 4;
        s += String.fromCharCode(o);
    } else if (18 === u) {
        o >>= 2;
        s = (s += String.fromCharCode((65280 & o) >> 8)) + String.fromCharCode(255 & o);
    }
    return s;
};


export function decodeVideoSkipData(encoded_url: string) {
    encoded_url = b64decode("".concat(encoded_url).replace(/_/g, "/").replace(/-/g, "+"));
    const decoded_url = decodeURIComponent(rc4Cypher("ctpAbOz5u7S6OMkx", encoded_url));
    return (decoded_url);
}
// clearer name
// export function getVrf(input: string) { return encodeURIComponent(idToVrf(input)) };
