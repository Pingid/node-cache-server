const fs = require('fs');
const path = require('path');
const urlParse = require('url-parse');
const axios = require('axios');
const http = require('http');
const url = require('url');

const safeFileName = query => query.replace(/[\/\.\?]/gmi, '-');

http.createServer(onRequest).listen(3000);

const removeProp = (prop, obj) => Object.keys(obj).filter(x => x !== prop).reduce((a, b) => ({ ...a, [b]: obj[b] }), {})

const makeDirRecursive = path => path
    .split('/')
    .reduce((path, next) => {
        const newPath = path + '/' + next
        if (!fs.existsSync(newPath)) { fs.mkdirSync(newPath) }
        return newPath
    }, '')

function onRequest(req, res) {
    const { headers, method } = req;
    const { url:address, refresh } = url.parse(req.url, true).query;
    const { host, query, pathname } = urlParse(address);

    // Data path and filenames
    const hostFolder = path.resolve(__dirname, './data', safeFileName(host)) + pathname;
    const fileName = safeFileName(query.length < 1 ? 'index' : query);
    const filePath = path.resolve(hostFolder, fileName + '');

     // Check Folder exists
     if (!fs.existsSync(hostFolder)) { makeDirRecursive(hostFolder) }

     // Check if data exists
     if (fs.existsSync(filePath) && !refresh) {
         const data = fs.readFileSync(filePath, 'utf8')
         console.log('Retrieved data')
         if (data) return res.end(data);
     }
 
     // Write data to file
     console.log('Getting data')
     return axios({ headers: removeProp('host', headers), method, url: address }).then(({ data }) => {
        fs.writeFileSync(filePath, typeof data === 'object' ? JSON.stringify(data) : data);
        res.end(data);
     }).catch(console.log)
}