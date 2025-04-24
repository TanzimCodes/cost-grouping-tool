document.addEventListener("DOMContentLoaded", loadFileList)

function loadFileList() {

    // API Call to fetch available report dates
    fetchReportDates();
};

function showSpinner() {
    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "block";
}

function hideSpinner() {
    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "none";
}


async function fetchReportDates() {
    const reportDateSelect = document.getElementById("reportDateSelect");
    try {

        const response = await axios.get(`${apiBaseUrl}/files`) // Adjust the URL according to your API

        const dates = response.data; // Assuming the API response contains a 'dates' array
        dates.forEach(date => {
            const option = document.createElement("option");
            option.value = date;
            option.textContent = date;
            reportDateSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching report dates:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to load report dates. Please try again later.',
        });
    }
}

// Event listener for the "Load Report" button
document.getElementById("loadReportButton").addEventListener("click", loadReport);

async function loadReport() {
    const selectedDate = reportDateSelect.value;

    if (!selectedDate) {
        // Replace alert with SweetAlert
        Swal.fire({
            icon: 'warning',
            title: 'No Date Selected',
            text: 'Please select a report date.',
        });
        return;
    }

    try {
        showSpinner();

        const response = await axios.get(`${apiBaseUrl}/files/${selectedDate}`)

        // Handle successful response
        console.log('Success:', response.data);  // Handle the response data
        resetValues();

        setValues(response.data);
        loadMergedData();
        SuccessAlert(`🎯 Got it! Report for ${selectedDate} is all yours!`);


    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to load the report. Please try again later.',
        });
        console.log(error)
    } finally {
        hideSpinner();
    }

}



// Success function
function SuccessAlert(title, text) {
    Swal.fire({
        title: title,
        text: text,
        icon: 'success',  // Success icon
        confirmButtonText: 'Okay'
    });
}

function setValues(data) {
    // Check if data contains the specified keys and set them globally

    if (data.awsData) {
        awsData = data.awsData;
    }

    if (data.rdsAppData) {
        rdsAppData = data.rdsAppData;
    }

    if (data.noneData) {
        noneData = data.noneData;
    }

    generateSAASData();
    generateHostedData();

    // Grouped and aggregated result
    const groupedData = groupByDeptAndAggregateCosts([...awsData, ...rdsAppData, ...noneData]);

    mergedData = Object.values(groupedData);

}

function groupByDeptAndAggregateCosts(data) {
    // First, group and aggregate the costs by department
    const groupedData = data.reduce((result, item) => {
        const { Dept, Cost } = item;

        if (result[Dept]) {
            result[Dept].Cost += Cost;
        } else {
            result[Dept] = { Dept, Cost };
        }

        return result;
    }, {});

    // Calculate the total cost
    const totalCost = Object.values(groupedData).reduce((sum, dept) => sum + dept.Cost, 0);
    const roundedTotalCost = totalCost.toFixed(2); // Round total cost to 2 decimal places

    // Add percentage and round Cost to 2 decimal places for each department
    const resultWithPercentage = Object.values(groupedData).map(dept => {
        // Round Cost to 2 decimal places
        const roundedCost = dept.Cost.toFixed(2);

        // Calculate percentage and round it to 2 decimal places
        const percentage = ((dept.Cost / totalCost) * 100).toFixed(2);

        return {
            ...dept,
            Cost: Number(roundedCost), // Store rounded cost
            Percentage: Number(percentage)
        };
    });


    return resultWithPercentage;
}


function generateSAASData() {
    SAASData = awsData.filter((item) => {
        if (item.Dept && (item.Dept === "SAAS-US-IN" || item.Dept === "SAAS-EMEA" || item.Dept === "SAAS-International")) {
            return true; // Return items that match the condition
        } else if (item.Dept.startsWith('SAAS')) {
            // console.log("Non-SAAS item:", item); // Log items that don't match
            return false; // Filter out items that don't match
        }
    });
}

function generateHostedData() {
    HostedData = awsData.filter((item) => {
        if (item.Dept && (item.Dept === "Hosted-US-IN" || item.Dept === "Hosted-EMEA" || item.Dept === "Hosted-International")) {
            return true; // Return items that match the condition
        } else if (item.Dept.startsWith('Hosted')) {
            // console.log("Non-Hosted item:", item); // Log items that don't match
            return false; // Filter out items that don't match
        }
    });
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

    });
});


