function login() {
    console.log("fetching");

    // Make the request to the backend endpoint
    fetch('https://172.25.255.17/get-token', {
        method: 'GET', // Using GET method since this is a simple retrieval
        headers: {
            'Content-Type': 'application/json', // Set content type as JSON
        },
    })
        .then(response => {
            console.log("got response");

            // Check if the response is successful (status code 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Parse the JSON response
            return response.json();
        })
        .then(data => {
            console.log("parsing response", data);
            saveToken(data.accessToken);
            // Handle the response data
            console.log('Access Token:', data.accessToken);
            alert('login Successful')
        })
        .catch(error => {
            // Catch and log any errors
            console.error('Error fetching access token:', error);
        });
}
