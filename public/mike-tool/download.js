// Function to download data as CSV
function downloadCSV() {
    let csv;
    if (getSelectedAccountType() === 'rds_app')
        csv = Papa.unparse(transformOtherAccountDataBeforeDownloading());
    else
        csv = Papa.unparse(currentData.data);

    // Create a Blob from the CSV data
    const blob = new Blob([csv], { type: 'text/csv' });

    // Create an invisible link to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentData.type}.csv`;  // Set the filename for the download
    link.click();  // Trigger the download
}

// Function to download data as JSON
function downloadJSON() {
    // Convert data to JSON format
    const json = JSON.stringify(currentData, null, 2);  // Indented JSON for readability

    // Create a Blob from the JSON data
    const blob = new Blob([json], { type: 'application/json' });

    // Create an invisible link to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.json';  // Set the filename for the download
    link.click();  // Trigger the download
}

function transformOtherAccountDataBeforeDownloading() {
    // console.log(currentData)
    // Create deep clone of `currentData`
    const tempData = JSON.parse(JSON.stringify(currentData));
    console.log(tempData)
    const transformedData = [];

    tempData.data.forEach(item => {
        const obj = {
            "Account": "",
            "Customer": item.Customer,
            "Project_Number": item.Project_Number + '',
            "Cost": 0,
        };

        const cost = item.Cost;

        if (item.Account.includes('RDS') && item.app_accounts.length) {
            let costEachApp = cost / item.app_accounts.length;

            //Data has already been sanitized, no need to match
            // Transform "761018873155 (RDS-0000002-AWEUC1)" -> (RDS-0000002-AWEUC1)
            // let match = item.Account.match(/\((.*?)\)/);
            //--------------------------->

            item.app_accounts.forEach(AppAccount => {
                obj.Account = `${AppAccount.Account} - DB Usage (${item.Account})`;
                obj.Customer = AppAccount.Customer;
                obj.Project_Number = AppAccount.Project_Number + '';
                obj.Cost = costEachApp.toFixed(3);
                transformedData.push({ ...obj });  // Shallow clone here
            });


        } else {
            //Data has already been sanitized, no need to match
            // Transform "605134443081 (App-0000003-AWEUC1)" -> App-0000003-AWEUC1
            // let match = item.Account.match(/\((.*?)\)/);
            //---------------------->
            obj.Account = item.Account;
            obj.Cost = cost;

            transformedData.push({ ...obj });  // Shallow clone here
        }
    });

    return transformedData; // Return the transformed data
}