function loadMergedData() {

    // currentData.type = `Billing Report - ${getSelectedDate()}`;

    // currentData.data = mergedData;


    showSpinner()

    setTimeout(() => {
        populateGridTable(mergedData, 'mergedDataTable')
        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load parsed data into the table
function loadAwsData() {

    // currentData.type = 'Administrator';

    // currentData.data = awsData;


    showSpinner()

    setTimeout(() => {
        populateGridTable(awsData, 'awsDataTable')

        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load parsed data into the table
function loadRdsAppdData() {
    // currentData.type = 'RDS_APP';

    // currentData.data = rdsAppData;
    showSpinner()

    setTimeout(() => {
        populateGridTable(rdsAppData, 'rdsAppDataTable')

        hideSpinner();
    }, 1);  // 1 second delay

}
// Function to load parsed data into the table
function loadNonedData() {

    // currentData.type = 'None';

    // currentData.data = noneData;

    showSpinner()

    setTimeout(() => {
        populateGridTable(noneData, 'noneDataTable')

        hideSpinner();
    }, 1);  // 1 second delay

}

// Function to load compared data into the table
function loadComparedData() {
    // currentData.type = 'Compared';  // Track that the original data is loaded

    // currentData.data = comparedData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateGridTable(comparedData, 'awsDataTable');


        hideSpinner();
    }, 1);  // 1 second delay


}


// Function to load compared data into the table
function loadSAASData() {
    // currentData.type = 'SAAS';  // Track that the original data is loaded

    // currentData.data = SAASData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateGridTable(SAASData, 'saasTable')

        hideSpinner();
    }, 1);  // 1 second delay


}

// Function to load compared data into the table
function loadHostedData() {
    // currentData.type = 'Hosted';  // Track that the original data is loaded

    // currentData.data = HostedData;  // Track that the original data is loaded

    showSpinner()
    setTimeout(() => {
        populateGridTable(HostedData, 'hostedTable');

        hideSpinner();
    }, 1);  // 1 second delay
}


// Function to populate the AG-Grid table with data
function populateGridTable(data, grid_id) {
    console.log(data)
    // If there is no data, return
    if (data.length === 0) {
        return;
    }

    const headers = Object.keys(data[0]);

    const colDefs = headers.map(header => ({
        headerName: header,  // Column title
        field: header,       // The field to get data from
        autoHeight: true,  // Automatically adjust row height
        filter: true,
        enableRowGroup: true,
        cellStyle: (params) => {
            // Check if the value is a string before calling .includes()
            if (typeof params.value === "string" && params.value.includes("->")) {
                return { backgroundColor: '#007bff', color: 'white' };  // Apply styles if condition is met
            }
            return null;  // Default style
        }
    }));

    colDefs.forEach(item => {
        if (item.field === 'Cost') {
            // item.aggFunc = 'sum';

            // Custom aggregation for 'Cost' with rounding to 2 decimal places
            item.aggFunc = (obj) => {
                const sum = obj.values.reduce((acc, val) => acc + val, 0);
                return sum.toFixed(2);  // Round the sum to 2 decimal places
            };
        }

        if (item.field === 'app_accounts') {
            item.cellRenderer = (params) => {
                if (Array.isArray(params.value)) {
                    // Join the app accounts data in a readable format (e.g., 'Account | Customer | Project Number')
                    return params.value.map(account => `${account.Account} | ${account.Customer} | ${account.Project_Number}`).join('<br/>');
                }
                return ''; // Return an empty string if there's no app account data
            }
        }

        // Adding aggregation for the "Percentage" column
        if (item.field === 'Percentage') {
            // Ensure the value is numeric for aggregation
            item.valueGetter = (params) => {
                return params.data.Percentage;  // Numeric value for aggregation
            };

            // Add the percentage sign to the display value using a custom renderer
            item.cellRenderer = (params) => {
                return `${params.value}%`;  // Display the value with "%" sign
            };

            // Custom aggregation: round to the nearest integer
            item.aggFunc = (obj) => {
                const sum = obj.values.reduce((acc, val) => acc + val, 0);
                return sum.toFixed(2);  // Round the sum to 2 decimal places
            };
        }

    })

    //Check if AG Grid is already initialized
    if (gridMap.get(grid_id)) {
        // If AG Grid is initialized, update the data
        gridMap.get(grid_id).setGridOption('rowData', data);
        gridMap.get(grid_id).setGridOption('columnDefs', colDefs);

    } else {
        const gridOptions = {
            columnDefs: colDefs,
            rowData: data,
            pagination: true, // Enable pagination
            paginationPageSize: 50, // Set default number of rows per page
            paginationPageSizeSelector: [50, 100, 150], // Options for pagination size,
            rowGroupPanelShow: grid_id === 'mergedDataTable' ? 'never' : 'always',
            grandTotalRow: 'bottom',
            defaultExcelExportParams: {
                exportAsExcelTable: true,
                fileName: `${currentData.type}.xlsx`
            }
        };


        // Initialize AG Grid

        const gridObj = agGrid.createGrid(document.querySelector(`#${grid_id}`), gridOptions)
        gridObj.sizeColumnsToFit();

        gridMap.set(grid_id, gridObj)
    }

}

function resetValues() {
    currentData = { type: '', data: [] }; // This will track the currently displayed data and it's type
    SAASData = []
    HostedData = []
    AlwaysOnData = []

    awsData = []
    rdsAppData = []
    noneData = []
    mergedData = []
}