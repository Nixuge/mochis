export function substituteString(input: string, key1: string, key2: string) {
    let length = key1.length;
    let substitutionMap = {};

    for (let i = 0; i < length; i++) {
        substitutionMap[key1[i]] = key2[i] || '';
    }

    return input.split('').map(char => substitutionMap[char] || char).join('');
}