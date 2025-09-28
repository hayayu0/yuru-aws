import React, { useRef } from "react";
import { useAppState } from "../hooks/useAppState";
import { useAppActions } from "../hooks/useAppActions";
import type { Edge } from "../types";
import {
  normaliseNodeForExport,
  normaliseFrameForExport,
  sanitiseNodes,
  sanitiseFrames,
  sanitiseEdges,
} from "../utils/diagramNormalization";
import { validateJsonString } from "../utils/security";

const SaveLoadButton: React.FC = () => {
  const { state } = useAppState();
  const { loadState, clearAllDrawing } = useAppActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToJSON = () => {
    const data = {
      nodes: state.nodes.map(normaliseNodeForExport),
      frames: state.frames.map(normaliseFrameForExport),
      edges: state.edges.map((edge): Edge => ({ ...edge })),
      nextId: state.nextId,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");

    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;

    a.download = `aws-diagram_${timestamp}.json`;
    a.href = URL.createObjectURL(blob);
    a.click();

    URL.revokeObjectURL(a.href);
  };

  const handleJSONImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error("File content is not a string");
        }
        
        if (!validateJsonString(result)) {
          throw new Error("Invalid JSON format");
        }
        
        const data = JSON.parse(result);

        const importedNodes = sanitiseNodes(data.nodes);
        const importedFrames = sanitiseFrames(data.frames);
        const importedEdges = sanitiseEdges(data.edges);
        const importedNextId = Number.isFinite(Number(data.nextId))
          ? Number(data.nextId)
          : 1;

        loadState({
          nodes: importedNodes,
          frames: importedFrames,
          edges: importedEdges,
          nextId: importedNextId,
          selectedNodeIds: [],
          selectedFrameIds: [],
        });
        
        // Clear pen drawings on successful JSON load
        clearAllDrawing();
      } catch (error) {
        alert("Error: Could not parse JSON file.");
        console.error(error);
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={exportToJSON}
        title="Export diagram as JSON file"
      >
        保存(Json)
      </button>

      <button
        type="button"
        onClick={handleJSONImport}
        title="Import diagram from JSON file"
      >
        読込(Json)
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </>
  );
};

export default SaveLoadButton;
