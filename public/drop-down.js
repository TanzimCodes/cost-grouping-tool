// Data for dropdowns
const tags = [
  'Administration',
  'Hosted',
  'Hosted-EMA',
  'PSO',
  'PSO - 51',
  'PSO-EU',
  'PSO-EU/India',
  'PSO_US_India',
  'PSO_US_IN',
  'PSO-US',
  'PSO-US/India',
  'SaaS',
  'SaaS-EMEA',
  'SaaS-International',
  'SAAS',
  'SAASMULTI',
  'Sales',
  'Tech Services',
  'TechServices',
  'TechSvcs',
  'Techservices',
  'Technical Servcies',
  'Testing - 75',
  'TCGD',
  'VmssTestRun1forDept'
];

const linkedAccounts = [
  { name: 'AWS Administrator', value: '184212008666' },
  { name: 'CustomerWebsite', value: '945899788175' },
  { name: 'DevSecOpsSandbox', value: '024981512710' },
  { name: 'LabvantageWebsiteProduction', value: '730335657354' },
  { name: 'LV_APP_2_US_EAST_1', value: '992382367290' },
  { name: 'LV_RDS_1_US_EAST_1', value: '975049953686' },
  { name: 'RDS-0000002-AWUSE1', value: '975049889798' },
  { name: 'RDS-0000005-AWUSE1', value: '654654332714' },
  { name: 'RDS-0000006-AWUSE1', value: '905418214685' },
  { name: 'SaaSRds', value: '654654375853' },
  { name: '585246684825 - Redacted', value: '585246684825' }
];


const regions = [
  { value: "af-south-1", name: "Africa (Cape Town)" },
  { value: "ap-east-1", name: "Asia Pacific (Hong Kong)" },
  { value: "ap-northeast-1", name: "Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", name: "Asia Pacific (Seoul)" },
  { value: "ap-northeast-3", name: "Asia Pacific (Osaka-Local)" },
  { value: "ap-south-1", name: "Asia Pacific (Mumbai)" },
  { value: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", name: "Asia Pacific (Sydney)" },
  { value: "ca-central-1", name: "Canada (Central)" },
  { value: "eu-central-1", name: "Europe (Frankfurt)" },
  { value: "eu-north-1", name: "Europe (Stockholm)" },
  { value: "eu-south-1", name: "Europe (Milan)" },
  { value: "eu-west-1", name: "Europe (Ireland)" },
  { value: "eu-west-2", name: "Europe (London)" },
  { value: "eu-west-3", name: "Europe (Paris)" },
  { value: "me-south-1", name: "Middle East (Bahrain)" },
  { value: "sa-east-1", name: "South America (São Paulo)" },
  { value: "us-east-1", name: "US East (N. Virginia)" },
  { value: "us-east-2", name: "US East (Ohio)" },
  { value: "us-west-1", name: "US West (N. California)" },
  { value: "us-west-2", name: "US West (Oregon)" },
  { value: "us-west-3", name: "US West (Los Angeles)" },
  { value: "us-west-4", name: "US West (Las Vegas)" },
  { value: "af-south-2", name: "Africa (Cape Town - Preview)" },
  { value: "ap-northeast-4", name: "Asia Pacific (Jakarta - Preview)" },
  { value: "ap-southeast-3", name: "Asia Pacific (Jakarta - Preview)" },
  { value: "ca-central-2", name: "Canada (Central - Preview)" },
  { value: "eu-central-2", name: "Europe (Zurich - Preview)" },
  { value: "eu-north-2", name: "Europe (Oslo - Preview)" },
  { value: "eu-west-4", name: "Europe (Madrid - Preview)" },
  { value: "me-east-1", name: "Middle East (UAE - Preview)" },
  { value: "sa-east-2", name: "South America (Santiago - Preview)" }
];

const groupByDimensions = [
  "BILLING_ENTITY",
  "CACHE_ENGINE",
  "DATABASE_ENGINE",
  "DEPLOYMENT_OPTION",
  "INSTANCE_TYPE",
  "INSTANCE_TYPE_FAMILY",
  "INVOICING_ENTITY",
  "LEGAL_ENTITY_NAME",
  "LINKED_ACCOUNT",
  "OPERATION",
  "OPERATING_SYSTEM",
  "PLATFORM",
  "PURCHASE_TYPE",
  "REGION",
  "RECORD_TYPE",
  "RESERVATION_ID",
  "SAVINGS_PLAN_ARN",
  "SAVINGS_PLANS_TYPE",
  "SERVICE",
  "TENANCY",
  "USAGE_TYPE"
];
const groupByTags = [
  "Always On",
  "Customer",
  "Deletion_Hold",
  "Dept",
  "Email List",
  "Name",
  "Never Delete",
  "Owner",
  "PM",
  "Project Number",
  "Project_Number"
];

// Populate dropdowns using JavaScript
function populateDropdown(id, values) {
  const dropdown = document.getElementById(id);


  // Add an empty option for the default selection
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Select an option";
  dropdown.appendChild(emptyOption);

  values.forEach(value => {
    const option = document.createElement('option');
    option.value = typeof value === 'string' ? value : value.value;
    option.text = typeof value === 'string' ? value : value.name;
    dropdown.appendChild(option);
  });

}

// Initialize dropdowns
populateDropdown('tag', tags);
populateDropdown('linked-account', linkedAccounts);
populateDropdown('region', regions);
populateDropdown('group-by-dimension', groupByDimensions);
populateDropdown('group-by-tag', groupByTags);

populateDropdown('group-by-dimension-2', groupByDimensions);
populateDropdown('group-by-tag-2', groupByTags);
