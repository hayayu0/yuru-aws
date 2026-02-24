import type { AppState, Edge, Frame, Node } from "../types";
import { elementSize, getDefaultLabelForKind } from "../types/aws";

const EDGE_STROKE_WIDTH = 1.5;
const CLIPBOARD_ID_START = 1001;
const POINTS_IN_STYLE = "points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;";
const FRAME_BASE_STYLE = "points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;";

const COLOR_GROUP = {
  EDGE_COLOR: "#545B64",
  COMPUTE: "#F58536",
  SECURITY: "#DD344C",
  DATABASE: "#C925D1",
  DATABASE_OLD: "#3F48CC",
  NETWORKING: "#8C4FFF",
  MACHINELEARNING: "#01A88D",
  GENERAL: "#506070",
  GENERALDARK: "#232F3E",
  MANAGEMENT: "#E7157B",
  STORAGE: "#7AA116",
} as const;

type ElementType = "resource" | "custom" | "text";

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
  type: "resource",
  color,
  icon,
  ...overrides,
});

const custom = (color: string, shape: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes => ({
  type: "custom",
  color,
  shape,
  ...overrides,
});

const generalIcon = (shape: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes =>
  custom(COLOR_GROUP.GENERALDARK, shape, overrides);

const textElement = (style: string, overrides: Partial<ElementAttributes> = {}): ElementAttributes => ({
  type: "text",
  style: style.endsWith(";") ? style : `${style};`,
  ...overrides,
});

const ELEMENT_ATTRIBUTES: Record<string, ElementAttributes> = {
  WAF: resource(COLOR_GROUP.SECURITY, "waf"),
  EC2: resource(COLOR_GROUP.COMPUTE, "ec2"),
  ECS: resource(COLOR_GROUP.COMPUTE, "ecs"),
  EKS: resource(COLOR_GROUP.COMPUTE, "eks"),
  Lambda: resource(COLOR_GROUP.COMPUTE, "lambda"),
  AMI: resource(COLOR_GROUP.COMPUTE, "ami"),
  AppStream: resource(COLOR_GROUP.MACHINELEARNING, "appstream_20"),
  ECR: resource(COLOR_GROUP.COMPUTE, "ecr"),
  S3: resource(COLOR_GROUP.STORAGE, "s3"),
  EFS: resource(COLOR_GROUP.STORAGE, "elastic_file_system"),
  FSx: resource(COLOR_GROUP.STORAGE, "fsx"),
  Backup: resource(COLOR_GROUP.STORAGE, "backup"),
  StorageGateway: resource(COLOR_GROUP.STORAGE, "storage_gateway"),
  RDS: resource(COLOR_GROUP.DATABASE_OLD, "rds"),
  DynamoDB: resource(COLOR_GROUP.DATABASE, "dynamodb"),
  Redshift: resource(COLOR_GROUP.DATABASE, "redshift"),
  ElastiCache: resource(COLOR_GROUP.DATABASE, "elasticache"),
  ELB: resource(COLOR_GROUP.NETWORKING, "elastic_load_balancing"),
  CloudFront: resource(COLOR_GROUP.NETWORKING, "cloudfront"),
  Route53: resource(COLOR_GROUP.NETWORKING, "route_53"),
  InternetGW: resource(COLOR_GROUP.NETWORKING, "internet_gateway"),
  DirectConnect: resource(COLOR_GROUP.NETWORKING, "direct_connect"),
  SitetoSiteVPN: resource(COLOR_GROUP.NETWORKING, "site_to_site_vpn"),
  APIGateway: resource(COLOR_GROUP.NETWORKING, "api_gateway"),
  Athena: resource(COLOR_GROUP.NETWORKING, "athena"),
  QuickSight: resource(COLOR_GROUP.NETWORKING, "quicksight"),
  DataFirehose: resource(COLOR_GROUP.NETWORKING, "kinesis_data_firehose"),
  DataStream: resource(COLOR_GROUP.COMPUTE, "kinesis_data_streams"),
  BedRock: resource(COLOR_GROUP.MACHINELEARNING, "bedrock"),
  SageMaker: resource(COLOR_GROUP.MACHINELEARNING, "sagemaker"),
  Cognito: resource(COLOR_GROUP.SECURITY, "cognito"),
  KMS: resource(COLOR_GROUP.SECURITY, "key_management_service"),
  SecretsManager: resource(COLOR_GROUP.SECURITY, "secrets_manager"),
  GuardDuty: resource(COLOR_GROUP.SECURITY, "guardduty"),
  IdentityCenter: resource(COLOR_GROUP.SECURITY, "single_sign_on"),
  NetworkFirewall: resource(COLOR_GROUP.SECURITY, "network_firewall"),
  CloudWatch: resource(COLOR_GROUP.MANAGEMENT, "cloudwatch"),
  SystemsManager: resource(COLOR_GROUP.MANAGEMENT, "systems_manager"),
  CloudFormation: resource(COLOR_GROUP.MANAGEMENT, "cloudformation"),
  SQS: resource(COLOR_GROUP.MANAGEMENT, "sqs"),
  SNS: resource(COLOR_GROUP.MANAGEMENT, "sns"),
  EventBridge: resource(COLOR_GROUP.MANAGEMENT, "eventbridge"),
  SES: resource(COLOR_GROUP.MANAGEMENT, "simple_email_service"),
  CodeDeploy: resource(COLOR_GROUP.DATABASE, "codedeploy"),
  CodeBuild: resource(COLOR_GROUP.DATABASE, "codebuild"),
  CodePipeline: resource(COLOR_GROUP.DATABASE, "codepipeline"),
  MGN: resource(COLOR_GROUP.MACHINELEARNING, "cloudendure_migration"),
  DMS: resource(COLOR_GROUP.DATABASE, "database_migration_service"),
  Workspaces: resource(COLOR_GROUP.MACHINELEARNING, "workspaces_family"),
  Amplify: resource(COLOR_GROUP.SECURITY, "amplify"),
  Organizations: resource(COLOR_GROUP.SECURITY, "organizations"),
  CloudTrail: resource(COLOR_GROUP.MANAGEMENT, "cloudtrail"),
  SingleSignOn: resource(COLOR_GROUP.SECURITY, "single_sign_on"),
  TransitGW: resource(COLOR_GROUP.NETWORKING, "transit_gateway"),
  OtherService: resource(COLOR_GROUP.GENERAL, "general", { pointerEvents: true }),
  Mobile: resource(COLOR_GROUP.GENERALDARK, "mobile_client", {
    fillColor: "#ffffff",
    strokeColor: COLOR_GROUP.GENERALDARK,
    includePoints: false,
    pointerEvents: false,
  }),
  Snapshot: custom(COLOR_GROUP.STORAGE, "mxgraph.aws4.snapshot", { strokeColor: "none" }),
  ManagedAD: custom(COLOR_GROUP.SECURITY, "mxgraph.aws4.managed_ms_ad", { strokeColor: "none" }),
  IAMRole: custom(COLOR_GROUP.SECURITY, "mxgraph.aws4.role", { strokeColor: "none" }),
  NATGW: custom(COLOR_GROUP.NETWORKING, "mxgraph.aws4.nat_gateway", { strokeColor: "none" }),
  VPCEndpoint: custom(COLOR_GROUP.NETWORKING, "mxgraph.aws4.endpoints", { strokeColor: "none" }),
  Users: generalIcon("mxgraph.aws4.illustration_users", { strokeColor: "#ffffff", includePoints: true, pointerEvents: false }),
  Internet: generalIcon("mxgraph.aws4.internet", { strokeColor: "#ffffff", includePoints: true, pointerEvents: false }),
  Client: generalIcon("mxgraph.aws4.client"),
  Server: generalIcon("mxgraph.aws4.traditional_server"),
  Mail: generalIcon("mxgraph.aws4.email_2"),
  Repeat: generalIcon("mxgraph.aws4.recover"),
  Certification: generalIcon("mxgraph.aws4.credentials"),
  Search: generalIcon("mxgraph.aws4.magnifying_glass_2"),
  Files: generalIcon("mxgraph.aws4.documents3"),
  Disk: generalIcon("mxgraph.aws4.generic_database", { width: 59, height: 78 }),
  Storage: generalIcon("mxgraph.aws4.generic_database"),
  Folder: generalIcon("mxgraph.aws4.folders", { width: 78, height: 71 }),
  Folders: generalIcon("mxgraph.aws4.folders"),
  TextBox: textElement("text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;"),
};

const FRAME_COLORS: Record<string, { strokeColor: string; fillColor: string; fontColor: string }> = {
  Region: { strokeColor: "#00A4A6", fillColor: "none", fontColor: "#147EBA" },
  VPC: { strokeColor: COLOR_GROUP.NETWORKING, fillColor: "none", fontColor: "#AAB7B8" },
  AZ: { strokeColor: "#147EBA", fillColor: "none", fontColor: "#147EBA" },
  PrivateSubnet: { strokeColor: "#E6F6F7", fillColor: "#E6F6F7", fontColor: "#147EBA" },
  PublicSubnet: { strokeColor: "#F2F6E8", fillColor: "#F2F6E8", fontColor: "#248814" },
  Building: { strokeColor: "#7D8998", fillColor: "none", fontColor: COLOR_GROUP.GENERAL },
  GeneralGroup: { strokeColor: COLOR_GROUP.GENERAL, fillColor: "none", fontColor: COLOR_GROUP.GENERAL },
  AutoScaling: { strokeColor: COLOR_GROUP.COMPUTE, fillColor: "none", fontColor: COLOR_GROUP.COMPUTE },
  Account: { strokeColor: COLOR_GROUP.GENERALDARK, fillColor: "none", fontColor: COLOR_GROUP.GENERALDARK },
};
const DEFAULT_FRAME_COLOR = { strokeColor: COLOR_GROUP.GENERAL, fillColor: "none", fontColor: COLOR_GROUP.GENERAL };

const FRAME_TO_GROUP_MAPPING: Record<string, string> = {
  Account: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt",
  Region: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region",
  VPC: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc2",
  AZ: "",
  PublicSubnet: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group",
  PrivateSubnet: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group",
  Building: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_corporate_data_center",
  AutoScaling: "shape=mxgraph.aws4.groupCenter;grIcon=mxgraph.aws4.group_auto_scaling_group",
  GeneralGroup: "shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_generic",
};

const FRAME_GRICON_TO_KIND: Record<string, string> = {
  "mxgraph.aws4.group_aws_cloud_alt": "Account",
  "mxgraph.aws4.group_region": "Region",
  "mxgraph.aws4.group_vpc2": "VPC",
  "mxgraph.aws4.group_corporate_data_center": "Building",
  "mxgraph.aws4.group_auto_scaling_group": "AutoScaling",
  "mxgraph.aws4.group_generic": "GeneralGroup",
  "mxgraph.aws4.group_aws_step_functions_workflow": "StepFunctions",
};

const RES_ICON_TO_KIND: Record<string, string> = {};
const SHAPE_TO_KIND: Record<string, string> = {};

Object.entries(ELEMENT_ATTRIBUTES).forEach(([kind, attrs]) => {
  if (attrs.icon) {
    RES_ICON_TO_KIND[`mxgraph.aws4.${attrs.icon}`] = kind;
  }
  if (attrs.resIcon) {
    RES_ICON_TO_KIND[attrs.resIcon] = kind;
  }
  if (attrs.shape) {
    SHAPE_TO_KIND[attrs.shape] = kind;
  }
});

const escapeXml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const parseStyleMap = (style: string): Map<string, string> => {
  const map = new Map<string, string>();
  style.split(";").forEach((chunk) => {
    if (!chunk) return;
    const eqIndex = chunk.indexOf("=");
    if (eqIndex === -1) {
      map.set(chunk, "");
      return;
    }
    const key = chunk.slice(0, eqIndex);
    const value = chunk.slice(eqIndex + 1);
    map.set(key, value);
  });
  return map;
};

function buildElementStyle(attrs: ElementAttributes): string {
  if (attrs.type === "text") {
    return attrs.style ?? "text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;";
  }
  if (attrs.style) {
    return attrs.style.endsWith(";") ? attrs.style : `${attrs.style};`;
  }
  const includePoints = attrs.includePoints ?? (attrs.type === "resource");
  let style = "sketch=0;";
  style += includePoints ? POINTS_IN_STYLE : "outlineConnect=0;";
  style += `fontColor=${COLOR_GROUP.GENERALDARK};gradientColor=none;`;
  const fillColor = attrs.fillColor ?? attrs.color ?? COLOR_GROUP.GENERALDARK;
  style += `fillColor=${fillColor};`;
  const defaultStroke = attrs.type === "resource" ? "#ffffff" : "none";
  style += `strokeColor=${attrs.strokeColor ?? defaultStroke};dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;`;
  const pointerEventsDefault = attrs.type === "resource" ? false : true;
  if (attrs.pointerEvents ?? pointerEventsDefault) {
    style += "pointerEvents=1;";
  }
  const shape = attrs.shape ?? (attrs.type === "resource" ? "mxgraph.aws4.resourceIcon" : undefined);
  if (shape) {
    style += `shape=${shape};`;
  }
  const resIcon = attrs.resIcon ?? (attrs.icon ? `mxgraph.aws4.${attrs.icon}` : undefined);
  if (resIcon) {
    style += `resIcon=${resIcon};`;
  }
  return style;
}

export const buildMxNodeCell = (node: Node, idFormatter?: IdFormatter): string => {
  const label = node.label || getDefaultLabelForKind(node.kind);
  const attrs = ELEMENT_ATTRIBUTES[node.kind];
  const fallbackStyle = `sketch=0;${POINTS_IN_STYLE}fontColor=${COLOR_GROUP.GENERALDARK};fillColor=#E7157B;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.organizations;`;
  const style = attrs ? buildElementStyle(attrs) : fallbackStyle;
  const width = attrs?.width ?? elementSize.defaultNodeWidth;
  const height = attrs?.height ?? elementSize.defaultNodeHeight;
  const id = idFormatter ? idFormatter(node.id) : String(node.id);
  return `<mxCell id="${id}" parent="1" style="${style}" value="${escapeXml(label)}" vertex="1"><mxGeometry x="${node.x}" y="${node.y}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
};

export const buildMxFrameCell = (frame: Frame, idFormatter?: IdFormatter): string => {
  const label = frame.label || getDefaultLabelForKind(frame.kind);
  const id = idFormatter ? idFormatter(frame.id) : String(frame.id);
  if (frame.kind === "PublicSubnet") {
    return `<mxCell id="${id}" value="${escapeXml(label)}" style="shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#7AA116;fillColor=#F2F6E8;verticalAlign=top;align=left;spacingLeft=30;fontColor=#248814;dashed=0;" vertex="1" parent="1"><mxGeometry x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" as="geometry"/></mxCell>`;
  }
  if (frame.kind === "PrivateSubnet") {
    return `<mxCell id="${id}" value="${escapeXml(label)}" style="shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#00A4A6;fillColor=#E6F6F7;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=0;" vertex="1" parent="1"><mxGeometry x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" as="geometry"/></mxCell>`;
  }
  if (frame.kind === "AutoScaling") {
    return `<mxCell id="${id}" value="${escapeXml(label)}" style="${FRAME_BASE_STYLE}shape=mxgraph.aws4.groupCenter;grIcon=mxgraph.aws4.group_auto_scaling_group;grStroke=1;strokeColor=#D86613;fillColor=none;verticalAlign=top;align=center;fontColor=#D86613;dashed=1;spacingTop=25;" vertex="1" parent="1"><mxGeometry x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" as="geometry"/></mxCell>`;
  }
  if (frame.kind === "StepFunctions") {
    return `<mxCell id="${id}" value="${escapeXml(label)}" style="${FRAME_BASE_STYLE}shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_step_functions_workflow;strokeColor=#CD2264;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#CD2264;dashed=0;" vertex="1" parent="1"><mxGeometry x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" as="geometry"/></mxCell>`;
  }
  const shape = FRAME_TO_GROUP_MAPPING[frame.kind] || FRAME_TO_GROUP_MAPPING.GeneralGroup;
  const colors = FRAME_COLORS[frame.kind] ?? FRAME_COLORS.GeneralGroup ?? DEFAULT_FRAME_COLOR;
  const dashed = frame.kind === "Region" || frame.kind === "AZ" || frame.kind === "GeneralGroup" ? "1" : "0";
  const align = frame.kind === "AZ" ? "center" : "left";
  const spacingLeft = frame.kind === "AZ" ? "0" : "30";
  const shapeStyle = shape ? `${shape};` : "";
  return `<mxCell id="${id}" value="${escapeXml(label)}" style="${FRAME_BASE_STYLE}${shapeStyle}strokeColor=${colors.strokeColor};fillColor=${colors.fillColor};verticalAlign=top;align=${align};spacingLeft=${spacingLeft};fontColor=${colors.fontColor};dashed=${dashed};" vertex="1" parent="1"><mxGeometry x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" as="geometry"/></mxCell>`;
};

export const buildMxEdgeCell = (edge: Edge, idFormatter?: IdFormatter): string => {
  const id = idFormatter ? idFormatter(edge.id) : String(edge.id);
  const sourceId = idFormatter ? idFormatter(edge.from) : String(edge.from);
  const targetId = idFormatter ? idFormatter(edge.to) : String(edge.to);
  return `<mxCell id="${id}" value="" style="edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;elbow=vertical;startArrow=none;endFill=1;strokeColor=${COLOR_GROUP.EDGE_COLOR};strokeWidth=${EDGE_STROKE_WIDTH};rounded=0;" edge="1" parent="1" source="${sourceId}" target="${targetId}"><mxGeometry width="100" relative="1" as="geometry"><mxPoint x="0" y="0" as="sourcePoint"/><mxPoint x="100" y="0" as="targetPoint"/></mxGeometry></mxCell>`;
};

export const buildMxGraphModelXml = (nodes: Node[], frames: Frame[], edges: Edge[], idFormatter?: IdFormatter): string => {
  const cells = [
    ...frames.map((frame) => buildMxFrameCell(frame, idFormatter)),
    ...nodes.map((node) => buildMxNodeCell(node, idFormatter)),
    ...edges.map((edge) => buildMxEdgeCell(edge, idFormatter)),
  ].join("");
  return `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells}</root></mxGraphModel>`;
};

export const encodeMxGraphClipboard = (xml: string): string => encodeURIComponent(xml);

export const decodeMxGraphClipboard = (rawText: string): string | null => {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes("<mxGraphModel") || trimmed.includes("<mxfile")) {
    return trimmed;
  }
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.includes("<mxGraphModel") || decoded.includes("<mxfile")) {
      return decoded;
    }
  } catch {
    return null;
  }
  return null;
};

