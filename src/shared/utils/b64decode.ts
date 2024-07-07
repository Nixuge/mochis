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