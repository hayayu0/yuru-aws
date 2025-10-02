
export interface AWSService {
  buttonGroup: string;
  buttonText?: string;
  isFrame?: boolean;
  zLayer?: number;
  displayIcon?: boolean;
}

export interface AWSServices {
  [key: string]: AWSService;
}

export const awsServices: AWSServices = {
  EC2: { buttonGroup: "Frequent" },
  S3: { buttonGroup: "Frequent" },
  ELB: { buttonGroup: "Frequent", buttonText: "ALB/NLB" },
  RDS: { buttonGroup: "Frequent" },
  Users: { buttonGroup: "Frequent", buttonText: "ユーザー" },
  Internet: { buttonGroup: "Frequent", buttonText: "インターネット" },
  InternetGW: { buttonGroup: "Frequent", buttonText: "Internet GW" },
  OtherService: { buttonGroup: "Frequent", buttonText: "その他" },
  Account: { buttonGroup: "Frame", buttonText: "アカウント", isFrame: true, zLayer: 20 },
  Region: { buttonGroup: "Frame", buttonText: "リージョン", isFrame: true, zLayer: 40 },
  AZ: { buttonGroup: "Frame", isFrame: true, zLayer: 60, displayIcon: false},
  VPC: { buttonGroup: "Frame", isFrame: true, zLayer: 60 },
  PublicSubnet: { buttonGroup: "Frame", buttonText: "Public Subnet", isFrame: true, zLayer: 80,  },
  PrivateSubnet: { buttonGroup: "Frame", buttonText: "Private Subnet", isFrame: true, zLayer: 80,  },
  AutoScaling: { buttonGroup: "Frame", isFrame: true, zLayer: 90, buttonText: "Auto Scaling Group" },
  StepFunctions: { buttonGroup: "Frame", isFrame: true, zLayer: 60, buttonText: "Step Functions" },
  Building: { buttonGroup: "Frame", buttonText: "データセンター", isFrame: true, zLayer: 20,  },
  GeneralGroup: { buttonGroup: "Frame", buttonText: "グループ", isFrame: true, displayIcon: false, zLayer: 90,  },
  NATGW: { buttonGroup: "Network", buttonText: "NAT GW" },
  VPCEndpoint: { buttonGroup: "Network", buttonText: "VPC Endpoint" },
  Route53: { buttonGroup: "Network" },
  WAF: { buttonGroup: "Network" },
  NetworkFirewall: { buttonGroup: "Network", buttonText: "Network Firewall" },
  SitetoSiteVPN: { buttonGroup: "Network", buttonText: "Site-to-Site VPN" },
  DirectConnect: { buttonGroup: "Network", buttonText: "Direct Connect" },
  TransitGW: { buttonGroup: "Network", buttonText: "Transit GW" },
  Client: { buttonGroup: "general", buttonText: "PC端末" },
  Server: { buttonGroup: "general", buttonText: "サーバー" },
  Mobile: { buttonGroup: "general", buttonText: "モバイル端末" },
  Storage: { buttonGroup: "general", buttonText: "ストレージ" },
  Files: { buttonGroup: "general", buttonText: "ファイル" },
  Folders: { buttonGroup: "general", buttonText: "フォルダ" },
  Mail: { buttonGroup: "general", buttonText: "メール" },
  Repeat: { buttonGroup: "general", buttonText: "繰り返し" },
  Search: { buttonGroup: "general", buttonText: "検索" },
  Certification: { buttonGroup: "general", buttonText: "認証" },
  TextBox: { buttonGroup: "general", buttonText: "", displayIcon: false },
  CloudWatch: { buttonGroup: "Management" },
  SystemsManager: { buttonGroup: "Management" },
  SNS: { buttonGroup: "Management" },
  EventBridge: { buttonGroup: "Management" },
  CloudFormation: { buttonGroup: "Management" },
  SQS: { buttonGroup: "Serverless" },
  Lambda: { buttonGroup: "Serverless" },
  DynamoDB: { buttonGroup: "Serverless", buttonText: "Dynamo DB" },
  APIGateway: { buttonGroup: "Serverless", buttonText: "API Gateway" },
  CloudFront: { buttonGroup: "Serverless" },
  SES: { buttonGroup: "Serverless" },
  Cognito: { buttonGroup: "Security" },
  SecretsManager: { buttonGroup: "Security" },
  KMS: { buttonGroup: "Security" },
  CloudTrail: { buttonGroup: "Security" },
  GuardDuty: { buttonGroup: "Security" },
  IAMRole: { buttonGroup: "Security", buttonText: "IAMロール" },
  IdentityCenter: { buttonGroup: "Security", buttonText: "Identity Center" },
  FSx: { buttonGroup: "Storage / Data", buttonText: "FSx" },
  EFS: { buttonGroup: "Storage / Data" },
  Backup: { buttonGroup: "Storage / Data" },
  StorageGateway: { buttonGroup: "Storage / Data" },
  ECR: { buttonGroup: "Storage / Data" },
  Snapshot: { buttonGroup: "Storage / Data" },
  Glue: { buttonGroup: "Analytics" },
  EMR: { buttonGroup: "Analytics" },
  OpenSearch: { buttonGroup: "Analytics" },
  LakeFormation: { buttonGroup: "Analytics" },
  Redshift: { buttonGroup: "Managed Instance" },
  ElastiCache: { buttonGroup: "Managed Instance" },
  ManagedAD: { buttonGroup: "Managed Instance", buttonText: "Managed MS AD" },
  ECS: { buttonGroup: "Managed Instance" },
  EKS: { buttonGroup: "Managed Instance" },
  BedRock: { buttonGroup: "AI" },
  SageMaker: { buttonGroup: "AI", buttonText: "SageMaker"  },
  CodePipeline: { buttonGroup: "Code" },
  CodeBuild: { buttonGroup: "Code" },
  CodeDeploy: { buttonGroup: "Code" },
  Organizations: { buttonGroup: "Others" },
  Amplify: { buttonGroup: "Others" },
  MGN: { buttonGroup: "Others" },
  DMS: { buttonGroup: "Others" },
  AppStream: { buttonGroup: "Others" },
  Workspaces: { buttonGroup: "Others" },
  DataFirehose: { buttonGroup: "Others", buttonText: "Data Firehose" },
  QuickSight: { buttonGroup: "Others" },
  Athena: { buttonGroup: "Others" },
  AMI: { buttonGroup: "Others" },
};

export const groupOrder = [
  "Frequent",
  "Frame",
  "Network",
  "general",
  "Management",
  "Serverless",
  "Managed Instance",
  "Storage / Data",
  "Analytics",
  "Security",
  "AI",
  "Code",
  "Others",
];

export const elementSize = {
  defaultNodeWidth: 48,
  defaultNodeHeight: 48,
  frameMinWidth: 80,
  frameMinHeight: 60,
};

export const getIconPath = (kind: string): string => {
  return `aws-icons/${kind}.png`;
};
