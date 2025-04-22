// document.getElementById('fileInput').addEventListener('change', handleFileSelect);
// document.getElementById('storeFileInpute').addEventListener('change', storeDataInMemory);


// document.getElementById('loadAwsParsedData').addEventListener('click', loadAwsData);
document.getElementById('loadAwsComparedData').addEventListener('click', loadComparedData);
// document.getElementById('login').addEventListener('click', login);

document.getElementById('saveReport').addEventListener('click', saveReport);


document.getElementById('loadPreviousReport').addEventListener('click', loadPreviousReport);


document.getElementById('generateReportButton').addEventListener('click', generateReport);

async function generateReport() {
    try {
        const date = getSelectedDate()
        if (!date) {
            forgetDateDialogue();
            return
        }
        const awsFile = document.getElementById('awsFileInput').files[0];
        const rdsFile = document.getElementById('rdsFileInput').files[0];
        const noneFile = document.getElementById('noneFileInput').files[0];

        //Todo: uncomment
        if (!awsFile && !rdsFile && !noneFile) {
            missingFileUploadDialogue()
            return;
        }

        // Clear existing data
        resetValues();
        // Parse AWS file, Other Accounts file, and None file synchronously
        if (awsFile)
            await AwsAccParse(awsFile);
        if (rdsFile)
            await RdsAppAccParse(rdsFile);
        if (noneFile)
            await NoneAccParse(noneFile);
        console.log('SHOULD NOT BE HERE')
        // Merge by reference
        mergedData = [...awsData, ...rdsAppData, ...noneData];
        SuccessAlert('Report Generated 🕺', 'Review it, hit save 💾....or lose it forever 😱!');

        loadMergedData();


    } catch (error) {
        errorAlert(`${error}`)
    }


}




function loadPreviousReport() {
    const selectedDate = getSelectedDate()
    if (!selectedDate) {
        forgetDateDialogue()
        return
    }

    loadFileFromServer(`${selectedDate}`);

}


// Event listener for tab change
document.querySelectorAll('.nav-link').forEach(tab => {
    tab.addEventListener('click', function (event) {
        // Get the id of the active tab
        const activeTab = event.target.getAttribute('href').substring(1);
        //aws-data rds-app-data none-data
        // Load the respective data for the tab clicked
        if (activeTab === 'merged-data')
            loadMergedData();
        if (activeTab === 'aws-data')
            loadAwsData();
        if (activeTab === 'rds-app-data')
            loadRdsAppdData();
        if (activeTab === 'none-data')
            loadNonedData();
        if (activeTab === 'saas')
            loadSAASData();
        if (activeTab === 'hosted')
            loadHostedData();
        if (activeTab === 'always-on')
            loadPivotTableDataForAlwaysOn();  // Load pivot table for "Always on"
        if (activeTab === 'dept-pn-pm-cost') {
            loadPivotTableDataForDeptPnPmCost();  // Load pivot table for "Dept PN PM Cost"
        }

    });
});




function storeDataInMemory(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reference headers array (only the first 4)
    const referenceHeaders = [
        "Dept",
        "PM",
        "Project_Number",
        "Customer"
    ];

    // Parse the CSV file once data is available
    Papa.parse(file, {
        complete: function (results) {
            const csvDataArr = results.data;
            // Check if the first 4 columns in csvDataArr[0] match the reference headers
            const firstRow = csvDataArr[0];
            const isHeadersCorrect = referenceHeaders.every((header, index) => header === firstRow[index]);

            if (!isHeadersCorrect) {
                alert("Incorrect headers: The first four columns in the CSV do not match the expected format.");
            }

            // Process the CSV data after confirming the headers
            csvDataArr.slice(1).forEach(arr => { // Skip the first row (headers)
                const dept = arr[0].toLowerCase();
                // Standardize the dept value based on its prefix
                let deptValue;

                if (dept.startsWith('pso') && dept.length > 3) {
                    deptValue = 'PSO';
                } else if (dept.startsWith('hosted') && dept.length > 6) {
                    deptValue = 'Hosted';
                } else if (dept.startsWith('saas') && dept.length > 4) {
                    deptValue = 'SAAS';
                } else if (dept.startsWith('sales') && dept.length > 5) {
                    deptValue = 'Sales';
                }

                // Only proceed if deptValue is defined
                if (deptValue) {

                    //one for mapping customer
                    const key = `${arr[0]} ${arr[1]} ${arr[2]}`;  // Combine Actual Dept, PM, and Project_Number as key
                    storedData.set(key, { Customer: arr[3] });
                    //one for mapping Dep
                    const key2 = `${deptValue} ${arr[1]}`;  // Combine Mapped Dept, PM, and Project_Number as key
                    storedData.set(key2, { Dept: arr[0] });
                }

            });

            // Checking the stored data after processing
            console.log('Storing previous data....', storedData);
        },
        header: false, // No headers in the CSV (we are checking manually)
        skipEmptyLines: true, // Skip any empty lines
    });
}