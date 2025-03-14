

function resetVales() {
    originalData = []; // To store the original data (before processing)
    processedData = []; // To store the transformed data
    comparedData = []; // To store the compared data (original vs processed)
    currentData = []; // This will track the currently displayed data (original, processed, or compared)
}


// Handle file selection and parsing
function handleFileSelect(event) {


    // Get the selected option value (either "aws" or "other")
    const selectedAccType = getSelectedAccountType();

    //TODO : Uncomment after giving to mike
    // if (selectedAccType === 'other' && !getToken()) {
    //     event.target.value = ''; // Clear the file input
    //     alert('Login first')
    //     return
    // }


    const file = event.target.files[0];
    if (!file) return;


    resetVales();

    if (selectedAccType === 'aws') {
        AwsAccParse(file)
    } else {
        OtherAccParse(file)
    }

}

// Function to create the comparison row (old -> new format)
function createComparisonRow(originalRow, processedRow) {
    let comparisonRow = {};
    let hasChanges = false;  // Flag to track if there are any differences

    // Iterate over all keys in the original row
    for (let key in originalRow) {
        let originalValue = originalRow[key];
        let processedValue = processedRow[key];

        // If there's a difference, store it in "old -> new" format
        if (originalValue !== processedValue) {
            comparisonRow[key] = `${originalValue === '' ? null : originalValue} -> ${processedValue}`;
            hasChanges = true;  // Mark that there are changes
        } else {
            // If no change, store the original value as is for comparison
            comparisonRow[key] = originalValue;
        }
    }

    //We would like to ignore dates
    delete comparisonRow["Date"];
    delete comparisonRow[""];


    // Return the comparison row only if there were any changes
    // return hasChanges ? comparisonRow : null;
    return comparisonRow;
}

// Function to load original data into the table
function loadOriginalData() {
    currentData = originalData;  // Track that the original data is loaded
    showSpinner()

    // Delay the heavy tasks by 1 second
    setTimeout(() => {
        populateTable(originalData); // Populate the table with the original data

        // Show the download buttons after data is populated
        showDownloadButtons();

        // Hide the spinner after tasks are done
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load parsed data into the table
function loadParsedData() {

    currentData = processedData;  // Track that the original data is loaded
    showSpinner()

    setTimeout(() => {
        console.log(processedData[0])
        populateTable(processedData);
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load compared data into the table
function loadComparedData() {
    currentData = comparedData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateTable(comparedData);
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay


}



