function AwsAccParse(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: function (results, parser) {
                let row = results.data;  // results.data is an array of objects, so handle appropriately

                // Stop if the row is blank
                if (isEmptyRow(row)) {
                    parser.abort();  // Stop parsing when a blank row is found
                    return;
                }

                if (row.Dept === 'none' && row.PM === 'none' && row.Project_Number === 'none') {
                    console.log('found ' + JSON.stringify(row))
                    return;

                }

                // Clone the row to avoid mutating the original row when processing
                let clonedRow = { ...row };  // Creates a shallow copy of the row object

                // Process the row here (apply transformations)
                const processedRow = processRowForAwsAcc(clonedRow);  // Now using the cloned row

                // Store the processed row
                awsData.push(processedRow);

                // Create the compared data while processing
                const comparisonRow = createComparisonRow(row, processedRow);

                comparedData.push(comparisonRow);

            },
            complete: function () {
                console.log("File parsing completed.");
                // Maintaing order is important
                postProcessDeptData();

                // Process rest
                postProcessCustomerData();
                postProcessSAASData();
                postProcessHostedData();

                // Resolve the promise once parsing is done
                resolve();
            },
            error: function (error) {
                reject(error); // Reject if there's an error during parsing
            }
        });
    });
}


// Function to process a row
function processRowForAwsAcc(row) {

    // Step 1: Check for literal 'blank' values for Dept, PM, and Customer
    if (row["Dept"] === "blank" && row["PM"] === "blank" && row["Customer"] === "blank") {
        // If all three are 'blank', replace them with the new values
        row["Dept"] = "Allocation";
        row["PM"] = "Allocation";
        row["Customer"] = "LabVantage";
    }

    // Step 2: Check if Dept is 'CloudOps' and transform accordingly
    if (row["Dept"] === "CloudOps") {
        row["Dept"] = "Engineering";
        row["PM"] = "Devops";
        row["Customer"] = "LabVantage";
    }

    // Step 3: Check if Dept is 'DevOps' and transform accordingly
    if (row["Dept"] === "DevOps") {
        row["Dept"] = "Engineering";
        row["PM"] = "Devops";
        row["Customer"] = "LabVantage";
        // If Project_Number is not provided, change it to 'DevOps'
        if (!row["Project_Number"] || row["Project_Number"].trim() === "") {
            row["Project_Number"] = "DevOps";
        }
    }

    // Step 4: Check if Dept is 'Unknown' and transform accordingly
    if (row["Dept"] === "Unknown") {
        row["Dept"] = "Allocation";
        row["PM"] = "Allocation";
        row["Customer"] = "LabVantage";
    }

    // Step 5: Check if Dept is 'Testing - 75' and transform accordingly
    if (row["Dept"] === "Testing - 75") {
        row["Dept"] = "Testing";
    }

    // Step 6: Check if Dept is any of the following and transform accordingly
    const techServicesDept = [
        "Tech Services",
        "TechSvcs",
        "Technical Services",
        "Techservices"
    ];

    if (techServicesDept.includes(row["Dept"])) {
        row["Dept"] = "Allocation";
        row["PM"] = "Allocation";
        row["Customer"] = "LabVantage";
    }

    // Step 7: Check if Dept is 'Administration' and transform accordingly
    if (row["Dept"] === "Administration") {
        row["Dept"] = "Engineering";
        row["PM"] = "Devops";
        row["Customer"] = "LabVantage";
    }

    // Step 8: Check if Dept is 'TCGD' and transform accordingly
    if (row["Dept"] === "TCGD") {
        row["Dept"] = "tcgd";
    }


    // Step 8: Remove empty columns and "Date" columns
    for (const key in row) {
        if (key === "" || key === "Date") {
            delete row[key];  // Delete column with empty header or "Date"
        }
    }

    // Step 9: Format the "Cost" column
    if (row["Cost"]) {
        row["Cost"] = parseFloat(row["Cost"]);
    }

    return row;
}

function postProcessCustomerData() {
    // Create a map to track objects by Dept, PM, and Project_Number, also store the index for later updates
    let customerMap = new Map();

    // Step 1: Process data to find and track "none" customer objects
    awsData.forEach((item, index) => {
        // Check if the required keys exist in the item
        if (item.Dept && item.PM && item.Project_Number) {
            // Define a key using Dept, PM, and Project_Number as a unique identifier
            let key = `${item.Dept} ${item.PM} ${item.Project_Number}`;

            if (!customerMap.has(key)) {
                customerMap.set(key, { none: [], full: null });
            }

            if (item.Customer === "none") {
                // If the customer is "none", track it for later processing
                customerMap.get(key).none.push({ item: { ...item }, index }); // Track the item and its index
            } else {
                // If a full customer is found, store it as the "full" value for this key
                customerMap.get(key).full = { item: { ...item }, index }; // Track the item and its index
            }
        }
    });

    // Step 2: Fill "none" customer values based on matching full customer and update comparedData
    customerMap.forEach((value, key) => {
        // Step 1: Loop through all "none" values
        value.none.forEach(({ item, index }) => {
            let updatedItem = { ...item };  // Create a shallow copy of the item to preserve other fields

            // Step 2: Check if a full customer exists
            if (value.full) {
                // If a full customer exists, use its customer value
                updatedItem.Customer = value.full.item.Customer;  // Replace "none" with the correct customer
            } else if (storedData.has(key)) {
                updatedItem.Customer = storedData.get(key).Customer;  // Replace "none" with the correct customer
            } else {
                // If no full customer is found, set Customer to 'LabVantage'
                updatedItem.Customer = 'LabVantage';  // Replace "none" with 'LabVantage'
            }

            // Step 3: Assign the updated item back to the awsData array at the same index
            awsData[index] = updatedItem;

            // Step 4: Store the updated Customer transition in comparedData
            comparedData[index].Customer = `none -> ${updatedItem.Customer}`  // Store the transition
        });
    });

}

