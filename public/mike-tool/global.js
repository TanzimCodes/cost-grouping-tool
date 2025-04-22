let comparedData = []; // To store the compared data (original vs processed)
let currentData = { type: '', data: [] }; // This will track the currently displayed data (original, processed, or compared)
let SAASData = []
let HostedData = []
let AlwaysOnData = []

let awsData = []
let rdsAppData = []
let noneData = []
let mergedData = []

// Check if the page is served locally or from the server
const apiBaseUrl = `https://${window.location.hostname}`;


let storedData = new Map();

let gridMap = new Map();

