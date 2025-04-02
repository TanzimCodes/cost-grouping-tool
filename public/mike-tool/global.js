let originalData = []; // To store the original data (before processing)
let processedData = []; // To store the transformed data
let comparedData = []; // To store the compared data (original vs processed)
let currentData = []; // This will track the currently displayed data (original, processed, or compared)
let SAASData = []
let HostedData = []
let AlwaysOnData = []

// Check if the page is served locally or from the server
let apiBaseUrl;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    apiBaseUrl = 'https://localhost';  // Local testing
} else {
    apiBaseUrl = 'https://172.25.255.17';  // Remote server
}

let storedData = new Map();

let gridMap = new Map();

