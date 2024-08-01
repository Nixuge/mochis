import { rc4Cypher } from "../../shared/utils/aniwave/rc4";
import { b64encode } from "../../shared/utils/b64";

function serializeText(t: string) {
    return "".concat(b64encode(t)).replace(/\//g, "_").replace(/\+/g, "-");
}

// To be called on the id to get data.
function idToVrf(t: string) {    
    t = encodeURIComponent(t);
    return function (t) {
      // var s = 8;
      // t = serializeText(caesarRot13(caesarRot13(t)))
      // var r = "";
      // for (var o = 0; o < t.length; o++) {
      //   var h = t.charCodeAt(o);
      //   if (o % s == 7) {
      //     h += 6;
      //   } else if (o % s == 5) {
      //     h -= 3;
      //   } else if (o % s == 3) {
      //     h += 6;
      //   } else if (o % s == 2) {
      //     h -= 5;
      //   } else if (o % s == 6) {
      //     h += 3;
      //   } else if (o % s == 0) {
      //     h -= 2;
      //   } else if (o % s == 4) {
      //     h += 2;
      //   } else if (o % s == 1) {
      //     h -= 4;
      //   }
      //   r += String.fromCharCode(h);
      // }
      // return r = serializeText(r = r.split("").reverse().join(""));
      return t;
    }(serializeText(rc4Cypher("T78s2WjTc7hSIZZR", t)));
}

function caesarRot13(t) {
    return t.replace(/[a-zA-Z]/g, function (t) {
        // @ts-ignore
        const res = String.fromCharCode((t <= "Z" ? 90 : 122) >= (t = t.charCodeAt(0) + 13) ? t : t - 26);
        return res;
    });
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
export function getVrf(input: string) { return encodeURIComponent(idToVrf(input)) };
