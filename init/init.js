let fs = require('fs');
let path = require('path');

let fileName = 'markuppretty.js';

let sourceFile = path.join(__dirname, fileName);
let destPath = path.join(__dirname, '../', 'node_modules/prettydiff2/lib', fileName);
let readStream = fs.createReadStream(sourceFile);
let writeStream = fs.createWriteStream(destPath);
readStream.pipe(writeStream);