export interface ParsedClipboardData {
  nodes: Array<Omit<Node, "id"> & { originalId: string }>;
  frames: Array<Omit<Frame, "id"> & { originalId: string }>;
  edges: Array<Omit<Edge, "id" | "from" | "to"> & { originalId: string; fromOriginalId: string; toOriginalId: string }>;
}

type IdFormatter = (id: number) => string;

const parseNodeKindFromStyle = (styleMap: Map<string, string>): string => {
  if (styleMap.has("text")) {
    return "TextBox";
  }
  const resIcon = styleMap.get("resIcon");
  if (resIcon && RES_ICON_TO_KIND[resIcon]) {
    return RES_ICON_TO_KIND[resIcon];
  }
  const shape = styleMap.get("shape");
  if (shape && SHAPE_TO_KIND[shape]) {
    return SHAPE_TO_KIND[shape];
  }
  return "OtherService";
};

const parseFrameKindFromStyle = (styleMap: Map<string, string>): string => {
  const grIcon = styleMap.get("grIcon");
  if (grIcon === "mxgraph.aws4.group_security_group") {
    const fillColor = (styleMap.get("fillColor") || "").toLowerCase();
    if (fillColor === "#f2f6e8") return "PublicSubnet";
    if (fillColor === "#e6f6f7") return "PrivateSubnet";
    return "PublicSubnet";
  }
  if (grIcon && FRAME_GRICON_TO_KIND[grIcon]) {
    return FRAME_GRICON_TO_KIND[grIcon];
  }
  if (styleMap.get("align") === "center" && styleMap.get("container") === "1") {
    return "AZ";
  }
  return "GeneralGroup";
};

