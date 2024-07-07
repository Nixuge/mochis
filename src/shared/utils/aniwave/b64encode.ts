export function b64encode(data: string): string {
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