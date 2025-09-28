import React, { useState } from "react";
import { useAppActions } from "../hooks/useAppActions";
import {
  sanitiseNodes,
  sanitiseFrames,
  sanitiseEdges,
  calculateNextIdFromCollections,
} from "../utils/diagramNormalization";
import { sanitizeInput } from "../utils/security";

type RequestStatus = "idle" | "loading" | "success" | "error";

const PROMPT_EXAMPLES = [
  { label: "---", value: "---", prompt: "" },
  { label: "Web 3層", value: "web3tier", prompt: "Web3層アーキテクチャを作成して" },
  { label: "動画配信", value: "video", prompt: "動画コンテンツを配信するサービスを作成して" },
  { label: "非同期1", value: "async1", prompt: "Webサービスでアップロードしたコンテンツを非同期で加工して保存するサービスを作成して" },
  { label: "非同期2", value: "async2", prompt: "Webサービスで非同期処理を実行して結果をメールで受け取るサービスを作成して" },
  { label: "メール", value: "mail", prompt: "メールを送受信するサービスを作成して" },
  { label: "コード", value: "code", prompt: "コード管理のサービスを作成して" },
  { label: "AI", value: "genai", prompt: "生成AIの基盤とマネージドサービスの連携サービスを作成して" },
];

const AIBar: React.FC = () => {
  const { loadState, setAIGenerating, setAIError, clearAllDiagram } = useAppActions();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [selectedExample, setSelectedExample] = useState("");
  const [configExists, setConfigExists] = useState<boolean | null>(null);

  // config.jsonの存在チェック
  React.useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('./config.json');
        const responseText = await response.text();
        
        // JSONとして解析できるかチェック
        try {
          const config = JSON.parse(responseText);
          // AI_PROMPT_ENDPOINTが存在し、空でない場合のみ有効とする
          const hasValidEndpoint = config.AI_PROMPT_ENDPOINT && 
                                  typeof config.AI_PROMPT_ENDPOINT === 'string' && 
                                  config.AI_PROMPT_ENDPOINT.trim() !== '' &&
                                  config.AI_PROMPT_ENDPOINT !== 'YOUR_AI_ENDPOINT_URL_HERE';
          setConfigExists(response.ok && hasValidEndpoint);
        } catch {
          setConfigExists(false);
        }
      } catch (error) {
        setConfigExists(false);
      }
    };
    checkConfig();
  }, []);

  // config.jsonが存在しない場合は非表示
  if (configExists === false) {
    return null;
  }

  // 読み込み中は何も表示しない
  if (configExists === null) {
    return null;
  }

  const handleExampleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedExample(value);
    const example = PROMPT_EXAMPLES.find(ex => ex.value === value);
    if (example && example.prompt) {
      setPrompt(example.prompt);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    setStatus("loading");
    setAIGenerating(true);

    try {
      const configResponse = await fetch('./config.json');
      const config = await configResponse.json();
      const AI_PROMPT_ENDPOINT = config.AI_PROMPT_ENDPOINT;
      const AI_PROMPT_PREFIX = config.AI_PROMPT_PREFIX || '';
      const AI_PROMPT_POSTFIX = config.AI_PROMPT_POSTFIX || '';
      
      if (!AI_PROMPT_ENDPOINT) {
        throw new Error('AI endpoint not configured');
      }

      const sanitizedPrompt = sanitizeInput(trimmed);
      const fullPrompt = AI_PROMPT_PREFIX + sanitizedPrompt + AI_PROMPT_POSTFIX;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const response = await fetch(AI_PROMPT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const rawText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // モデル名とJSON抽出処理
      let modelName = null;
      let cleanedJson = rawText;
      
      const modelMatch = rawText.match(/MODELID-(.*?)-MODELID/);
      if (modelMatch) {
        modelName = modelMatch[1];
        cleanedJson = rawText.replace(/MODELID-.*?-MODELID/, '');
      }
      
      const firstBrace = cleanedJson.indexOf('{');
      const lastBrace = cleanedJson.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && firstBrace <= lastBrace) {
        cleanedJson = cleanedJson.slice(firstBrace, lastBrace + 1);
      }

      cleanedJson = cleanedJson.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');

      const payload = JSON.parse(cleanedJson);

      clearAllDiagram();

      let importedNodes = sanitiseNodes(payload.nodes);
      const importedFrames = sanitiseFrames(payload.frames);
      const importedEdges = sanitiseEdges(payload.edges);
      
      // モデル名ノードを追加
      if (modelName) {
        const modelNode = {
          id: 0,
          kind: 'TextBox',
          x: 450,
          y: -8,
          label: `今回の基盤モデル： ${modelName}`
        };
        importedNodes = [modelNode, ...importedNodes];
      }
      
      const calculatedNextId = calculateNextIdFromCollections(1, importedNodes, importedFrames, importedEdges);

      loadState({
        nodes: importedNodes,
        frames: importedFrames,
        edges: importedEdges,
        nextId: calculatedNextId,
        selectedNodeIds: [],
        selectedFrameIds: [],
      });

      setStatus("success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'APIエラーが発生しました';
      setAIError(true, `APIの実行に失敗しました\n${errorMessage}`);
      setTimeout(() => {
        setAIError(false);
        setStatus("idle");
      }, 3000);
    } finally {
      setAIGenerating(false);
    }
  };

  return (
    <div className="ai-bar">
      <form className="ai-bar-form" onSubmit={handleSubmit}>
        <label className="ai-bar-label">AIプロンプト</label>
        <div className="ai-example-container">
          <span className="ai-example-text">（例：</span>
          <select 
            value={selectedExample} 
            onChange={handleExampleChange}
            disabled={status === "loading"}
            className="ai-example-select"
          >
            {PROMPT_EXAMPLES.map(example => (
              <option key={example.value} value={example.value}>
                {example.label}
              </option>
            ))}
          </select>
          <span className="ai-example-text">）</span>
        </div>
        <textarea
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="xxxサービスを作成して"
          disabled={status === "loading"}
          className="ai-bar-input"
          rows={1}
        />
        <button type="submit" disabled={status === "loading"} className="ai-bar-button">
          {status === "loading" ? "生成中..." : "作成"}
        </button>
      </form>

    </div>
  );
};

export default AIBar;
