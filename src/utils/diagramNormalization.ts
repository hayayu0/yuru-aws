import type { Node, Frame, Edge } from "../types";
import { elementSize, awsServices, getDefaultLabelForKind } from "../types/aws";

const toRoundedNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.round(numeric);
};

const toOptionalString = (value: unknown): string | null => {
  return typeof value === "string" ? value : null;
};

export const normaliseNodeForExport = (node: Node): Record<string, unknown> => {
  const exportNode: Record<string, unknown> = {
    id: node.id,
    kind: node.kind,
    x: Math.round(node.x),
    y: Math.round(node.y),
  };

  if (node.label !== null && node.label !== undefined) {
    exportNode.label = node.label;
  }

  return exportNode;
};

export const normaliseFrameForExport = (frame: Frame): Record<string, unknown> => {
  const exportFrame: Record<string, unknown> = {
    id: frame.id,
    kind: frame.kind,
    x: Math.round(frame.x),
    y: Math.round(frame.y),
    width: Math.round(frame.width),
    height: Math.round(frame.height),
  };

  if (frame.label !== null && frame.label !== undefined) {
    exportFrame.label = frame.label;
  }

  return exportFrame;
};

export const sanitiseNode = (raw: unknown): Node | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const id = Number(candidate.id);
  const kind = candidate.kind;

  if (!Number.isFinite(id) || typeof kind !== "string") {
    return null;
  }

  const x = toRoundedNumber(candidate.x);
  const y = toRoundedNumber(candidate.y);
  const rawLabel = toOptionalString(candidate.label);

  // Check if kind exists in awsServices, if not use OtherService
  const validKind = awsServices[kind] ? kind : 'OtherService';
  const label = rawLabel && rawLabel.length > 0 ? rawLabel : getDefaultLabelForKind(validKind);

  return {
    id,
    kind: validKind,
    x,
    y,
    label,
  };
};

export const sanitiseFrame = (raw: unknown): Frame | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const id = Number(candidate.id);
  const kind = candidate.kind;

  if (!Number.isFinite(id) || typeof kind !== "string") {
    return null;
  }

  const x = toRoundedNumber(candidate.x);
  const y = toRoundedNumber(candidate.y);
  let width = toRoundedNumber(candidate.width, elementSize.frameMinWidth);
  let height = toRoundedNumber(candidate.height, elementSize.frameMinHeight);
  const rawLabel = toOptionalString(candidate.label);

  width = Math.max(elementSize.frameMinWidth, width);
  height = Math.max(elementSize.frameMinHeight, height);

  // Check if kind exists in awsServices, if not use OtherService
  const validKind = awsServices[kind] ? kind : 'OtherService';
  const label = rawLabel && rawLabel.length > 0 ? rawLabel : getDefaultLabelForKind(validKind);

  return {
    id,
    kind: validKind,
    x,
    y,
    width,
    height,
    label,
  };
};

export const sanitiseEdge = (raw: unknown): Edge | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const id = Number(candidate.id);
  const from = Number(candidate.from);
  const to = Number(candidate.to);

  if (!Number.isFinite(id) || !Number.isFinite(from) || !Number.isFinite(to)) {
    return null;
  }

  return {
    id,
    from,
    to,
  };
};

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export const sanitiseNodes = (raw: unknown): Node[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(sanitiseNode).filter(isNotNull);
};

export const sanitiseFrames = (raw: unknown): Frame[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(sanitiseFrame).filter(isNotNull);
};

export const sanitiseEdges = (raw: unknown): Edge[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(sanitiseEdge).filter(isNotNull);
};

export const calculateNextIdFromCollections = (
  fallback: unknown,
  ...collections: Array<Array<{ id: number }>>
): number => {
  const maxId = collections.reduce((maxValue, list) => {
    const localMax = list.reduce((currentMax, item) => Math.max(currentMax, item.id), 0);
    return Math.max(maxValue, localMax);
  }, 0);

  const fallbackNum = Number.isFinite(Number(fallback)) ? Number(fallback) : 1;
  return Math.max(fallbackNum, maxId + 1);
};
