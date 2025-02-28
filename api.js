const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");
const fs = require('fs');  // Import the fs module to write to a file

// Initialize the Cost Explorer client
const client = new CostExplorerClient({ region: 'us-east-1' });

// Function to query AWS Cost Explorer for a suspicious tag and return the response
const queryCostExplorer = async (req, res) => {
    // Extract parameters from the request body
    const { FilterValArray = [], groupByArr, startDate, endDate } = req.body;
    // Construct the Filter object dynamically based on the length of FilterValArray
    let filter = {};

    if (FilterValArray.length > 1) {
        filter["And"] = FilterValArray; // Use "And" if more than one value
    } else if (FilterValArray.length === 1) {
        filter = FilterValArray[0]; // Use the single filter directly if only one value
    }

    // Construct parameters for the AWS SDK request
    const params = {
        TimePeriod: {
            Start: startDate,
            End: endDate,
        },
        Granularity: 'MONTHLY', // Granularity can be DAILY or MONTHLY
        GroupBy: groupByArr, // Dynamic group-by array
        Metrics: ['NET_UNBLENDED_COST'],  // Add the metric to query (UnblendedCost)
    };

    if (Object.keys(filter).length !== 0) {
        params.Filter = filter
    }


    // fs.writeFileSync('params.json', JSON.stringify(params, null, 2)); // Pretty-print JSON with 2 spaces indentation

    const command = new GetCostAndUsageCommand(params);

    try {
        // Fetch the cost and usage data
        const data = await client.send(command);

        // // Write the raw JSON response to a file (e.g., cost_data.json)
        // fs.writeFileSync('cost_data.json', JSON.stringify(data, null, 2)); // Pretty-print JSON with 2 spaces indentation
        // console.log('Raw JSON data written to "cost_data.json".');

        // Send back the raw data as response to the client
        return res.json(data);

    } catch (error) {
        console.error('Error fetching cost data:', error);
        res.status(500).json({ error: 'Error fetching cost data', details: error.message });
    }
};



module.exports = queryCostExplorer