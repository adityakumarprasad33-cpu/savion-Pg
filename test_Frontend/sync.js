const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (element === 'node_modules' || element === '.next') return;
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        if (fs.lstatSync(fromPath).isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else {
            copyFolderSync(fromPath, toPath);
        }
    });
}

// Target repositories
const targets = [
    path.join(__dirname, '../deployment_ready'),
    path.join(__dirname, '../frontend')
];

// Folders/files to sync
const toSync = ['src', 'public', 'package.json', 'next.config.ts', 'tsconfig.json', 'netlify.toml', 'components.json'];

targets.forEach(targetRepo => {
    if (!fs.existsSync(targetRepo)) fs.mkdirSync(targetRepo, { recursive: true });
    toSync.forEach(item => {
        const sourcePath = path.join(__dirname, item);
        const targetPath = path.join(targetRepo, item);
        
        if (fs.existsSync(sourcePath)) {
            if (fs.lstatSync(sourcePath).isDirectory()) {
                copyFolderSync(sourcePath, targetPath);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    });
    console.log(`Successfully synced to ${targetRepo}`);
});
