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