
function resetValues() {
    comparedData = []; // To store the compared data (original vs processed)
    currentData = { type: '', data: [] }; // This will track the currently displayed data and it's type
    SAASData = []
    HostedData = []
    AlwaysOnData = []

    awsData = []
    rdsAppData = []
    noneData = []
    mergedData = []
}


// Function to load original data into the table
function loadOriginalData() {
    currentData.type = 'Original-data';  // Track that the original data is loaded

    currentData.data = originalData;  // Track that the original data is loaded
    showSpinner()

    // Delay the heavy tasks by 1 second
    setTimeout(() => {
        populateGridTable(originalData, 'dataTable'); // Populate the table with the original data

        // Show the download buttons after data is populated
        showDownloadButtons();

        // Hide the spinner after tasks are done
        hideSpinner();
    }, 1);  // 1 second delay

}

function loadMergedData() {

    currentData.type = `Billing Report - ${getSelectedDate()}`;

    currentData.data = mergedData;


    showSpinner()

    setTimeout(() => {
        populateGridTable(mergedData, 'mergedDataTable')
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load parsed data into the table
function loadAwsData() {

    currentData.type = 'Administrator';

    currentData.data = awsData;


    showSpinner()

    setTimeout(() => {
        populateGridTable(awsData, 'awsDataTable')
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load parsed data into the table
function loadRdsAppdData() {
    currentData.type = 'RDS_APP';

    currentData.data = rdsAppData;
    showSpinner()

    setTimeout(() => {
        populateGridTable(rdsAppData, 'rdsAppDataTable')
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay

}
// Function to load parsed data into the table
function loadNonedData() {

    currentData.type = 'None';

    currentData.data = noneData;
    showSpinner()

    setTimeout(() => {
        populateGridTable(noneData, 'noneDataTable')
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load compared data into the table
function loadComparedData() {
    currentData.type = 'Compared';  // Track that the original data is loaded

    currentData.data = comparedData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateGridTable(comparedData, 'awsDataTable');

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
        populateGridTable(SAASData, 'saasTable')
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
        populateGridTable(HostedData, 'hostedTable');
        showDownloadButtons();
        hideSpinner();
    }, 1);  // 1 second delay


}


function loadPivotTableDataForAlwaysOn() {

    const pivotTableElement = document.getElementById("always-on-table");

    // Extend the pivot renderers to include the export renderers
    var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.export_renderers);

    // Apply the pivotUI with the export functionality
    const table = $(pivotTableElement).pivotUI(awsData, {
        rows: ["Dept", "PM", "Always_On", "Project_Number"],
        // cols: ["Always_On"],           // Columns will be based on Always_On
        aggregatorName: "Sum",           // Aggregator for Cost is Sum
        vals: ["Cost"],                 // Summing the Cost
        menuLimit: 2000,
        inclusions: { "Always_On": ["TRUE"] },
        renderers: renderers,           // Use the extended renderers with export functionality
        // Optional: specify default renderer (you can change this if needed)
        rendererName: "TSV Export"
    });


    // Get the pivot table's TSV data using the pivot utilities' export functionality
    // tsvData(pivotTableElement)
    console.log(table[0])


}


function loadPivotTableDataForDeptPnPmCost() {

    const pivotTableElement = document.getElementById("dept-pn-pm-table");

    $(pivotTableElement).pivotUI(awsData, {
        rows: ["Dept", "PM", "Project_Number"],// Rows will be Dept and Customer
        // cols: ["Always_On"],           // Columns will be based on Always_On
        aggregatorName: "Sum",           // Aggregator for Cost is Sum
        vals: ["Cost"],                 // Summing the Cost
        menuLimit: 2000
    })
}




