const express = require('express');
const queryCostExplorer = require('./api');  // Import the cost data router
const cors = require('cors');  // Import the cors package

// Enable CORS for all routes (you can be more specific with origins if needed)

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static('public'))

app.use(cors());

// Route to serve an HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Use the costDataRouter for handling /api/cost-data requests
app.post('/get-data', queryCostExplorer);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
