# Cost Grouping Tool
Cost Grouping tool for work with Docker support.

## Getting Started

### Clone the Repository

You can clone the repository using Git:
```sh
git clone https://github.com/TanzimCodes/cost-grouping-tool.git
```
Or download the ZIP file from the repository.

### Install Docker on your machine
Ensure Docker is installed on your machine. You can download it here:
[Docker Installation Guide](https://www.docker.com/)


### Build the Docker Image
```sh
docker build -t cost-grouping .
```

### Run the Docker Container
```sh
docker run -p 3001:3001 -e AWS_ACCESS_KEY_ID=your_id -e AWS_SECRET_ACCESS_KEY=your_secret_key -e AWS_DEFAULT_REGION=us-east-1 cost-grouping
```

Replace the AWS values with your own creds and enjoy :) - It should now be running on port 3001
