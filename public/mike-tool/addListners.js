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

        // Clear PivotTable if switching away from the "Always on" tab
        if (activeTab !== 'always-on') {
            clearPivotTable();
        }

        // Load the respective data for the tab clicked
        if (activeTab === 'data')
            loadParsedData();
        if (activeTab === 'saas')
            loadSAASData();
        if (activeTab === 'hosted')
            loadHostedData();
        if (activeTab === 'always-on')
            loadPivotTable();
    });
});

// Function to clear the PivotTable when switching away from the "Always on" tab
function clearPivotTable() {

    document.querySelector('#always-on').classList.remove('show', 'active');
    document.querySelector('#data').classList.add('show', 'active');

    const pivotTableElement = document.getElementById("pivot-table");

    // Clear the pivot table content
    $(pivotTableElement).html(''); // This will remove the pivot table from the element
}





function storeDataInMemory(event) {

    const file = event.target.files[0];
    if (!file) return;


    // Parse the CSV file once data is available
    Papa.parse(file, {
        complete: function (results) {
            const csvData = results.data;

            csvData.forEach(arr => {
                if (arr[0].toLowerCase().includes('pso')
                    || arr[0].toLowerCase().includes('hosted')
                    || arr[0].toLowerCase().includes('sales')
                )
                    storedData.set(`${arr[0].split('-')[0]} ${arr[1]} ${arr[2]}`, arr)
            });

            //Checking dept name


            console.log(storedData)
        },
        header: false, // No headers in the CSV
        skipEmptyLines: true, // Skip any empty lines
    });
}