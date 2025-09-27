import React, { useState } from "react";
import { useAppActions } from "../hooks/useAppActions";
import {
  sanitiseNodes,
  sanitiseFrames,
  sanitiseEdges,
  calculateNextIdFromCollections,
} from "../utils/diagramNormalization";
import { buildPrompt, ensureSchema } from "../utils/promptGenerator";

const AI_PROMPT_ENDPOINT =
  import.meta.env.VITE_AI_PROMPT_ENDPOINT ?? "/api/ai/diagram";

type RequestStatus = "idle" | "loading" | "success" | "error";

type GenerateResponse = {
  nodes?: unknown;
  frames?: unknown;
  edges?: unknown;
  drawings?: unknown;
  nextId?: unknown;
  message?: unknown;
  error?: unknown;
};

const extractMessage = (payload: GenerateResponse | null, fallback: string): string => {
  if (payload) {
    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message.trim();
    }
    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      return payload.error.trim();
    }
  }
  return fallback;
};

const parseResponseBody = (text: string): GenerateResponse | null => {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as GenerateResponse;
  } catch (error) {
    console.warn("Failed to parse AI response as JSON", error);
    return null;
  }
};

const AIPromptBox: React.FC = () => {
  const { loadState } = useAppActions();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      setStatus("error");
      setFeedback("Please enter a prompt before invoking AI.");
      return;
    }

    setStatus("loading");
    setFeedback(null);

    try {
      const generatedPrompt = buildPrompt(trimmed);
      
      const response = await fetch(AI_PROMPT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: generatedPrompt }),
      });

      const rawText = await response.text();
      
      if (!response.ok) {
        const payload = parseResponseBody(rawText);
        const message = extractMessage(
          payload,
          rawText || `Request failed with status ${response.status}`,
        );
        throw new Error(message);
      }

      // レスポンスをスキーマ検証
      const validatedJson = ensureSchema(rawText);
      const payload = parseResponseBody(validatedJson);

      const nodes = sanitiseNodes(payload?.nodes);
      const frames = sanitiseFrames(payload?.frames);
      const edges = sanitiseEdges(payload?.edges);

      if (nodes.length === 0 && frames.length === 0 && edges.length === 0) {
        throw new Error("API response did not include any diagram elements.");
      }

      const nextId = calculateNextIdFromCollections(payload?.nextId, nodes, frames, edges);

      loadState({
        nodes,
        frames,
        edges,
        nextId,
        drawings: [],
        drawing: {
          active: false,
          pathEl: null,
          color: "#000000",
          points: [],
        },
        penDeleteActive: false,
        selectedNodeIds: [],
        selectedFrameIds: [],
        selectedEdgeIds: [],
        pendingEdge: null,
        resizeInfo: null,
        dragInfo: null,
        marqueeInfo: null,
        nodeToAdd: null,
        editingNodeId: null,
      });

      setPrompt("");
      setStatus("success");
      setFeedback(extractMessage(payload, "AI diagram applied."));
    } catch (error) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "Failed to generate diagram.";
      setFeedback(message);
    }
  };

  return (
    <form className="ai-prompt-form" onSubmit={handleSubmit}>
      <label className="ai-prompt-label" htmlFor="ai-prompt-input">
        AI Prompt
      </label>
      <textarea
        id="ai-prompt-input"
        name="prompt"
        value={prompt}
        onChange={event => setPrompt(event.target.value)}
        placeholder="Describe the architecture you want to design..."
        rows={3}
        disabled={status === "loading"}
      />
      <div className="ai-prompt-actions">
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Generating..." : "Create"}
        </button>
      </div>
      {feedback && (
        <div
          className={`ai-prompt-status ${status === "error" ? "error" : "info"}`.trim()}
          role={status === "error" ? "alert" : undefined}
        >
          {feedback}
        </div>
      )}
    </form>
  );
};

export default AIPromptBox;
