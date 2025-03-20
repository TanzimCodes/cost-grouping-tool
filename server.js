const express = require('express');
const queryCostExplorer = require('./api');  // Import the cost data router
const cors = require('cors');  // Import the cors package
const https = require('https');
const fs = require('fs');
const { chromium } = require('playwright');
const path = require('path');






// Load the SSL certificate and private key
const options = {
    key: fs.readFileSync(path.join(__dirname, 'SSL', 'Star_Lims_Com_2024_Distribution.key')),
    cert: fs.readFileSync(path.join(__dirname, 'SSL', 'Star_Lims_Com_2024_Distribution.pem')),
    passphrase: 'd2GDgAZHxTxMkpV3'
};

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

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


// Create an HTTPS server using the options and Express app
https.createServer(options, app).listen(443, () => {
    console.log('Server running at https://localhost:443/');
});
// // Start the server
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

