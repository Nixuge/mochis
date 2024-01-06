interface String {
    replaceAll(input: string, replacement: string): string;
}

String.prototype.replaceAll = function (searchValue: string | RegExp, replaceValue: string) {
    console.log("Polyfill replaceAll called !");
    
    return this.replace(new RegExp(searchValue, "g"), replaceValue)
}