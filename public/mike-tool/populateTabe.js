// Function to populate the table with data
function populateTable(data, table_id) {
    const tableBody = document.querySelector(`#${table_id} tbody`);
    const tableHeader = document.querySelector(`#${table_id} thead tr`);
    tableBody.innerHTML = '';  // Clear existing rows

    if (data.length === 0) {
        tableHeader.innerHTML = '';  // Clear existing headers if there's no data
        return;
    }

    // Dynamically create table headers based on the first row's keys
    const headers = Object.keys(data[0]);
    tableHeader.innerHTML = '';
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
    });

    // Populate table rows
    data.forEach(row => {
        const tr = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');

            let cellContent = row[header];

            // If the cell contains an array, format it
            if (Array.isArray(cellContent)) {
                // Convert each object in the array to a string in the required format
                cellContent = cellContent
                    .map(item => `${item.Account} | ${item.Customer} | ${item.Project_Number}`)
                    .join('\n\n'); // Join them with newlines
            }

            // If the content contains '->', add the 'table-success' class
            if (typeof cellContent === 'string' && cellContent.includes('->')) {
                td.classList.add('table-success');
            }

            // Create a text node and append it to the table cell
            td.textContent = cellContent;

            // Ensure proper multi-line rendering by using <pre> for multi-line content
            if (typeof cellContent === 'string' && cellContent.includes('\n')) {
                td.style.whiteSpace = 'pre-wrap';  // Allow line breaks inside the table cell
                td.style.wordWrap = 'break-word';  // Break long words if necessary
            }

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });


}
// Function to populate the AG-Grid table with data

function populateGridTable(data, grid_id) {
    console.log(gridMap)
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
                return { backgroundColor: '#007bff' , color: 'white'};  // Apply styles if condition is met
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
            grandTotalRow: 'bottom'
        };


        // Initialize AG Grid

        const gridObj = agGrid.createGrid(document.querySelector(`#${grid_id}`), gridOptions)
        gridObj.sizeColumnsToFit();

        gridMap.set(grid_id, gridObj)
    }

}


