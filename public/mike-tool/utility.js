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
    token = sessionStorage.getItem("authToken");
}
