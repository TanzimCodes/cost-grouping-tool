document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('storeFileInpute').addEventListener('change', storeDataInMemory);

document.getElementById('loadOriginalData').addEventListener('click', loadOriginalData);
document.getElementById('loadParsedData').addEventListener('click', loadParsedData);
document.getElementById('loadComparedData').addEventListener('click', loadComparedData);
document.getElementById('login').addEventListener('click', login);

document.getElementById('downloadCSV').addEventListener('click', downloadCSV);

// Event listener for tab change
document.querySelectorAll('.nav-link').forEach(tab => {
    tab.addEventListener('click', function (event) {
        // Get the id of the active tab
        const activeTab = event.target.getAttribute('href').substring(1);

        // Load the respective data for the tab clicked
        if (activeTab === 'data')
            loadParsedData();
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

document.getElementById('fileOptions').addEventListener('change', function () {
    const selectedValue = this.value;

    // If AWS Account is selected, show all tabs
    if (selectedValue === 'aws') {
        toggleTabs(false);  // Show the tabs
    }
    // If RDS/APP Accounts is selected, hide the last four tabs
    else if (selectedValue === 'rds_app') {
        toggleTabs(true);  // Hide the tabs
    }
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

                if (dept.startsWith('pso')) {
                    deptValue = 'PSO';
                } else if (dept.startsWith('hosted')) {
                    deptValue = 'Hosted';
                } else if (dept.startsWith('saas')) {
                    deptValue = 'SAAS';
                } else if (dept.startsWith('sales')) {
                    deptValue = 'Sales';
                }

                // Only proceed if deptValue is defined
                if (deptValue) {
                    const key = `${deptValue} ${arr[1]} ${arr[2]}`;  // Combine Dept, PM, and Project_Number as key
                    const obj = { Customer: arr[3], Dept: arr[0] };
                    storedData.set(key, obj);
                }

            });

            // Checking the stored data after processing
            console.log(storedData);
        },
        header: false, // No headers in the CSV (we are checking manually)
        skipEmptyLines: true, // Skip any empty lines
    });
}