function postProcessDeptData() {
    const map = CreateDepMapFromCurrentData();
    //Update stored map data using current file
    // updateStoredMap();
    // Define the departments we are interested in
    const targetDepts = ['PSO', 'Hosted', 'SAAS', 'Sales'];

    // Step 2: Iterate over the filtered data
    awsData.forEach((item, index) => {
        // Check if PM exists
        if (targetDepts.includes(item.Dept) && item.PM) {
            let key = `${item.Dept} ${item.PM}`;  // The key format: "{Dept} {PM}"

            // Step 3: Check if the key exists in storedData map
            if (storedData.has(key)) {
                let storedItem = storedData.get(key);

                // Step 4: Mutating array reference which exists in awsData
                const prevDept = item.Dept;
                item.Dept = storedItem.Dept;

                // Step 6: Update compared data (check if comparedData[index] exists)
                if (comparedData && comparedData[index]) {
                    comparedData[index].Dept = `${prevDept} -> ${item.Dept}`;
                }
            } else if (map.has(key)) {
                let storedItem = map.get(key);

                // Step 4: Mutating array reference which exists in awsData
                const prevDept = item.Dept;
                item.Dept = storedItem.Dept;

                // Step 6: Update compared data (check if comparedData[index] exists)
                if (comparedData && comparedData[index]) {
                    comparedData[index].Dept = `${prevDept} -> ${item.Dept}`;
                }
            }
        }
    });
}


function CreateDepMapFromCurrentData() {
    const map = new Map();
    // Define the departments we are interested in
    const targetDepts = ['PSO', 'Hosted', 'SAAS', 'Sales'];

    // First pass, update the storedData value
    awsData.forEach(item => {
        const temp = targetDepts.filter(dep => item.Dept.startsWith(dep));
        const depFound = temp[0];

        // Only include if:
        // 1. A match was found.
        // 2. The department name length is greater than or equal to the matched department's length.
        if (!depFound || item.Dept.length <= depFound.length) {
            return
        }

        map.set(`${depFound} ${item.PM}`, { Dept: item.Dept })
    });
    console.log(map)
    return map;
}


function postProcessSAASData() {
    SAASData = awsData.filter((item) => {
        if (item.Dept && (item.Dept === "SAAS-US-IN" || item.Dept === "SAAS-EMEA" || item.Dept === "SAAS-International")) {
            return true; // Return items that match the condition
        } else if (item.Dept.startsWith('SAAS')) {
            // console.log("Non-SAAS item:", item); // Log items that don't match
            return false; // Filter out items that don't match
        }
    });
    console.log('SAAS data = > ', SAASData)
}

function postProcessHostedData() {
    HostedData = awsData.filter((item) => {
        if (item.Dept && (item.Dept === "Hosted-US-IN" || item.Dept === "Hosted-EMEA" || item.Dept === "Hosted-International")) {
            return true; // Return items that match the condition
        } else if (item.Dept.startsWith('Hosted')) {
            // console.log("Non-Hosted item:", item); // Log items that don't match
            return false; // Filter out items that don't match
        }
    });
}

// Function to check if a row is blank (empty or containing only blank fields or spaces)
function isEmptyRow(row) {
    for (const key in row) {
        if (row[key] && row[key].trim() !== "") {
            return false;  // If any field has a non-empty value, the row is not blank
        }
    }
    return true;  // If all fields are empty or just spaces, the row is blank
}

// Function to create the comparison row (old -> new format)
function createComparisonRow(originalRow, processedRow) {
    let comparisonRow = {};

    // Iterate over all keys in the original row
    for (let key in originalRow) {
        let originalValue = originalRow[key];
        let processedValue = processedRow[key];

        // If there's a difference, store it in "old -> new" format
        if (originalValue !== processedValue && key != 'Cost') {
            comparisonRow[key] = `${originalValue === '' ? null : originalValue} -> ${processedValue}`;
        } else {
            // If no change, store the original value as is for comparison
            comparisonRow[key] = originalValue;

            if (key === 'Cost')
                comparisonRow[key] = Number(comparisonRow[key])
        }
    }

    //We would like to ignore dates
    delete comparisonRow["Date"];
    delete comparisonRow[""];


    return comparisonRow;
}
