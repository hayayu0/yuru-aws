import React, { useEffect, useRef, useState } from "react";
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
import { convertJsonToXml } from "../utils/convertJsonXml";

const SaveLoadButton: React.FC = () => {
  const { state } = useAppState();
  const { loadState } = useAppActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = state.interactionMode === 'waitingAI';
  const triggerZoomIn = () => window.dispatchEvent(new Event('yuruaws:zoom-in'));
  const triggerZoomOut = () => window.dispatchEvent(new Event('yuruaws:zoom-out'));
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('yuruaws:grid-visibility', { detail: showGrid }));
  }, [showGrid]);

  const exportToJSON = () => {
    if (isDisabled) return;
    const data = {
      nodes: state.nodes.map(normaliseNodeForExport),
      frames: state.frames.map(normaliseFrameForExport),
      edges: state.edges.map((edge): Edge => ({ ...edge })),
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

  const exportToDiagramsNet = () => {
    if (isDisabled) return;
    const data = {
      nodes: state.nodes.map(normaliseNodeForExport),
      frames: state.frames.map(normaliseFrameForExport),
      edges: state.edges.map((edge): Edge => ({ ...edge })),
    };

    const xmlContent = convertJsonToXml(data);
    const blob = new Blob([xmlContent], {
      type: "application/xml",
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

    a.download = `aws-diagram_${timestamp}.drawio`;
    a.href = URL.createObjectURL(blob);
    a.click();

    URL.revokeObjectURL(a.href);
  };

  const handleJSONImport = () => {
    if (isDisabled) return;
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

        loadState({
          nodes: importedNodes,
          frames: importedFrames,
          edges: importedEdges,
          selectedNodeIds: [],
          selectedFrameIds: [],
          drawings: [],
          drawing: {
            active: false,
            color: "#000000",
            points: [],
          },
          penDeleteActive: false,
        });
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
        disabled={isDisabled}
        title="Export diagram as JSON file"
      >
        保存(Json)
      </button>

      <button
        type="button"
        onClick={handleJSONImport}
        disabled={isDisabled}
        title="Import diagram from JSON file"
      >
        読込(Json)
      </button>

      <button
        type="button"
        onClick={exportToDiagramsNet}
        disabled={isDisabled}
        title="Export diagram for diagrams.net"
      >
        保存(diagrams.net用)
      </button>

      <button
        type="button"
        onClick={triggerZoomIn}
        disabled={isDisabled}
        title="Zoom in"
      >
        🔍+
      </button>

      <button
        type="button"
        onClick={triggerZoomOut}
        disabled={isDisabled}
        title="Zoom out"
      >
        🔍-
      </button>

      <label className="toolbar-grid-toggle" title="Toggle grid lines">
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(event) => setShowGrid(event.target.checked)}
          disabled={isDisabled}
        />
        <span>グリッド線</span>
      </label>

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
