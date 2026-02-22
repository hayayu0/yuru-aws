import type { Node, Frame, Edge } from "../types";
import { buildMxEdgeCell, buildMxFrameCell, buildMxNodeCell } from "./clipboardMxGraph";

const ID_PREFIX = "ConvertFrom_YuruAws-";

interface YuruAwsData {
  nodes: Record<string, unknown>[];
  frames: Record<string, unknown>[];
  edges: Edge[];
}

export function convertJsonToXml(data: YuruAwsData): string {
  const { nodes, frames, edges } = data;
  const idFormatter = (id: number) => `${ID_PREFIX}${id}`;

  const frameCells = frames.map((frame) => buildMxFrameCell(frame as unknown as Frame, idFormatter));
  const nodeCells = nodes.map((node) => buildMxNodeCell(node as unknown as Node, idFormatter));
  const edgeCells = edges.map((edge) => buildMxEdgeCell(edge, idFormatter));

  return [
    `<mxfile host="app.diagrams.net" version="28.2.5">`,
    `  <diagram name="AWS Diagram" id="aws-diagram">`,
    `    <mxGraphModel dx="892" dy="678" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">`,
    `      <root>`,
    `        <mxCell id="0" />`,
    `        <mxCell id="1" parent="0" />`,
    ...frameCells.map((cell) => `        ${cell}`),
    ...nodeCells.map((cell) => `        ${cell}`),
    ...edgeCells.map((cell) => `        ${cell}`),
    `      </root>`,
    `    </mxGraphModel>`,
    `  </diagram>`,
    `</mxfile>`,
  ].join("\n");
}
