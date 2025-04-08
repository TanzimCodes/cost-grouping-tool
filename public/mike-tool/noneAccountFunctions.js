function NoneAccParse(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,             // Treat the first row as headers
            skipEmptyLines: true,    // Skip empty lines
            step: function (results, parser) {
                let row = results.data;  // results.data is an array of objects

                // Check if headers are valid
                if (!validateHeaders(results.meta.fields)) {
                    reject(new Error("None File has invalid"));
                    parser.abort();  // Abort parsing if headers are incorrect
                    return;
                }

                // Stop if the row is blank
                if (isEmptyRow(row)) {
                    parser.abort();  // Stop parsing when a blank row is found
                    return;
                }

                // Process the row, including checking for the 'Cost' condition
                const processedRow = processRowForNoneAcc(row);

                // If the row was skipped (due to Cost starting with '<'), don't continue processing
                if (!processedRow) {
                    return;
                }

                // Store the processed row
                noneData.push(processedRow);
            },
            complete: function () {
                console.log("None File parsing completed.");
                // Resolve the promise once parsing is done
                resolve();
            },
            error: function (error) {
                reject(error); // Reject if there's an error during parsing
            }
        });
    });
}

// Function to validate headers
function validateHeaders(headers) {
    const expectedHeaders = ['Dept', 'PM', 'Project_Number', 'Customer', 'Always_On', 'Cost'];
    return JSON.stringify(headers) === JSON.stringify(expectedHeaders);
}

// Function to check if a row is empty (optional, depending on your logic)
function isEmptyRow(row) {
    return Object.values(row).every(value => value === null || value === '');
}

// Function to process the row for NoneAcc
function processRowForNoneAcc(row) {
    // Check if the Cost starts with '<'
    if (row.Cost && row.Cost.startsWith('<')) {
        return null;  // Skip this row if Cost starts with '<'
    }

    // Parse cost from the second column in CSV (costStr)
    row.Cost = parseFloat(row.Cost.replace('$', '').replace(',', ''));
    // If Cost is valid, continue processing the row
    // You can add any other processing here if necessary
    return row;
}
