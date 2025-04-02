// const exportButton = document.getElementById('export');
let currentData = []

// exportButton.addEventListener('click', () => {
//   // Convert the data to CSV using Papa Parse
//   const csv = Papa.unparse(currentData);

//   // Create a temporary link to download the CSV file
//   const link = document.createElement('a');
//   link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
//   link.target = '_blank';
//   link.download = 'exported-data.csv';

//   // Programmatically trigger the download
//   link.click();
// })

// Check if the page is served locally or from the server
let apiBaseUrl;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  apiBaseUrl = 'https://localhost';  // Local testing
} else {
  apiBaseUrl = 'https://172.25.255.17/';  // Remote server
}

document.getElementById('fetch-data').addEventListener('click', () => {

  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const selectedTag = document.getElementById('tag').value;
  const selectedLinkedAccount = document.getElementById('linked-account').value;
  const selectedRegion = document.getElementById('region').value;
  const groupByDimension = document.getElementById('group-by-dimension').value;
  const groupByTag = document.getElementById('group-by-tag').value;
  const groupByDimension2 = document.getElementById('group-by-dimension-2').value;
  const groupByTag2 = document.getElementById('group-by-tag-2').value;


  // const savedQuery = document.getElementById('saved-query').value;


  const params = {
    startDate,
    endDate
  }

  // if (savedQuery) {
  //   params.groupByDimension = savedQuery;
  //   executeSavedQuery(params)
  // } else {
  params.tag = selectedTag;
  params.linkedAccount = selectedLinkedAccount;
  params.region = selectedRegion;
  params.groupByDimension = groupByDimension;
  params.groupByTag = groupByTag;
  params.groupByDimension2 = groupByDimension2;
  params.groupByTag2 = groupByTag2;
  executeNormalQuery(params)
  // }

});

async function executeNormalQuery(params) {

  // Count the number of truthy groupBy values
  const groupByCount = [params.groupByDimension, params.groupByTag, params.groupByDimension2, params.groupByTag2].filter(Boolean).length;

  const toastBody = document.querySelector("#error-toast .toast-body");

  if (groupByCount < 1) {
    toastBody.textContent = "Please select at least one 'Group By' option.";
    showToast();
    return;
  }

  if (groupByCount > 2) {
    toastBody.textContent = "At most 2 'Group By' values can be selected.";
    showToast();
    return;
  }


  showSpinner();

  const requestParams = transformDropDownValues(params)

  try {
    // Call the fetchData function to get the data
    const data = await fetchData(requestParams);
    const tableData = transformApiData(data)
    currentData = tableData.data;

    // updateTable(tableData)
    updateTableWithAGGrid(tableData)

  } catch (error) {
    const toastBody = document.querySelector("#error-toast .toast-body");
    toastBody.textContent = "An error occurred while fetching data.";
    console.log(error)
    showToast();
  } finally {
    hideSpinner(); // Hide the spinner regardless of success or error
  }
}

async function executeSavedQuery(params) {

  showSpinner();

  const requestParams = transformDropDownValues(params)

  try {
    // Call the fetchData function to get the data
    const apiData = await fetchData(requestParams);
    const tableData = transformApiData(apiData)
    const { dimensionValueAttributes } = tableData;
    console.log('before', tableData.data)

    tableData.data = tableData.data.filter(item =>
      !dimensionValueAttributes[item.group1].startsWith('spot-eco')
      && !dimensionValueAttributes[item.group1].startsWith('Strategic')
      && !dimensionValueAttributes[item.group1].startsWith('AWS Administrator')
    )
    console.log('after', tableData.data)

    updateTable(tableData)

  } catch (error) {
    const toastBody = document.querySelector("#error-toast .toast-body");
    toastBody.textContent = "An error occurred while fetching data.";
    showToast();
    console.log(error)
  } finally {
    hideSpinner(); // Hide the spinner regardless of success or error
  }

}

