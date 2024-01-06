interface String {
    replaceAll(searchValue: string | RegExp, replaceValue: string): string;
    yoink(searchValue: string | RegExp): string;
    yoinkAll(searchValue: string | RegExp): string;
  }
  
  String.prototype.replaceAll = function (searchValue: string | RegExp, replaceValue: string) {
    console.log("Polyfill replaceAll called !");
    // if (searchValue.)
    
    return this.replace(new RegExp(searchValue, "g"), replaceValue)
  }