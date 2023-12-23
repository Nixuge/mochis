// NOTE: AS OF NOW THIS ONLY WORKS IN TESTING !
// IT DOES NOT WORK IN APP !
// DO NOT RELY ON IT !
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}