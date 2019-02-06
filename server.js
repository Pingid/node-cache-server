const fs = require('fs');
const path = require('path');
const express = require('express');
const urlParse = require('url-parse');
const axios = require('axios');

const app = express()
const port = 1234

// Utility Functions
const safe = f => new Promise((resolve, reject) => { 
    let res; try { res = f() } catch(err) { return reject(err) } return resolve(res) });

const safeFileName = query => query.replace(/[\/\.\?]/gmi, '-');

// Chache Function
const cacheRequest = async adress => {
    const { host, query } = urlParse(adress);

    // Data path and filenames
    const hostFolder = path.resolve(__dirname, './data', safeFileName(host));
    const fileName = safeFileName(query);
    const filePath = path.resolve(hostFolder, fileName + '.json');

    // Check Folder exists
    if (!fs.existsSync(hostFolder)) { fs.mkdirSync(hostFolder) }

    // Check if data exists
    if (fs.existsSync(filePath)) {
        const data = await safe(() => JSON.parse(fs.readFileSync(filePath, 'utf8'))).catch(err => null);
        if (data) return data;
    }

    // Write data to file
    const data = await axios.get(adress).then(x => x.data);
    fs.writeFileSync(filePath, JSON.stringify(data))
    console.log('Added data')
    
    // Return new data;
    return data;
}

// request function
app.get('/', async (req, res) => {
    const { adress } = req.query;
    console.log(adress)
    const data = await cacheRequest(adress);
    res.json(data)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))