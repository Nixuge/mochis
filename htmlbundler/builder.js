import { readFileSync, writeFileSync } from "fs";

let html = readFileSync('./htmlbundler/base.html').toString();

const repo = JSON.parse(readFileSync('./dist/Manifest.json'));
const name = repo.repository.name;

html = html.replaceAll("!!!TITLE!!!", name);

let modulesHtml = "";
for (const module of repo.modules) {
    modulesHtml += `
            <li class="fade-in">
                <div class="module">
                    <div class="image-wrap">
                        <img width="40" height="40" src="${module.icon}">
                    </div>
                    <div class="module-meta">
                        <h2 class="module-title">${module.name}</h2>
                        <span class="module-version">v${module.version}</span>
                    </div>
                    <div class="install-module-wrap">
                        <a class="install-module-button" onclick="addModule('${module.file}')">Add</a>
                    </div>
                </div>
                <hr>
            </li>`
}

html = html.replace("!!!MODULES!!!", modulesHtml)

try {
    writeFileSync("./dist/index.html", html, 'utf8');
    console.log('✔ Successfully wrote new html to disk');
  } catch (error) {
    console.log('⚠ An error has occurred writing new html ', error);
  }