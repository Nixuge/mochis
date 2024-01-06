// Blah blah bad practice
// I highly doubt a new js function for strings with the name "yoink" becomes standard
// replaceAll needed tho to not rely on es2021 and break compat for ios 15 users


// String.prototype.yoink = function (searchValue: string | RegExp) {
//     return this.replace(searchValue, "");
// }
// String.prototype.yoinkAll = function (searchValue: string | RegExp) {
//     return this.replaceAll(searchValue, "");
// }