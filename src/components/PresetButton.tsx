import React from "react";
import { useAppActions } from "../hooks/useAppActions";
import type { Node, Frame, Edge } from "../types";

const PresetButton: React.FC = () => {
  const { clearAllDiagram, clearAllDrawing, addNode, addFrame, addEdge } = useAppActions();

  const applyPreset3tier = () => {
    clearAllDiagram();
    clearAllDrawing();

    const frames: Frame[] = [
      {
        "id": 1,
        "kind": "Account",
        "x": 50,
        "y": 125,
        "width": 515,
        "height": 454
      },
      {
        "id": 2,
        "kind": "VPC",
        "x": 75,
        "y": 156,
        "width": 465,
        "height": 410
      },
      {
        "id": 3,
        "kind": "PublicSubnet",
        "x": 114,
        "y": 190,
        "width": 191,
        "height": 93
      },
      {
        "id": 4,
        "kind": "PrivateSubnet",
        "x": 113,
        "y": 290,
        "width": 196,
        "height": 259
      },
      {
        "id": 18,
        "kind": "PublicSubnet",
        "x": 328,
        "y": 189,
        "width": 184,
        "height": 93
      },
      {
        "id": 19,
        "kind": "GeneralGroup",
        "x": 180,
        "y": 436,
        "width": 268,
        "height": 96.99996948242188,
        "label": "DB Cluster"
      },
      {
        "id": 30,
        "kind": "PrivateSubnet",
        "x": 326,
        "y": 291,
        "width": 186,
        "height": 258.9999694824219
      }
    ];

    const nodes: Node[] = [
      {
        "id": 5,
        "kind": "ELB",
        "x": 293,
        "y": 215,
        "label": "ELB"
      },
      {
        "id": 6,
        "kind": "EC2",
        "x": 189,
        "y": 339,
        "label": "Webサーバ01"
      },
      {
        "id": 9,
        "kind": "InternetGW",
        "x": 327,
        "y": 129
      },
      {
        "id": 10,
        "kind": "Client",
        "x": 417,
        "y": 34
      },
      {
        "id": 11,
        "kind": "Mobile",
        "x": 361,
        "y": 27
      },
      {
        "id": 24,
        "kind": "EC2",
        "x": 398,
        "y": 337,
        "label": "Webサーバ02"
      },
      {
        "id": 28,
        "kind": "RDS",
        "x": 204,
        "y": 455,
        "label": "Active DB"
      },
      {
        "id": 29,
        "kind": "RDS",
        "x": 378,
        "y": 455,
        "label": "Satndby DB"
      }

    ];

    const edges: Edge[] = [
      {
        "id": 12,
        "from": 5,
        "to": 6
      },
      {
        "id": 16,
        "from": 10,
        "to": 5
      },
      {
        "id": 17,
        "from": 11,
        "to": 5
      },
      {
        "id": 20,
        "from": 6,
        "to": 19
      },
      {
        "id": 25,
        "from": 5,
        "to": 24
      },
      {
        "id": 26,
        "from": 24,
        "to": 19
      },
      {
        "id": 27,
        "from": 24,
        "to": 19
      }
    ];

    frames.forEach(frame => addFrame(frame));
    nodes.forEach(node => addNode(node));
    edges.forEach(edge => addEdge(edge));
  };

  return (
    <button type="button" onClick={applyPreset3tier}>
      例：3層
    </button>
  );
};

export default PresetButton;
