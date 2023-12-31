// Why is this used?
// Basically, the .text() function works on most responses, but it seems like
// on sibnet's response, only on Mochi, it returns an empty string. (fine on runner)
// This may be because it has russian characters?
// For the time being, keeping it like this.
export function arrayBufferToString(buffer: ArrayBuffer) {
    let str = '';
    const array = new Uint8Array(buffer);
    for (let i = 0; i < array.length; i++) {
        str += String.fromCharCode(array[i]);
    }
    return str;
}