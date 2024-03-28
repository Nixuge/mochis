function b64encode(data: string): string {
    data = "".concat(data);
    for (s = 0; s < data.length; s++) {
        if (255 < data.charCodeAt(s)) {
            return null!;
        }
    }
    var r = "";
    for (var s = 0; s < data.length; s += 3) {
        var o: any[] = [undefined, undefined, undefined, undefined];
        o[0] = data.charCodeAt(s) >> 2;
        o[1] = (3 & data.charCodeAt(s)) << 4;
        if (data.length > s + 1) {
            o[1] |= data.charCodeAt(s + 1) >> 4;
            o[2] = (15 & data.charCodeAt(s + 1)) << 2;
        }
        if (data.length > s + 2) {
            o[2] |= data.charCodeAt(s + 2) >> 6;
            o[3] = 63 & data.charCodeAt(s + 2);
        }
        for (var u = 0; u < o.length; u++) {
            r += "undefined" == typeof o[u] ? "=" : function (t) {
                if (0 <= t && t < 64) {
                    return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[t];
                }
            }(o[u]);
        }
    }
    return r;
}

function serializeText(t: string) {
    return "".concat(b64encode(t)).replace(/\//g, "_").replace(/\+/g, "-");
}
function rc4Cypher(key: string, data: string) {
    // console.log("cypher input: " + i + " cypher key: " + t);
    var n;
    var r: any[] = [];
    var s = 0;
    var o = "";
    for (var u = 0; u < 256; u++) {
        r[u] = u;
    }
    for (u = 0; u < 256; u++) {
        // console.log(t);
        s = (s + r[u] + key.charCodeAt(u % key.length)) % 256;
        n = r[u];
        r[u] = r[s];
        r[s] = n;
    }
    var u = 0;
    var s = 0;
    for (var h = 0; h < data.length; h++) {
        n = r[u = (u + 1) % 256];
        r[u] = r[s = (s + r[u]) % 256];
        r[s] = n;
        o += String.fromCharCode(data.charCodeAt(h) ^ r[(r[u] + r[s]) % 256]);
    }
    return o;
}

// To be called on the id to get data.
function caesarRot13(t: string) {    
    t = encodeURIComponent(t);
    return function (t) {
      var s = 8;
      t = serializeText(shuffle(shuffle(t)))
      var r = "";
      for (var o = 0; o < t.length; o++) {
        var h = t.charCodeAt(o);
        if (o % s == 7) {
          h += 6;
        } else if (o % s == 5) {
          h -= 3;
        } else if (o % s == 3) {
          h += 6;
        } else if (o % s == 2) {
          h -= 5;
        } else if (o % s == 6) {
          h += 3;
        } else if (o % s == 0) {
          h -= 2;
        } else if (o % s == 4) {
          h += 2;
        } else if (o % s == 1) {
          h -= 4;
        }
        r += String.fromCharCode(h);
      }
      return r = serializeText(r = r.split("").reverse().join(""));
    }(serializeText(rc4Cypher("tGn6kIpVXBEUmqjD", t)));
}

function shuffle(t) {
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
    const decoded_url = decodeURIComponent(rc4Cypher("LUyDrL4qIxtIxOGs", encoded_url));
    return (decoded_url);
}
// clearer name
export function getVrf(input: string) { return encodeURIComponent(caesarRot13(input)) };
