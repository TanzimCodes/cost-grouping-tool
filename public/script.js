
document.getElementById('fetch-data').addEventListener('click', () => {
  // Show the loading spinner
  document.getElementById('loading-spinner').style.display = 'inline-block';

  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const selectedTag = document.getElementById('tag').value;
  const selectedLinkedAccount = document.getElementById('linked-account').value;
  const selectedRegion = document.getElementById('region').value;
  const groupByDimension = document.getElementById('group-by-dimension').value;
  const groupByTag = document.getElementById('group-by-tag').value;
  const groupByDimension2 = document.getElementById('group-by-dimension-2').value;
  const groupByTag2 = document.getElementById('group-by-tag-2').value;

  // Count the number of truthy groupBy values
  const groupByCount = [groupByDimension, groupByTag, groupByDimension2, groupByTag2].filter(Boolean).length;

  const toastBody = document.querySelector("#error-toast .toast-body");

  if (groupByCount < 1) {
    toastBody.textContent = "Please select at least one 'Group By' option.";
    showToast();
    hideSpinner();
    return;
  }

  if (groupByCount > 2) {
    toastBody.textContent = "At most 2 'Group By' values can be selected.";
    showToast();
    hideSpinner();
    return;
  }

  const postData = transformDropDownValues({
    startDate,
    endDate,
    tag: selectedTag,
    linkedAccount: selectedLinkedAccount,
    region: selectedRegion,
    groupByDimension,
    groupByTag,
    groupByDimension2,
    groupByTag2
  });

  fetch('http://localhost:3001/get-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    updateTable(transformApiData(data));
    hideSpinner(); // Hide spinner after successful response
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
    toastBody.textContent = "An error occurred while fetching data.";
    showToast();
    hideSpinner(); // Hide spinner on error
  });
});



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
function updateTable({ headerValues, data }) {
  console.log(headerValues)
  // Directly update Group 1 and Group 2 headers
  document.getElementById('group-1').textContent = headerValues[0] || 'Group 1';
  document.getElementById('group-2').textContent = headerValues[1] || 'Group 2';

  // Populate the table body
  const tableBody = document.getElementById('results-table');
  tableBody.innerHTML = ''; // Clear previous results

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.month}</td>
      <td>${item.group1}</td>
      <td>${item.group2}</td>
      <td>${item.cost}</td>
    `;
    tableBody.appendChild(row);
  });
}




// Function to transform the API response into a format suitable for the table
function transformApiData(apiData) {

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

  results.forEach(result => {
    const groups = result.Groups;

    // const month = new Date(result.TimePeriod.Start).toLocaleString('default', { month: 'long', year: 'numeric' }); // Get the full month and year

    groups.forEach(group => {
      const group1 = processTagKey(group.Keys[0], apiData.GroupDefinitions); // Process the first key (Group 1)
      const group2 = group.Keys[1] ? processTagKey(group.Keys[1], apiData.GroupDefinitions) : ''; // Process the second key (Group 2), if exists
      const cost = group.Metrics.NetUnblendedCost.Amount; // Extract the cost
      const monthYear = getMonthYear(result.TimePeriod.Start)
      // Push transformed data into the result array
      transformedData.push({
        month: monthYear,
        group1: group1,
        group2: group2,
        cost: cost // Convert cost to a number
      });
    });


  });
  console.log("Header", headerValues)

  // Return both the header values and transformed data
  return {
    headerValues: headerValues,
    data: transformedData
  };
}

function getMonthYear(dateString) {

  const [year, month] = dateString.split('-');
  console.log(year, month)

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
