let testing: boolean;
export function isTesting() {    
    if (testing)
        return testing;

    try {
        new URL("https://nixuge.me");
        testing = true;
    } catch {
        testing = false;
    }    
    return testing;
}