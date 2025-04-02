const express = require('express');
const queryCostExplorer = require('./api');  // Import the cost data router
const cors = require('cors');  // Import the cors package
const https = require('https');
const fs = require('fs');
const { chromium } = require('playwright');
const path = require('path');
const uploadDirectory = 'storage'
const port = 443;
// Load the SSL certificate and private key
const options = {
    key: fs.readFileSync(path.join(__dirname, 'SSL', 'Star_Lims_Com_2024_Distribution.key')),
    cert: fs.readFileSync(path.join(__dirname, 'SSL', 'Star_Lims_Com_2024_Distribution.pem')),
    passphrase: 'd2GDgAZHxTxMkpV3'
};

const app = express();


// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')))

app.use(cors());

// Route to serve an HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Use the costDataRouter for handling /api/cost-data requests
app.post('/get-data', queryCostExplorer);


app.get('/get-token', async (req, res) => {
    let browser;
    let page;

    try {
        browser = await chromium.launch({ headless: false });
        page = await browser.newPage();
        await page.goto('https://ibmgr.labvantage.com/', { waitUntil: 'load' });

        console.log("Waiting for the user to log in...");

        let allStorageData = null;
        let tokenFound = false;
        let token;


        while (true) {
            try {
                // Get all localStorage data in one call
                allStorageData = await page.evaluate(() => {
                    return Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]));
                });

                // Look for keys starting with 'CognitoIdentityServiceProvider' and ending with '@lims.com.accessToken'
                const tokenKey = Object.keys(allStorageData).find(key =>
                    key.startsWith('CognitoIdentityServiceProvider') && key.endsWith('@lims.com.accessToken')
                );

                if (tokenKey) {
                    token = allStorageData[tokenKey];
                    console.log("✅ Found Token:", token);

                    // Save the token to a file
                    // fs.writeFileSync('accessToken.txt', token, 'utf8');
                    // console.log("📄 Token saved to accessToken.txt");

                    tokenFound = true;
                }

                // If the token is found, stop further monitoring for changes
                if (tokenFound) {
                    break;
                }

                // Wait for 1 second before checking again
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                // If the browser is closed or page navigation happens, catch the error
                if (error.message.includes('Page closed')) {
                    console.log('The browser was closed unexpectedly.');
                    res.status(400).json({ message: 'Browser closed unexpectedly.', status: 'error' });
                    break;
                }
                console.log("Error accessing localStorage, retrying...", error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Close the browser after finishing the task
        if (browser) {
            await browser.close();
        }
        console.log("✅ Browser closed.");

        // Send success response
        if (tokenFound) {
            res.json({
                'accessToken': token,
                message: 'Token extraction complete.',
                status: 'success',
                tokenFile: 'accessToken.txt',
                localStorageFile: 'localStorageData.json',
            });
        }

    } catch (error) {
        console.error("Error in /get-token endpoint:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        // Ensure the browser is closed if an error occurs or if the page was closed
        if (browser) {
            await browser.close();
        }
    }
});

// Route to handle JSON upload (overwrite based on 'overwrite' param)
app.post('/upload', (req, res) => {
    const date = req.body.date; // Date in the format YYYY-MM (e.g., "2025-01")
    const jsonData = req.body.data; // The JSON data to be saved
    const type = req.body.type; // The JSON data to be saved
    console.log(type)

    if (!date || !jsonData || !type) {
        return res.status(400).json({ message: 'Date, data and type are required.' });
    }

    const filePath = path.join(__dirname, uploadDirectory, `${type}-${date}.json`);


    // Save the data to the file (it will overwrite if the file already exists or if overwrite is true)
    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving data.' });
        }

        res.status(200).json({ message: `Data saved for ${date}.`, filePath });
    });
});

// Route to load previous data
app.get('/load/:typeDate', (req, res) => {
    const date = req.params.typeDate; // e.g "aws-2025-01")
    const filePath = path.join(uploadDirectory, `${date}.json`);
    console.log(filePath)
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Data not found for this month/year.' });
    }

    // Read and send the file content
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading data.' });
        }

        res.status(200).json(JSON.parse(data)); // Send the parsed JSON data
    });
});


// Create an HTTPS server using the options and Express app
https.createServer(options, app).listen(port, () => {
    console.log(`Server running at https://localhost:${port}/`);
});

