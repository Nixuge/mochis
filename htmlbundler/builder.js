import { readFileSync, writeFileSync } from "fs";

let start = readFileSync('./htmlbundler/part1.html').toString();
const end = readFileSync('./htmlbundler/part2.html').toString();

const repo = JSON.parse(readFileSync('./dist/Manifest.json'));
const name = repo.repository.name;

start = start.replaceAll("!!!TITLE!!!", name);

let htmlString = start;
for (const module of repo.modules) {
    htmlString += `            <li class="fade-in">
    <div class="module">
        <div class="image-wrap">
            <img width="40" height="40" src="${module.icon}">
        </div>
        <div class="module-meta">
            <h2 class="module-title">${module.name}</h2>
            <span class="module-version">v${module.version}</span>
            <div class="install-module-wrap">
                <a class="install-module-button" onclick="addModule('${module.file}')">Add</a>
            </div>
        </div>
    </div>
    <hr>
</li>`
}

htmlString += end;

try {
    writeFileSync("./dist/index.html", htmlString, 'utf8');
    console.log('✔ Successfully wrote new html to disk');
  } catch (error) {
    console.log('⚠ An error has occurred writing new html ', error);
  }