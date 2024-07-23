export function b64decode(input: string): string {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const base64Lookup: Record<string, number> = {};
    for (let i = 0; i < base64Chars.length; i++) {
        base64Lookup[base64Chars.charAt(i)] = i;
    }

    let output = '';
    let buffer = 0;
    let bufferLength = 0;

    for (let i = 0; i < input.length; i++) {
        const char = input.charAt(i);
        if (char === '=') {
            // Padding signifies end of data, break out of the loop
            break;
        }

        const charCode = base64Lookup[char];
        if (charCode === undefined) {
            throw new Error('Invalid Base64 input');
        }

        buffer = (buffer << 6) | charCode;
        bufferLength += 6;

        if (bufferLength >= 8) {
            bufferLength -= 8;
            output += String.fromCharCode((buffer >> bufferLength) & 0xFF);
        }
    }

    return output;
}

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