async function fetchData(postData) {
  try {
    const response = await fetch(`${apiBaseUrl}/get-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Return the parsed JSON data directly
    return await response.json();
  } catch (error) {
    throw error; // Rethrow error to allow further handling if needed
  }
}



function transformDropDownValues(requestData) {
  // Extract values from requestData
  const { tag, linkedAccount, region, groupByDimension, groupByTag, groupByDimension2, groupByTag2, startDate, endDate } = requestData;

  // Build the FilterValArray (And array for Filter)
  const FilterValArray = [];

  // Add linked account filter (if present)
  if (linkedAccount) {
    FilterValArray.push({
      "Dimensions": {
        "Key": "LINKED_ACCOUNT",
        "Values": [linkedAccount] // Linked account should be a single value or an array of values
      }
    });
  }

  // Add tag filter (if present)
  if (tag) {
    FilterValArray.push({
      "Tags": {
        "Key": "Dept", // This is fixed
        "Values": [tag]
      }
    });
  }

  // Add region filter (if present)
  if (region) {
    FilterValArray.push({
      "Dimensions": {
        "Key": "REGION",
        "Values": [region] // Region filter
      }
    });
  }

  // Build the groupByArr (support multiple groupBy fields)
  const groupByArr = [];

  // Add group by dimension (if present)
  if (groupByDimension) {
    groupByArr.push({
      Type: 'DIMENSION',
      Key: groupByDimension // e.g., INSTANCE_TYPE, RESERVATION_ID
    });
  }

  // Add second group by dimension (if present)
  if (groupByDimension2) {
    groupByArr.push({
      Type: 'DIMENSION',
      Key: groupByDimension2 // e.g., INSTANCE_TYPE, RESERVATION_ID
    });
  }

  // Add group by tag (if present)
  if (groupByTag) {
    groupByArr.push({
      Type: 'TAG',
      Key: groupByTag // e.g., Name
    });
  }

  // Add second group by tag (if present)
  if (groupByTag2) {
    groupByArr.push({
      Type: 'TAG',
      Key: groupByTag2 // e.g., Name
    });
  }

  // Return the transformed data to call queryCostExplorer
  return {
    FilterValArray,
    groupByArr,
    startDate,
    endDate
  };
}



// Update table with response data
function updateTableWithTabulator({ headerValues, data, dimensionValueAttributes }) {

  // Prepare data for Tabulator
  const formattedData = data.map(item => ({
    month: item.month,
    group1: item.group1,
    group2: item.group2,
    cost: item.cost
  }));

  // Define column definitions for AG Grid
  const columnDefs = [
    { headerName: "Month", field: "month" },
    { headerName: headerValues[0] || 'Group 1', field: "group1" },
    { headerName: headerValues[1] || 'Group 2', field: "group2" },
    { headerName: "Cost (USD)", field: "cost", valueFormatter: params => `$${params.value.toFixed(2)}` }
  ];

  // Check if Tabulator is already initialized
  if (window.tabulatorInstance) {
    // If it is, update the data
    window.tabulatorInstance.setData(formattedData);
  } else {
    // If not, initialize Tabulator
    window.tabulatorInstance = new Tabulator("#tabulator-table", {
      data: formattedData, // Set the initial data
      columns: columnDefs,
      pagination: "local", // Enable pagination
      paginationSize: 30, // Number of rows per page
      paginationSizeSelector: [10, 30, 50], // Options for pagination size
      layout: "fitColumns", // Automatically adjust column width to fit content
      tooltips: true, // Show tooltips for cells
      responsiveLayout: "hide", // Hide columns on smaller screens
      initialSort: [
        { column: "month", dir: "asc" }
      ], // Optional: Sort by month
      stickyHeader: true
    });
  }
}

function updateTableWithAGGrid({ headerValues, data, dimensionValueAttributes }) {

  // Define column definitions for AG Grid
  const columnDefs = [
    { headerName: "Month", field: "month" },
    { headerName: headerValues[0] || 'Group 1', field: headerValues[0], filter: true },
    { headerName: headerValues[1] || 'Group 2', field: headerValues[1], filter: true },
    {
      headerName: "Cost (USD)",
      field: "cost",
      filter: true,
      valueGetter: (params) => {
        // Convert cost to number if it's not already
        return parseFloat(params.data.cost) || 0;
      }
    }
  ];

  // Check if AG Grid is already initialized
  if (window.grid) {
    // If AG Grid is initialized, update the data
    window.grid.setGridOption('rowData', data);
    window.grid.setGridOption('columnDefs', columnDefs);

  } else {
    // If not, initialize AG Grid
    const gridOptions = {
      columnDefs: columnDefs, // Set the column definitions
      rowData: data, // Set the data
      pagination: true, // Enable pagination
      paginationPageSize: 30, // Set default number of rows per page
      paginationPageSizeSelector: [10, 30, 50], // Options for pagination size
    };

    // Initialize AG Grid
    window.grid = agGrid.createGrid(document.getElementById("myGrid"), gridOptions);
    window.grid.sizeColumnsToFit();
    console.log(window.grid)
  }
}






// Function to transform the API response into a format suitable for the table
function transformApiData(apiData) {
  const dimensionValueAttributes = {}

  //for linked accounts
  const results = apiData.ResultsByTime;
  let transformedData = [];
  let headerValues = [];

  // Assuming the first result's Groups are representative of all groups in the API response
  // if (results.length > 0 && results[0].Groups.length > 0) {
  // Extract header values from GroupDefinitions and result groups
  const groupDefinitions = apiData.GroupDefinitions;
  // console.log("hi", groupDefinitions, apiData.GroupDefinitions, apiData)
  groupDefinitions.forEach(def => {
    headerValues.push(def.Key); // Use the 'Key' from GroupDefinitions as the column header
  });
  // }

  apiData.DimensionValueAttributes.forEach(item => {
    dimensionValueAttributes[item.Value] = item.Attributes.description
  })

  results.forEach(result => {
    const groups = result.Groups;

    // const month = new Date(result.TimePeriod.Start).toLocaleString('default', { month: 'long', year: 'numeric' }); // Get the full month and year

    groups.forEach(group => {
      let group1 = processTagKey(group.Keys[0], apiData.GroupDefinitions); // Process the first key (Group 1)
      let group2 = group.Keys[1] ? processTagKey(group.Keys[1], apiData.GroupDefinitions) : ''; // Process the second key (Group 2), if exists
      const cost = group.Metrics.NetUnblendedCost.Amount; // Extract the cost
      const monthYear = getMonthYear(result.TimePeriod.Start)
      // Push transformed data into the result array

      group1 = headerValues[0] === 'LINKED_ACCOUNT' ? `${group1} (${dimensionValueAttributes[group1]})` : group1;
      group2 = headerValues[1] === 'LINKED_ACCOUNT' ? `${group2} (${dimensionValueAttributes[group2]})` : group2;

      transformedData.push({
        month: monthYear,
        [headerValues[0]]: group1,
        [headerValues[1]]: group2,
        cost: Number(cost) // Convert cost to a number
      });
    });
    // group1: headerValues[0] === 'LINKED_ACCOUNT'? `${group1} (${dimensionValueAttributes[group1]})`: group1,


  });

  // Return both the header values and transformed data
  return {
    headerValues: headerValues,
    data: transformedData,
    dimensionValueAttributes
  };
}

function getMonthYear(dateString) {

  const [year, month] = dateString.split('-');

  // Create a Date object using the UTC format
  const date = new Date(Date.UTC(year, month)); // Month is zero-indexed

  // Format the date to get 'Mar 2023'
  const options = { year: 'numeric', month: 'short' };
  const formattedDate = date.toLocaleString('en-US', options);

  return formattedDate
}

// Helper function to process the tag keys
function processTagKey(tagKey, groupDefinitions) {
  // Check if the key contains a '$' and process accordingly only if the key is of type 'TAG'
  const matchingDef = groupDefinitions.find(def => tagKey.startsWith(def.Key));

  if (matchingDef && matchingDef.Type === 'TAG') {

    const tagName = tagKey.split('$')[0]; // Get the key part before the '$'
    const tagValue = tagKey.split('$')[1]; // Get the value part after the '$'

    // If there's a value after the $, return it; otherwise, return a placeholder message
    return tagValue ? tagValue : `No tag key: ${tagName}`;

  }

  // If it's not a tag, return the key as is
  return tagKey;

}

function showToast() {
  let toast = new bootstrap.Toast(document.getElementById('error-toast'));
  toast.show();
}

function hideSpinner() {
  document.getElementById('loading-spinner').style.display = 'none'; // Hide the spinner
}

function showSpinner() {
  document.getElementById('loading-spinner').style.display = 'inline-block';
}
