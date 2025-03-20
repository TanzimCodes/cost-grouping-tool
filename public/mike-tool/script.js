
function resetVales() {
    originalData = []; // To store the original data (before processing)
    processedData = []; // To store the transformed data
    comparedData = []; // To store the compared data (original vs processed)
    currentData = { type: '', data: [] }; // This will track the currently displayed data (original, processed, or compared)
}


// Handle file selection and parsing
function handleFileSelect(event) {


    // Get the selected option value (either "aws" or "other")
    const selectedAccType = getSelectedAccountType();

    if (selectedAccType === 'other' && !getToken()) {
        event.target.value = '';
        alert('Login first')
        return
    }


    const file = event.target.files[0];
    if (!file) return;


    resetVales();

    if (selectedAccType === 'aws') {
        AwsAccParse(file)
    } else {
        OtherAccParse(file)
    }

}


// Function to load original data into the table
function loadOriginalData() {
    currentData.type = 'Original-data';  // Track that the original data is loaded

    currentData.data = originalData;  // Track that the original data is loaded
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

    currentData.type = 'Parsed Data';  // Track that the original data is loaded

    currentData.data = processedData;  // Track that the original data is loaded
    showSpinner()

    setTimeout(() => {
        populateTable(processedData);
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load compared data into the table
function loadComparedData() {
    currentData.type = 'Compared Data';  // Track that the original data is loaded

    currentData.data = comparedData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateTable(comparedData);
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay


}


// Function to load compared data into the table
function loadSAASData() {
    currentData.type = 'SAAS';  // Track that the original data is loaded

    currentData.data = SAASData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateTable(SAASData);
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay


}

// Function to load compared data into the table
function loadHostedData() {
    currentData.type = 'Hosted';  // Track that the original data is loaded

    currentData.data = HostedData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateTable(HostedData);
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay


}

// Function to load compared data into the table
function loadPivotTable() {

    const pivotTableElement = document.getElementById("pivot-table");

    // Initialize PivotTable.js for "Always on" tab when it's activated
    $(function () {
        $(pivotTableElement).pivotUI(processedData, {
            rows: ["Dept","Always_On"],    // Rows will be Dept and Customer
            // cols: ["Always_On"],           // Columns will be based on Always_On
            aggregatorName: "Sum",         // Aggregator for Cost is Sum
            vals: ["Cost"],                 // Summing the Cost
        });
    });


}


