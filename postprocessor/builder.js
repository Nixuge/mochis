import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdir, rmSync } from "fs";
import path from "path";

const repo = JSON.parse(readFileSync('./dist/Manifest.json'));
const normalRepoName = repo.repository.name;

// Clear all remanant old files
const validInputFiles = ["Manifest.json", "index.html", "modules"]
readdir('./dist/', (err, files) => {
    if (err) {
        console.log(err);
    }

    files.forEach(file => {
        const fileDir = path.join('./dist/', file);

        if (!validInputFiles.includes(file)) {
            rmSync(fileDir, {recursive: true});
        }
    });
});

// Generate the modulePerSubfolder matches
const modulePerSubfolder = {}
for (const module of repo.modules) {
    const split = module.id.split("||")
    let subFolder = "";
    if (split.length == 5) {
        subFolder = split[1] + "/";
        module.id = split[0];
        // Bit of a dirty hack, adding properties from the id's split
        module.repoName = split[2];
        module.repoDesc = split[3];
        module.repoIcon = split[4];
        // module.file = "/" + split[1] + module.file;
    }

    let subList = modulePerSubfolder[subFolder];
    if (subList == undefined) {
        modulePerSubfolder[subFolder] = [];
        subList = modulePerSubfolder[subFolder];
    }
    subList.push(module)
}
// Use the previously generated object
for (const [subFolder, subModules] of Object.entries(modulePerSubfolder)) {
    if (subFolder == "") {
        writeToFile("index.html", genHtml(subModules, normalRepoName))
        continue;
    }
    // Folder
    if (!existsSync("dist/" + subFolder)) 
        mkdirSync("dist/" + subFolder);

    if (!existsSync("dist/" + subFolder + "modules/")) 
        mkdirSync("dist/" + subFolder + "modules/");

    // Create the subrepo object
    const subRepo = JSON.parse(JSON.stringify(repo))
    subRepo.modules = subModules;

    // Get the repo properties using the dirty hack again & set it to the subRepo obj
    const repoName = subModules[0].repoName;
    subRepo.repository.name = repoName;
    subRepo.repository.description = subModules[0].repoDesc;
    subRepo.repository.icon = subModules[0].repoIcon;
    // Delete the properties from the subModules
    subModules.forEach(module => {
        delete(module.repoName)
        delete(module.repoDesc)
        delete(module.repoIcon)
    })

    // Make the HTML file
    writeToFile(subFolder + "index.html", genHtml(subModules, repoName))

    // Remove the entry out of the main Manifest.json
    repo.modules = repo.modules.filter(repo => {
        for (const module of subModules) { if (module.id == repo.id) return false; }
        return true;
    })

    // Write the new manifest
    writeToFile(subFolder + "Manifest.json", JSON.stringify(subRepo, null, 4))

    // Move all module files to subfolder
    for (const module of subModules) {
        const filePath = "./dist" + module.file;
        const newPath = "./dist/" + subFolder + module.file;
        renameSync(filePath, newPath)
    }
}
// Finally, rewrite the Manifest.json removing modules from subfolders.
writeToFile("Manifest.json", JSON.stringify(repo, null, 4))




function genHtml(modules, title) {
    let html = readFileSync('./postprocessor/base.html').toString();
    html = html.replaceAll("!!!TITLE!!!", title);

    let modulesHtml = "";
    for (const module of modules) {
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
    return html;
}

function writeToFile(file, content) {
    try {
        writeFileSync(`./dist/${file}`, content, 'utf8');
        console.log(`✔ Successfully wrote ${file} html to disk`);
    } catch (error) {
        console.log('⚠ An error has occurred writing new html ', error);
    }
}


// writeToFile("index.html", processNormalIndex(modulePerSubfolder[""]))