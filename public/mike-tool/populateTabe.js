// Function to populate the AG-Grid table with data
function populateGridTable(data, grid_id) {

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
        editable: true,
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
        if (item.field === 'Cost')
            item.aggFunc = 'sum';

        if (item.field === 'app_accounts') {
            item.cellRenderer = (params) => {
                if (Array.isArray(params.value)) {
                    // Join the app accounts data in a readable format (e.g., 'Account | Customer | Project Number')
                    return params.value.map(account => `${account.Account} | ${account.Customer} | ${account.Project_Number}`).join('<br/>');
                }
                return ''; // Return an empty string if there's no app account data
            }
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
            rowGroupPanelShow: 'always',
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


async function saveReport() {
    const date = getSelectedDate();
    const isUploaded = (await checkFileStatus(date)).uploaded;
    //not previous data found, let them upload
    if (!isUploaded) {
        saveFile(date)
        return
    }

    const userDecision = await overwriteAlert();

    if (userDecision.isConfirmed) {
        stopAudio();
        saveFile(date)
    }
}

async function checkFileStatus(date) {
    try {
        const response = await axios.get(`${apiBaseUrl}/files/${date}/status`);
        return response.data;
    } catch (err) {
        alert(err);
    }
}

async function saveFile(date) {
    showSpinner();
    const url = `${apiBaseUrl}/files`;  // Replace with your API endpoint
    const bodyData = {
        "date": date,
        "data":
        {
            "awsData": awsData,
            "rdsAppData": rdsAppData,
            "noneData": noneData,
            "comparedData": comparedData
        }
    }
    try {
        const response = await axios.post(url, bodyData);
        console.log('Response:', response.data);
        SuccessAlert('Report Saved 💾', 'Job well done, time for a coffee break ☕!');
    } catch (error) {
        console.error('Error during POST request:', error);
        errorAlert(`Failed to save the report. ${error.message || 'Please try again later.'}`)
    } finally {
        hideSpinner();
    }
}