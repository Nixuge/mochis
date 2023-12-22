let testing: boolean;
export function isTesting() {
    if (testing)
        return testing;

    try {
        URL
        testing = true;
    } catch {
        testing = false
    }
    return testing;
}