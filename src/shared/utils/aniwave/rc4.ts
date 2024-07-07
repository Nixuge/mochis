export function rc4Cypher(key: string, data: string) {
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