const parseNumberAttr = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseMxGraphClipboard = (rawText: string): ParsedClipboardData | null => {
  const xml = decodeMxGraphClipboard(rawText);
  if (!xml) {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    return null;
  }

  const root = doc.querySelector("mxGraphModel > root") || doc.querySelector("root");
  if (!root) {
    return null;
  }

  const nodes: ParsedClipboardData["nodes"] = [];
  const frames: ParsedClipboardData["frames"] = [];
  const edges: ParsedClipboardData["edges"] = [];
  const knownVertexIds = new Set<string>();

  const cells = Array.from(root.getElementsByTagName("mxCell"));
  for (const cell of cells) {
    const cellId = cell.getAttribute("id");
    if (!cellId || cellId === "0" || cellId === "1") {
      continue;
    }
    const style = cell.getAttribute("style") || "";
    const styleMap = parseStyleMap(style);
    const value = cell.getAttribute("value");
    const geometry = cell.getElementsByTagName("mxGeometry")[0];
    const x = parseNumberAttr(geometry?.getAttribute("x") ?? "0", 0);
    const y = parseNumberAttr(geometry?.getAttribute("y") ?? "0", 0);
    const width = parseNumberAttr(geometry?.getAttribute("width") ?? null, elementSize.defaultNodeWidth);
    const height = parseNumberAttr(geometry?.getAttribute("height") ?? null, elementSize.defaultNodeHeight);

    if (cell.getAttribute("vertex") === "1") {
      const isFrame =
        styleMap.get("container") === "1" ||
        styleMap.has("grIcon") ||
        (styleMap.get("shape") || "").includes("mxgraph.aws4.group");
      if (isFrame) {
        const kind = parseFrameKindFromStyle(styleMap);
        frames.push({
          originalId: cellId,
          kind,
          x,
          y,
          width,
          height,
          label: value && value.length > 0 ? value : getDefaultLabelForKind(kind),
        });
      } else {
        const kind = parseNodeKindFromStyle(styleMap);
        nodes.push({
          originalId: cellId,
          kind,
          x,
          y,
          label: value && value.length > 0 ? value : getDefaultLabelForKind(kind),
        });
      }
      knownVertexIds.add(cellId);
      continue;
    }

    if (cell.getAttribute("edge") === "1") {
      const source = cell.getAttribute("source");
      const target = cell.getAttribute("target");
      if (!source || !target) {
        continue;
      }
      edges.push({
        originalId: cellId,
        fromOriginalId: source,
        toOriginalId: target,
      });
    }
  }

  return {
    nodes,
    frames,
    edges: edges.filter((edge) => knownVertexIds.has(edge.fromOriginalId) && knownVertexIds.has(edge.toOriginalId)),
  };
};

