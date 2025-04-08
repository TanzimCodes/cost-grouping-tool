async function RdsAppAccParse(file) {
    return new Promise((resolve, reject) => {
        // Check cache first
        let apiResponse;
        const cachedData = getCachedResponse('getIbmDeployments'); // Or use any caching mechanism you prefer

        //Use cached data if it exists
        if (cachedData) {
            apiResponse = cachedData;
            console.log("Using cached data.");
        } else {
            //TOOD: This wont work anymore
            //If no cache, fetch new data
            console.log("Fetching new data.");
            // try {
            //     apiResponse = await fetchDeploymentsFromIbmManager();
            //     console.log('apiResponse', apiResponse)
            //     // Store the fetched data in cache for future use
            //     cacheApiResponse('getIbmDeployments', JSON.stringify(apiResponse));
            // } catch (error) {
            //     console.error(error);
            //     reject(error); // Reject the promise if fetching fails
            //     return; // Exit the function if fetching fails
            // } 
        }

        // Parse the CSV file once data is available
        Papa.parse(file, {
            header: false, // No headers in the CSV
            skipEmptyLines: true, // Skip any empty lines
            complete: function (results) {
                const csvData = results.data;

                if (csvData[0]?.length > 2) {
                    // Throw an error if the row has more than two columns
                    // We must stop the parsing early and reject the promise
                    return reject(new Error("RDS/APP file has more than two columns"));

                }

                // Now, transform and match data with API response
                const mappedData = postProcessRdsAppAccData(csvData, apiResponse);
                //Once we process and map the data
                rdsAppData = transformP2(mappedData);

                // Resolve the promise once parsing is done
                resolve();
            },

            error: function (error) {
                reject(error); // Reject if there's an error during parsing
            }
        });
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
function postProcessRdsAppAccData(csvData, apiResponse) {


    const AppSet = generateAppAccountSet(csvData)

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
                        Account: accountName,
                        Customer: matchingAppEntry.customer_name,
                        Project_Number: matchingAppEntry.project_number,
                        Cost: cost // The cost comes from the CSV
                    };
                } else {
                    // If no match found for App account
                    return {
                        // account_name: accountName,
                        Account: accountName,
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
                        .filter((entry) => entry.rds_account_name === matchingRdsEntry.account_name && AppSet.has(entry.account_name))
                        .map((entry) => {
                            return {
                                Account: entry.account_name,
                                Customer: entry.customer_name,
                                Project_Number: entry.project_number
                            };
                        });
                    return {
                        // account_name: matchingRdsEntry.account_name,
                        Account: accountName,
                        Customer: matchingRdsEntry.customer_name,
                        Project_Number: matchingRdsEntry.project_number,
                        Cost: cost, // The cost from the CSV data for the RDS account
                        app_accounts: groupedApps // List of grouped app accounts
                    };
                } else {
                    // If no matching RDS entry found in the API response
                    return {
                        // account_name: accountName,
                        Account: accountName,
                        Customer: 'ghost',
                        Project_Number: 'ghost',
                        Cost: cost,
                        app_accounts: []

                    };
                }
            }
        } else {
            console.log('could not extract', row)
        }
        return null;  // Return null if no match is found
    }).filter(item => item !== null); // Remove null values
    return transformedData;
}
function generateAppAccountSet(csvData) {
    const AppAccountSet = new Set();
    //Loop for
    csvData.forEach(row => {
        const [csvAccount, costStr] = row;
        const csvAccountMatch = csvAccount.match(/\((.*?)\)/);  // Extract the account part inside parentheses
        if (csvAccountMatch) {
            const accountName = csvAccountMatch[1];  // The extracted account name
            const isAppAccount = accountName.startsWith('App');

            if (isAppAccount) {
                AppAccountSet.add(accountName)
            }
        }
    })

    return AppAccountSet;
}


const devOpsSet = new Set([
    'Ohio Customer 1',
    'Paris Customer 1',
    'DEVEOPSTest01',
    'LVS Dev 1',
    'DevOps Test111'
]
)

const customerSet = new Map([
    ['name', 'John Doe'],
    ['age', 30],
    ['job', 'Developer']
]);

function transformP2(tempData) {
    console.log('transformP2 incoming data ', tempData)

    const transformedData = [];

    tempData.forEach(item => {
        const obj = {
            "Dept": "",
            "PM": "",
            "Project_Number": "",
            "Customer": item.Customer,
            "Always_On": "",
            "Cost": 0,
        };

        const cost = item.Cost;
        if (item.Account.includes('RDS')) {

            //If RDS has APP
            if (item.app_accounts.length) {
                // console.log('hellujwa')
                let costEachApp = cost / item.app_accounts.length;

                item.app_accounts.forEach(AppAccount => {
                    //can't use obj as it may retain properites, leading to bugs
                    const obj2 = {
                        "Dept": "",
                        "PM": "",
                        "Project_Number": "",
                        "Customer": item.Customer,
                        "Always_On": "",
                        "Cost": 0,
                    };


                    if (devOpsSet.has(AppAccount.Customer)) {
                        AppAccount.Project_Number = 'DevOps'
                        AppAccount.Customer = 'Labvantage'
                        obj2.Dept = 'Engineering'
                        obj2.PM = 'DevOps'
                        //Espcial rule
                    } else if (AppAccount.Project_Number === 'lvintsaas2') {
                        AppAccount.Customer = 'Labvantage'
                        obj2.Dept = 'SAAS-US-IN'
                        obj2.PM = 'Cvandra'
                    }

                    obj2.Project_Number = `${AppAccount.Account} - DB Usage (${item.Account})(${AppAccount.Project_Number})`;
                    obj2.Customer = AppAccount.Customer;
                    obj2.Cost = parseFloat(costEachApp.toFixed(3));


                    transformedData.push(obj2);  // Shallow clone here
                });


            } else {
                //RDS with no apps
                obj.Dept = 'Engineering'
                obj.PM = 'DevOps'
                obj.Project_Number = `${item.Account}(DevOps)`;
                obj.Cost = cost;
                obj.Customer = 'Labvantage';
                transformedData.push(obj);  // Shallow clone here

            }



        } else {
            //For App accounts only
            if (devOpsSet.has(item.Customer) || item.Customer === 'ghost') {
                item.Project_Number = 'DevOps'
                item.Customer = 'Labvantage'
                obj.Dept = 'Engineering'
                obj.PM = 'DevOps'
            } else if (item.Project_Number === 'lvintsaas2') {
                item.Customer = 'Labvantage'
                obj.Dept = 'SAAS-US-IN'
                obj.PM = 'Cvandra'
            }


            obj.Project_Number = `${item.Account}(${item.Project_Number})`;
            obj.Cost = cost;
            obj.Customer = item.Customer;

            transformedData.push(obj);  // Shallow clone here

        }

    });

    console.log('transformP2 transformed data ', transformedData)

    return transformedData; // Return the transformed data
}
