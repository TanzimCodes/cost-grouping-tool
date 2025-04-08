const express = require('express');
const queryCostExplorer = require('./api');  // Import the cost data router
const cors = require('cors');  // Import the cors package
const https = require('https');
const fs = require('fs');
const { chromium } = require('playwright');
const path = require('path');
const uploadDirectory = 'storage'
const port = 443;
const { mkdir, readdir, unlink, writeFile } = fs.promises;

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

// Route to check the file status (uploaded or not uploaded)
app.get('/files/:date/status', async (req, res) => {
    const folderWithDate = req.params.date;
    const filePath = path.join(__dirname, uploadDirectory, `${folderWithDate}`);

    const isUploaded = fs.existsSync(filePath);

    return res.status(200).json({ uploaded: isUploaded });
});

// Route to handle JSON upload (overwrite based on 'overwrite' param)
app.post('/files', async (req, res) => {
    console.log("hello, trying to save")
    const date = req.body.date; // Date in the format YYYY-MM (e.g., "2025-01")
    const jsonData = req.body.data; // The JSON data to be saved

    if (!date || !jsonData) {
        return res.status(400).json({ message: 'Date and Data are required.' });
    }

    const folderPath = path.join(__dirname, uploadDirectory, date);

    try {
        // Create a folder for the given date if it doesn't already exist
        await mkdir(folderPath, { recursive: true });

        // Check if folder exists and delete all files inside it
        const files = await readdir(folderPath);
        if (files.length > 0) {
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                await unlink(filePath); // Delete each file inside the folder
                console.log(`Deleted file: ${filePath}`);
            }
        }

        // Save different types of data to individual files inside the folder
        for (const key in jsonData) {
            const dataToSave = jsonData[key];

            // Only save if the array is not empty
            if (Array.isArray(dataToSave) && dataToSave.length > 0) {
                const filePath = path.join(folderPath, `${key}.json`);

                // Save the data to the file
                await writeFile(filePath, JSON.stringify(dataToSave, null, 2));
                console.log(`Saved ${key} data to ${filePath}`);
            } else {
                console.log(`No data for ${key}, skipping save.`);
            }
        }

        res.status(200).json({ message: `Data saved for ${date}.`, folderPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error saving data.' });
    }
});


// Route to load previous data (now handling multiple files in a folder)
app.get('/files/:date', (req, res) => {
    const date = req.params.date; // e.g "aws-2025-01"
    const folderPath = path.join(uploadDirectory, date); // Path to the folder for the given date

    console.log(folderPath);

    // Check if the folder exists
    if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ message: `Report not found for ${date}. Are you sure it's uploaded? 🤔` });
    }

    // Read the files in the folder
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading files in the folder.' });
        }

        // Filter JSON files in the folder
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        if (jsonFiles.length === 0) {
            return res.status(404).json({ message: `Report not found for ${date}. Are you sure it's uploaded? 🤔` });
        }

        // Read all JSON files and send their content
        const data = {};
        let filesRead = 0;

        jsonFiles.forEach((file) => {
            const filePath = path.join(folderPath, file);

            fs.readFile(filePath, 'utf8', (err, fileData) => {
                if (err) {
                    return res.status(500).json({ message: `Error reading file: ${file}` });
                }

                try {
                    // Remove the `.json` extension from the filename using path.basename()
                    const key = path.basename(file, '.json');

                    data[key] = JSON.parse(fileData); // Parse and add the data to the response object
                } catch (parseError) {
                    return res.status(500).json({ message: `Error parsing JSON from file: ${file}` });
                }

                filesRead++;

                // Once all files are read, send the response
                if (filesRead === jsonFiles.length) {
                    res.status(200).json(data); // Send the combined data of all JSON files
                }
            });
        });
    });
});

// Create an HTTPS server using the options and Express app
https.createServer(options, app).listen(port, () => {
    console.log(`Server running at https://localhost:${port}/`);
});

