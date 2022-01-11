const path = require('path');
const fs = require('fs');
const IPFS = require('ipfs');
const hri = require('human-readable-ids').hri;

const DIRECTORY = path.resolve(__dirname, './output');

let ipfsNode;

async function getIpfsUri(filePath) {
    if (!ipfsNode) {
        console.log('Opening IPFS connection... this is entirely for generating CIDs and is not hooked up to any actual accounts.');
        ipfsNode = await IPFS.create();
    }
    const dataBuffer = fs.readFileSync(filePath);
    const promise = ipfsNode.add(dataBuffer);
    const result = await promise;
    return `https://gateway.pinata.cloud/ipfs/${result.path}`;
}

async function rewriteJsonFile(filepath, jsonData) {
    fs.writeFile(filepath, JSON.stringify(jsonData), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

(async () => {
    const fileNames = fs.readdirSync(DIRECTORY);
    const tokens = fileNames.filter((name) => name.includes('.png')).map(name => name.replace('.png', ''));
    for (let x = 0; x < tokens.length; x++) {
        const token = tokens[x];
        const metaFilePath = `${DIRECTORY}/${token}.json`;

        console.log(`(${x} of ${tokens.length}) Updating ${metaFilePath}...`);
        
        console.log('-- generating image path based on CID...');
        const metaFileData = require(metaFilePath);
        metaFileData.image = await getIpfsUri(`${DIRECTORY}/${token}.png`);

        // console.log('-- generating random HRI tokenId...');
        // const randomToken = hri.random();
        // metaFileData.tokenId = randomToken;

        console.log('-- writing to JSON disk...');
        rewriteJsonFile(metaFilePath, metaFileData);
    }
    console.log(`Success! Closing IPFS connection...`)
    ipfsNode.stop();
})();
