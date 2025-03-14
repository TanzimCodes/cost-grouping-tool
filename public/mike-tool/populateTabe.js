// Function to populate the table with data
function populateTable(data) {
    const tableBody = document.querySelector('#dataTable tbody');
    const tableHeader = document.querySelector('#dataTable thead tr');
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