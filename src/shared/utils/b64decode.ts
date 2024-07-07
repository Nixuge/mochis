export function b64decode(base64: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
    }

    let padding = 0;
    if (base64.endsWith('=')) {
        padding = base64.endsWith('==') ? 2 : 1;
        base64 = base64.slice(0, -padding);
    }

    const length = base64.length;
    const bytes = new Uint8Array((length * 3 / 4) - padding);
    let byteIndex = 0;

    for (let i = 0; i < length; i += 4) {
        const chunk = (lookup[base64.charCodeAt(i)] << 18) |
                      (lookup[base64.charCodeAt(i + 1)] << 12) |
                      (lookup[base64.charCodeAt(i + 2)] << 6) |
                      lookup[base64.charCodeAt(i + 3)];

        bytes[byteIndex++] = (chunk >> 16) & 0xFF;
        if (byteIndex < bytes.length) {
            bytes[byteIndex++] = (chunk >> 8) & 0xFF;
        }
        if (byteIndex < bytes.length) {
            bytes[byteIndex++] = chunk & 0xFF;
        }
    }

    let decodedString = '';
    for (let i = 0; i < bytes.length; i++) {
        decodedString += String.fromCharCode(bytes[i]);
    }

    return decodedString;
}