export const exportSelectionToEncodedMxGraph = (state: AppState): string | null => {
  const selectedNodeSet = new Set(state.selectedNodeIds);
  const selectedFrameSet = new Set(state.selectedFrameIds);
  const selectedElementIdSet = new Set<number>([...state.selectedNodeIds, ...state.selectedFrameIds]);

  const nodes = state.nodes.filter((node) => selectedNodeSet.has(node.id));
  const frames = state.frames.filter((frame) => selectedFrameSet.has(frame.id));
  const edges = state.edges.filter((edge) => {
    const explicitlySelected = state.selectedEdgeIds.includes(edge.id);
    const bothEndsSelected = selectedElementIdSet.has(edge.from) && selectedElementIdSet.has(edge.to);
    return explicitlySelected || bothEndsSelected;
  });

  if (nodes.length === 0 && frames.length === 0 && edges.length === 0) {
    return null;
  }

  const idMap = new Map<number, number>();
  let nextClipboardId = CLIPBOARD_ID_START;

  const remappedFrames: Frame[] = frames.map((frame) => {
    const remappedId = nextClipboardId++;
    idMap.set(frame.id, remappedId);
    return { ...frame, id: remappedId };
  });

  const remappedNodes: Node[] = nodes.map((node) => {
    const remappedId = nextClipboardId++;
    idMap.set(node.id, remappedId);
    return { ...node, id: remappedId };
  });

  const remappedEdges: Edge[] = edges.flatMap((edge) => {
    const from = idMap.get(edge.from);
    const to = idMap.get(edge.to);
    if (from === undefined || to === undefined) {
      return [];
    }
    return [{
      ...edge,
      id: nextClipboardId++,
      from,
      to,
    }];
  });

  const clipboardIdFormatter = (id: number) => `ConvertFrom_YuruAws-${id}`;
  const xml = buildMxGraphModelXml(remappedNodes, remappedFrames, remappedEdges, clipboardIdFormatter);
  return encodeMxGraphClipboard(xml);
};
