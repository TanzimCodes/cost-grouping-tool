
function AwsAccParse(file) {
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

            // Clone the row to avoid mutating the original row when processing
            let clonedRow = { ...row };  // Creates a shallow copy of the row object

            // Store original data
            originalData.push(row);

            // Process the row here (apply transformations)
            const processedRow = processRowForAwsAcc(clonedRow);  // Now using the cloned row

            // console.log("Processed row:", processedRow);  // Log the row to see its content

            // Store the processed row
            processedData.push(processedRow);

            // Create the compared data while processing
            const comparisonRow = createComparisonRow(row, processedRow);

            // console.log("Comparison Row:", comparisonRow);  // Log comparisonRow

            if (comparisonRow !== null) {
                comparedData.push(comparisonRow);
            }
        },
        complete: function () {
            console.log("File parsing completed.");
            //Do customer logic here
            postProcessCustomerData();
        }
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
    // if (row["Cost"]) {
    //     const costValue = parseFloat(row["Cost"]);
    //     if (!isNaN(costValue)) {
    //         row["Cost"] = "$" + costValue.toFixed(2);  // Format cost with $ and 2 decimal places
    //     }
    // }

    return row;
}

function postProcessCustomerData() {
    // Create a map to track objects by Dept, PM, and Project_Number, also store the index for later updates
    let customerMap = new Map();

    // Step 1: Process data to find and track "none" customer objects
    processedData.forEach((item, index) => {
        // Check if the required keys exist in the item
        if (item.Dept && item.PM && item.Project_Number) {
            // Define a key using Dept, PM, and Project_Number as a unique identifier
            let key = `${item.Dept}|${item.PM}|${item.Project_Number}`;

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
            } else {
                // If no full customer is found, set Customer to 'LabVantage'
                updatedItem.Customer = 'LabVantage';  // Replace "none" with 'LabVantage'
            }

            // Step 3: Assign the updated item back to the processedData array at the same index
            processedData[index] = updatedItem;

            // Step 4: Store the updated Customer transition in comparedData
            comparedData[index].Customer = `none -> ${updatedItem.Customer}`  // Store the transition
        });
    });



    // Log the processed data for verification
    // console.log("Post-processed data:", processedData);
}

function postProcessDeptData() {
    processedData.forEach((item) => {
        //This should work for any Sales / Pso / Hosted
        const key = `${item.Dept} ${item.PM} ${item.Project_Number}`;

        if (storedData.has(key)) {
            item.Dept = storedData.get(key)[0]
        }
    })
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