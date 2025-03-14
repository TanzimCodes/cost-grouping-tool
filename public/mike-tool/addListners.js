document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('storeFileInpute').addEventListener('change', storeDataInMemory);

document.getElementById('loadOriginalData').addEventListener('click', loadOriginalData);
document.getElementById('loadParsedData').addEventListener('click', loadParsedData);
document.getElementById('loadComparedData').addEventListener('click', loadComparedData);
document.getElementById('login').addEventListener('click', login);


document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
document.getElementById('downloadJSON').addEventListener('click', downloadJSON);

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