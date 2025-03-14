async function OtherAccParse(file) {
    // Check cache first
    let apiResponse;
    const cachedData = sessionStorage.getItem("deploymentsCache"); // Or use any caching mechanism you prefer
    // console.log('cachedData', cachedData)
    if (cachedData) {
        // Use cached data if it exists
        //TOOD: revome after giving to mike
        // apiResponse = JSON.parse(cachedData);
        apiResponse = JSON.parse(cachedData);
        console.log("Using cached data.");
    } else {
        // If no cache, fetch new data
        console.log("Fetching new data.");
        showSpinner();
        try {
            apiResponse = await fetchDeploymentsFromIbmManager();
            console.log('apiResponse', apiResponse)
            // Store the fetched data in cache for future use
            sessionStorage.setItem("deploymentsCache", JSON.stringify(apiResponse));
        } catch (error) {
            console.error(error)
            return; // Exit the function if fetching fails
        } finally {
            hideSpinner();
        }
    }

    // Parse the CSV file once data is available
    Papa.parse(file, {
        complete: function (results) {
            // Assume CSV rows are in the format: Account (AccountName), Amount
            const csvData = results.data;

            originalData = csvData;

            // Now, transform and match data with API response
            const mappedData = postProcessOtherAccData(csvData, apiResponse);
            processedData = mappedData;

        },
        header: false, // No headers in the CSV
        skipEmptyLines: true, // Skip any empty lines
    });
}


async function fetchDeploymentsFromIbmManager() {
    console.log('heelo')
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${getToken()}`);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch("https://gf32nx6w6b.execute-api.us-east-1.amazonaws.com/master/deployments", requestOptions);
        console.log("fetch done")
        return await response.json(); // Return the response as JSON
    } catch (error) {
        console.log("ERROR fetch")

        console.error("Error fetching deployments:", error);
        throw error; // Re-throw the error to be handled in the caller
    }
}

// Function to transform and match the data (App and RDS accounts)
function postProcessOtherAccData(csvData, apiResponse) {
    const transformedData = csvData.map((row) => {
        // Split the row into account and cost parts
        const [csvAccount, costStr] = row;

        const csvAccountMatch = csvAccount.match(/\((.*?)\)/);  // Extract the account part inside parentheses
        if (csvAccountMatch) {
            const accountName = csvAccountMatch[1];  // The extracted account name
            const isAppAccount = accountName.startsWith('App');
            const isRDSAccount = accountName.startsWith('RDS');

            // Parse cost from the second column in CSV (costStr)
            const cost = parseFloat(costStr.replace('$', '').replace(',', ''));

            if (isAppAccount) {
                const matchingAppEntry = apiResponse.find((entry) => entry.account_name.startsWith(accountName));
                // const matchingAppEntry = apiResponse.find((entry) => entry.account_name == accountName);

                if (matchingAppEntry) {
                    return {
                        // account_name: matchingAppEntry.account_name,
                        Account: csvAccount,
                        Customer: matchingAppEntry.customer_name,
                        Project_Number: matchingAppEntry.project_number,
                        Cost: cost // The cost comes from the CSV
                    };
                } else {
                    // If no match found for App account
                    return {
                        // account_name: accountName,
                        Account: csvAccount,
                        Customer: 'ghost',
                        Project_Number: 'ghost',
                        Cost: cost
                    };
                }
            }

            if (isRDSAccount) {
                // For RDS accounts, first find the matching RDS account entry itself
                const matchingRdsEntry = apiResponse.find((entry) => entry.account_name.startsWith(accountName));
                // const matchingRdsEntry = apiResponse.find((entry) => entry.account_name== accountName);


                if (matchingRdsEntry) {
                    // For RDS accounts, find all App accounts that are linked to it via `rds_account_name`
                    const groupedApps = apiResponse
                        .filter((entry) => entry.rds_account_name === matchingRdsEntry.account_name)
                        .map((app) => {
                            return {
                                Account: app.account_name,
                                Customer: app.customer_name,
                                Project_Number: app.project_number
                            };
                        });
                    return {
                        // account_name: matchingRdsEntry.account_name,
                        Account: csvAccount,
                        Customer: matchingRdsEntry.customer_name,
                        Project_Number: matchingRdsEntry.project_number,
                        Cost: cost, // The cost from the CSV data for the RDS account
                        app_accounts: groupedApps // List of grouped app accounts
                    };
                } else {
                    // If no matching RDS entry found in the API response
                    return {
                        // account_name: accountName,
                        Account: csvAccount,
                        Customer: 'ghost',
                        Project_Number: 'ghost',
                        Cost: cost,
                        app_accounts: []

                    };
                }
            }
        }
        return null;  // Return null if no match is found
    }).filter(item => item !== null); // Remove null values
    return transformedData;
}