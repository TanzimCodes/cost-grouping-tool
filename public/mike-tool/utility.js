function showSpinner() {
    // Show the loading spinner
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideSpinner() {
    document.getElementById('loading-spinner').style.display = 'none'; // Hide the spinner
}

// Show the download buttons when data is loaded
function showDownloadButtons() {
    const downloadButtons = document.getElementById('downloadButtons');
    downloadButtons.style.display = 'block';  // Make the download buttons visible
}

function getSelectedAccountType() {
    return document.getElementById('fileOptions').value;
}

function saveToken(token) {
    sessionStorage.setItem("authToken", token);
}

// Get token from sessionStorage
function getToken() {
    return sessionStorage.getItem("authToken");
}

function cacheApiResponse(queryName, data) {
    sessionStorage.setItem(queryName, data);
}

function getCachedResponse(queryName) {
    return sessionStorage.getItem(queryName);
}



function toggleTabs() {
    const tabsToHide = [
        'saas-tab',
        'hosted-tab',
        'always-on-tab',
        'dept-pn-pm-cost-tab'
    ];

    tabsToHide.forEach(tabId => {
        document.getElementById(tabId).classList.toggle('d-none');
    });
}


function toggleTheme() {
    // Get all div elements with the 'data-ag-theme-mode' attribute
    var themeContainers = document.querySelectorAll('[data-ag-theme-mode]');

    // Loop through all theme containers and toggle the theme mode
    themeContainers.forEach(function (themeContainer) {
        var currentTheme = themeContainer.getAttribute('data-ag-theme-mode');
        // Toggle between 'light' and 'dark' theme
        themeContainer.setAttribute('data-ag-theme-mode', currentTheme === 'light' ? 'dark-blue' : 'light');
    });
}

// Function to get the selected month/year from the date picker
function getSelectedDate() {
    const date = document.getElementById('datePicker').value;
    return date ? date : null;
}

function uploadDataToServer() {
    // Create the data object
    const dataObj = {
        date: getSelectedDate(),
        data: processedData,  // Assuming processedData is an object or array
        type: getSelectedAccountType()
    };

    // Convert the data object to a JSON string
    const jsonString = JSON.stringify(dataObj);

    // Calculate the size of the JSON string in bytes
    // const dataSize = new Blob([jsonString]).size;
    // console.log('Data size in bytes:', dataSize);

    // Making the POST request using fetch
    fetch(`https://${apiBaseUrl}/upload`, {
        method: 'POST',                // Specify the HTTP method
        headers: {
            'Content-Type': 'application/json'  // Indicate that you're sending JSON data
        },
        body: jsonString     // Convert JavaScript object to JSON string
    })
        .then(response => {
            if (!response.ok) {  // If the response status is not OK (not in the 2xx range)
                throw new Error(`HTTP error! Status: ${response.status}`);  // Throw error with status
            }
            return response.json();  // Parse the JSON response
        })
        .then(data => {
            console.log('Success:', data);  // Handle the response data
            setTimeout(() => loadParsedData(), 100);  // Assuming loadParsedData() is defined elsewhere
        })
        .catch((error) => {
            console.error('Error:', error);  // Handle any errors
            alert('Something went wrong while uploading data to server');
        });
}


function loadDataFromServer(date) {
    // Making the POST request using fetch
    fetch(`https://${apiBaseUrl}/load/${date}`, {
        method: 'GET',                // Specify the HTTP method
        headers: {
            'Content-Type': 'application/json'  // Indicate that you're sending JSON data
        }
    })
        .then(response => {
            if (!response.ok) {  // If the response status is not OK (not in the 2xx range)
                return response.json()  // Parse the error response body as JSON
                    .then(errorData => {
                        throw new Error(`Error: ${errorData.message}`);  // Throw the error with response body
                    });
            }
            return response.json();  // Parse the JSON response
        })
        .then(data => {
            console.log('Success:', data);  // Handle the response data
            resetVales();
            processedData = data
            setTimeout(() => loadParsedData(), 100);
        })
        .catch((error) => {
            console.error('Error:', error);  // Handle any errors
            alert(error.message);
        });
}