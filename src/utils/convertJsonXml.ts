import type { Node, Frame, Edge } from "../types";

const ICON_SIZE = 48;
const EDGE_STROKE_WIDTH = 1.5;
const ID_PREFIX = "ConvertFrom_YuruAws-";
const POINTS_IN_STYLE = "points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;"

const COLOR_GROUP = {
  "EDGE_COLOR": "#545B64",
  "COMPUTE": "#F58536",
  "SECURITY": "#DD344C",
  "DATABASE": "#C925D1",
  "DATABASE_OLD": "#3F48CC",
  "NETWORKING": "#8C4FFF",
  "ANALYTICS": "#8C4FFF",
  "MACHINELEARNING": "#01A88D",
  "DEVELOPERTOOLS": "#FFB70A",
  "GENERAL": "#506070",
  "GENERALDARK": "#232F3E",
  "MANAGEMENT": "#E7157B",
  "STORAGE": "#7AA116"
}

type ElementType = 'resource' | 'custom' | 'text';

interface ElementAttributes {
  type: ElementType;
  color?: string;
  icon?: string;
  resIcon?: string;
  shape?: string;
  fillColor?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  pointerEvents?: boolean;
  includePoints?: boolean;
  style?: string;
}

const resource = (color: string, icon: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes => ({
  type: 'resource',
  color,
  icon,
  ...overrides
});

const custom = (color: string, shape: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes => ({
  type: 'custom',
  color,
  shape,
  ...overrides
});

const generalIcon = (shape: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes =>
  custom(COLOR_GROUP.GENERALDARK, shape, overrides);

const textElement = (style: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes => ({
  type: 'text',
  style: style.endsWith(';') ? style : `${style};`,
  ...overrides
});

const ELEMENT_ATTRIBUTES: Record<string, ElementAttributes> = {
  WAF: resource(COLOR_GROUP.SECURITY, 'waf'),
  EC2: resource(COLOR_GROUP.COMPUTE, 'ec2'),
  ECS: resource(COLOR_GROUP.COMPUTE, 'ecs'),
  EKS: resource(COLOR_GROUP.COMPUTE, 'eks'),
  Lambda: resource(COLOR_GROUP.COMPUTE, 'lambda'),
  AMI: resource(COLOR_GROUP.COMPUTE, 'ami'),
  AppStream: resource(COLOR_GROUP.MACHINELEARNING, 'appstream_20'),
  ECR: resource(COLOR_GROUP.COMPUTE, 'ecr'),
  S3: resource(COLOR_GROUP.STORAGE, 's3'),
  EFS: resource(COLOR_GROUP.STORAGE, 'elastic_file_system'),
  FSx: resource(COLOR_GROUP.STORAGE, 'fsx'),
  Backup: resource(COLOR_GROUP.STORAGE, 'backup'),
  StorageGateway: resource(COLOR_GROUP.STORAGE, 'storage_gateway'),
  RDS: resource(COLOR_GROUP.DATABASE_OLD, 'rds'),
  DynamoDB: resource(COLOR_GROUP.DATABASE, 'dynamodb'),
  Redshift: resource(COLOR_GROUP.DATABASE, 'redshift'),
  ElastiCache: resource(COLOR_GROUP.DATABASE, 'elasticache'),
  ELB: resource(COLOR_GROUP.NETWORKING, 'elastic_load_balancing'),
  CloudFront: resource(COLOR_GROUP.NETWORKING, 'cloudfront'),
  Route53: resource(COLOR_GROUP.NETWORKING, 'route_53'),
  InternetGW: resource(COLOR_GROUP.NETWORKING, 'internet_gateway'),
  DirectConnect: resource(COLOR_GROUP.NETWORKING, 'direct_connect'),
  SitetoSiteVPN: resource(COLOR_GROUP.NETWORKING, 'site_to_site_vpn'),
  APIGateway: resource(COLOR_GROUP.NETWORKING, 'api_gateway'),
  Athena: resource(COLOR_GROUP.NETWORKING, 'athena'),
  QuickSight: resource(COLOR_GROUP.NETWORKING, 'quicksight'),
  DataFirehose: resource(COLOR_GROUP.NETWORKING, 'kinesis_data_firehose'),
  DataStream: resource(COLOR_GROUP.COMPUTE, 'kinesis_data_streams'),
  BedRock: resource(COLOR_GROUP.MACHINELEARNING, 'bedrock'),
  SageMaker: resource(COLOR_GROUP.MACHINELEARNING, 'sagemaker'),
  Cognito: resource(COLOR_GROUP.SECURITY, 'cognito'),
  KMS: resource(COLOR_GROUP.SECURITY, 'key_management_service'),
  SecretsManager: resource(COLOR_GROUP.SECURITY, 'secrets_manager'),
  GuardDuty: resource(COLOR_GROUP.SECURITY, 'guardduty'),
  IdentityCenter: resource(COLOR_GROUP.SECURITY, 'single_sign_on'),
  NetworkFirewall: resource(COLOR_GROUP.SECURITY, 'network_firewall'),
  CloudWatch: resource(COLOR_GROUP.MANAGEMENT, 'cloudwatch'),
  SystemsManager: resource(COLOR_GROUP.MANAGEMENT, 'systems_manager'),
  CloudFormation: resource(COLOR_GROUP.MANAGEMENT, 'cloudformation'),
  SQS: resource(COLOR_GROUP.MANAGEMENT, 'sqs'),
  SNS: resource(COLOR_GROUP.MANAGEMENT, 'sns'),
  EventBridge: resource(COLOR_GROUP.MANAGEMENT, 'eventbridge'),
  SES: resource(COLOR_GROUP.MANAGEMENT, 'simple_email_service'),
  CodeDeploy: resource(COLOR_GROUP.DATABASE, 'codedeploy'),
  CodeBuild: resource(COLOR_GROUP.DATABASE, 'codebuild'),
  CodePipeline: resource(COLOR_GROUP.DATABASE, 'codepipeline'),
  MGN: resource(COLOR_GROUP.MACHINELEARNING, 'cloudendure_migration'),
  DMS: resource(COLOR_GROUP.DATABASE, 'database_migration_service'),
  Workspaces: resource(COLOR_GROUP.MACHINELEARNING, 'workspaces_family'),
  Amplify: resource(COLOR_GROUP.SECURITY, 'amplify'),
  Organizations: resource(COLOR_GROUP.SECURITY, 'organizations'),
  CloudTrail: resource(COLOR_GROUP.MANAGEMENT, 'cloudtrail'),
  SingleSignOn: resource(COLOR_GROUP.SECURITY, 'single_sign_on'),
  TransitGW: resource(COLOR_GROUP.NETWORKING, 'transit_gateway'),
  OtherService: resource(COLOR_GROUP.GENERAL, 'general', { pointerEvents: true }),
  Mobile: resource(COLOR_GROUP.GENERALDARK, 'mobile_client', { fillColor: '#ffffff', strokeColor: COLOR_GROUP.GENERALDARK, includePoints: false, pointerEvents: false }),
  Snapshot: custom(COLOR_GROUP.STORAGE, 'mxgraph.aws4.snapshot', { strokeColor: 'none' }),
  ManagedAD: custom(COLOR_GROUP.SECURITY, 'mxgraph.aws4.managed_ms_ad', { strokeColor: 'none' }),
  IAMRole: custom(COLOR_GROUP.SECURITY, 'mxgraph.aws4.role', { strokeColor: 'none' }),
  NATGW: custom(COLOR_GROUP.NETWORKING, 'mxgraph.aws4.nat_gateway', { strokeColor: 'none' }),
  VPCEndpoint: custom(COLOR_GROUP.NETWORKING, 'mxgraph.aws4.endpoints', { strokeColor: 'none' }),
  Users: generalIcon('mxgraph.aws4.illustration_users', { strokeColor: '#ffffff', includePoints: true, pointerEvents: false }),
  Internet: generalIcon('mxgraph.aws4.internet', { strokeColor: '#ffffff', includePoints: true, pointerEvents: false }),
  Client: generalIcon('mxgraph.aws4.client'),
  Server: generalIcon('mxgraph.aws4.traditional_server'),
  Mail: generalIcon('mxgraph.aws4.email_2'),
  Repeat: generalIcon('mxgraph.aws4.recover'),
  Certification: generalIcon('mxgraph.aws4.credentials'),
  Search: generalIcon('mxgraph.aws4.magnifying_glass_2'),
  Files: generalIcon('mxgraph.aws4.documents3'),
  Disk: generalIcon('mxgraph.aws4.generic_database', { width: 59, height: 78 }),
  Storage: generalIcon('mxgraph.aws4.generic_database'),
  Folder: generalIcon('mxgraph.aws4.folders', { width: 78, height: 71 }),
  Folders: generalIcon('mxgraph.aws4.folders'),
  TextBox: textElement('text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;')
};

function buildElementStyle(attrs: ElementAttributes): string {
  if (attrs.type === 'text') {
    return attrs.style ?? 'text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;';
  }
  if (attrs.style) {
    return attrs.style.endsWith(';') ? attrs.style : `${attrs.style};`;
  }
  const includePoints = attrs.includePoints ?? (attrs.type === 'resource');
  let style = 'sketch=0;';
  if (includePoints) {
    style += POINTS_IN_STYLE;
  } else {
    style += 'outlineConnect=0;';
  }
  style += `fontColor=${COLOR_GROUP.GENERALDARK};gradientColor=none;`;
  const fillColor = attrs.fillColor ?? attrs.color ?? COLOR_GROUP.GENERALDARK;
  style += `fillColor=${fillColor};`;
  const defaultStroke = attrs.type === 'resource' ? '#ffffff' : 'none';
  style += `strokeColor=${attrs.strokeColor ?? defaultStroke};dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;`;
  const pointerEventsDefault = attrs.type === 'resource' ? false : true;
  if (attrs.pointerEvents ?? pointerEventsDefault) {
    style += 'pointerEvents=1;';
  }
  const shape = attrs.shape ?? (attrs.type === 'resource' ? 'mxgraph.aws4.resourceIcon' : undefined);
  style += (shape) ? `shape=${shape};` : '';
  const resIcon = attrs.resIcon ?? (attrs.icon ? `mxgraph.aws4.${attrs.icon}` : undefined);
  style += (resIcon) ? `resIcon=${resIcon};` : '';
  return style;
}

const FRAME_COLORS: Record<string, { strokeColor: string; fillColor: string; fontColor: string }> = {
  "Region": { strokeColor: "#00A4A6", fillColor: "none", fontColor: "#147EBA" },
  "VPC": { strokeColor: COLOR_GROUP.NETWORKING, fillColor: "none", fontColor: "#AAB7B8" },
  "AZ": { strokeColor: "#147EBA", fillColor: "none", fontColor: "#147EBA" },
  "PrivateSubnet": { strokeColor: "#E6F6F7", fillColor: "#E6F6F7", fontColor: "#147EBA" },
  "PublicSubnet": { strokeColor: "#F2F6E8", fillColor: "#F2F6E8", fontColor: "#248814" },
  "Building": { strokeColor: "#7D8998", fillColor: "none", fontColor: COLOR_GROUP.GENERAL },
  "GeneralGroup": { strokeColor: COLOR_GROUP.GENERAL, fillColor: "none", fontColor: COLOR_GROUP.GENERAL },
  "AutoScaling": { strokeColor: COLOR_GROUP.COMPUTE, fillColor: "none", fontColor: COLOR_GROUP.COMPUTE },
  "Account": { strokeColor: COLOR_GROUP.GENERALDARK, fillColor: "none", fontColor: COLOR_GROUP.GENERALDARK }
};


const FRAME_TO_GROUP_MAPPING: Record<string, string> = {
  "Account": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt",
  "Region": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region",
  "VPC": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc2",
  "AZ": "",
  "PublicSubnet": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group",
  "PrivateSubnet": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group",
  "Building": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_corporate_data_center",
  "AutoScaling": "shape=mxgraph.aws4.groupCenter;grIcon=mxgraph.aws4.group_auto_scaling_group",
  "GeneralGroup": "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_generic"
};

interface YuruAwsData {
  nodes: Record<string, unknown>[];
  frames: Record<string, unknown>[];
  edges: Edge[];
}

export function convertJsonToXml(data: YuruAwsData): string {
  const { nodes, frames, edges } = data;

  // XMLヘッダー
  const xmlHeader = `<mxfile host="app.diagrams.net" version="28.2.5">
  <diagram name="AWS Diagram" id="aws-diagram">
    <mxGraphModel dx="892" dy="678" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />`;
  const FRAME_BASE_STYLE = "points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;";

  const frameCells = frames.map((frame) => {
    const frameData = frame as unknown as Frame;
    const id = `${ID_PREFIX}${frame.id}`;
    const label = frameData.label || frameData.kind;
  
    // 特定のフレームは完全カスタムスタイル
    if (frameData.kind === "PublicSubnet") {
      return `        <mxCell id="${id}" value="${escapeXml(label)}" style="shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#7AA116;fillColor=#F2F6E8;verticalAlign=top;align=left;spacingLeft=30;fontColor=#248814;dashed=0;" vertex="1" parent="1">
          <mxGeometry x="${frameData.x}" y="${frameData.y}" width="${frameData.width}" height="${frameData.height}" as="geometry" />
        </mxCell>`;
    }
    
    if (frameData.kind === "PrivateSubnet") {
      return `        <mxCell id="${id}" value="${escapeXml(label)}" style="shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#00A4A6;fillColor=#E6F6F7;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=0;" vertex="1" parent="1">
          <mxGeometry x="${frameData.x}" y="${frameData.y}" width="${frameData.width}" height="${frameData.height}" as="geometry" />
        </mxCell>`;
    }
    
    if (frameData.kind === "AutoScaling") {
      return `        <mxCell id="${id}" value="${escapeXml(label)}" style="${FRAME_BASE_STYLE}shape=mxgraph.aws4.groupCenter;grIcon=mxgraph.aws4.group_auto_scaling_group;grStroke=1;strokeColor=#D86613;fillColor=none;verticalAlign=top;align=center;fontColor=#D86613;dashed=1;spacingTop=25;" vertex="1" parent="1">
          <mxGeometry x="${frameData.x}" y="${frameData.y}" width="${frameData.width}" height="${frameData.height}" as="geometry" />
        </mxCell>`;
    }
    
    if (frameData.kind === "StepFunctions") {
      return `        <mxCell id="${id}" value="${escapeXml(label)}" style="${FRAME_BASE_STYLE}shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_step_functions_workflow;strokeColor=#CD2264;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#CD2264;dashed=0;" vertex="1" parent="1">
          <mxGeometry x="${frameData.x}" y="${frameData.y}" width="${frameData.width}" height="${frameData.height}" as="geometry" />
        </mxCell>`;
    }
    
    const shape = FRAME_TO_GROUP_MAPPING[frameData.kind] || FRAME_TO_GROUP_MAPPING["GeneralGroup"];
    const colors = FRAME_COLORS[frameData.kind] || FRAME_COLORS["GeneralGroup"];
    const dashed = frameData.kind === "Region" || frameData.kind === "AZ" || frameData.kind === "GeneralGroup" ? "1" : "0";
    const align = frameData.kind === "AZ" ? "center" : "left";
    const spacingLeft = frameData.kind === "AZ" ? "0" : "30";
    
    const styleShape = shape ? `${shape};` : "";
    
    return `        <mxCell id="${id}" value="${escapeXml(label)}" style="${FRAME_BASE_STYLE}${styleShape}strokeColor=${colors!.strokeColor};fillColor=${colors!.fillColor};verticalAlign=top;align=${align};spacingLeft=${spacingLeft};fontColor=${colors!.fontColor};dashed=${dashed};" vertex="1" parent="1">
          <mxGeometry x="${frameData.x}" y="${frameData.y}" width="${frameData.width}" height="${frameData.height}" as="geometry" />
        </mxCell>`;
  });
  // ノード変換
  const nodeCells = nodes.map((node) => {
    const nodeData = node as unknown as Node;
    const id = `${ID_PREFIX}${nodeData.id}`;
    const label = nodeData.label || nodeData.kind;
    const attributes = ELEMENT_ATTRIBUTES[nodeData.kind];
    if (!attributes) {
      console.warn(`Unknown icon: ${nodeData.kind}`);
      return `        <mxCell id="${id}" value="${escapeXml(label)}" style="sketch=0;${POINTS_IN_STYLE}fontColor=${COLOR_GROUP.GENERALDARK};fillColor=#E7157B;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.organizations;" vertex="1" parent="1">
          <mxGeometry x="${nodeData.x}" y="${nodeData.y}" width="${ICON_SIZE}" height="${ICON_SIZE}" as="geometry" />
        </mxCell>`;
    }
    const width = attributes.width ?? ICON_SIZE;
    const height = attributes.height ?? ICON_SIZE;
    const style = buildElementStyle(attributes);
    return `        <mxCell id="${id}" value="${escapeXml(label)}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${nodeData.x}" y="${nodeData.y}" width="${width}" height="${height}" as="geometry" />
        </mxCell>`;
  });
  // エッジ変換
  const edgeCells = edges.map(edge => {
    const id = `${ID_PREFIX}${edge.id}`;
    const sourceId = `${ID_PREFIX}${edge.from}`;
    const targetId = `${ID_PREFIX}${edge.to}`;
    
    return `        <mxCell id="${id}" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;elbow=vertical;startArrow=none;endFill=1;strokeColor=${COLOR_GROUP.EDGE_COLOR};strokeWidth=${EDGE_STROKE_WIDTH};rounded=0;" edge="1" parent="1" source="${sourceId}" target="${targetId}">
          <mxGeometry width="100" relative="1" as="geometry">
            <mxPoint x="0" y="0" as="sourcePoint" />
            <mxPoint x="100" y="0" as="targetPoint" />
          </mxGeometry>
        </mxCell>`;
  });
  // XMLフッター
  const xmlFooter = `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
  return [
    xmlHeader,
    ...frameCells,
    ...nodeCells,
    ...edgeCells,
    xmlFooter
  ].join('\n');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
