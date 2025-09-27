import React from "react";
import ToolButton from "./ToolButton";
import SaveLoadButton from "./SaveLoadButton";

const Toolbar: React.FC = () => {

  return (
    <div className="toolbar" role="banner">
      <div className="toolbar-buttons">
        <ToolButton tool="select">選択/移動</ToolButton>
        <ToolButton tool="arrow">→(結線)</ToolButton>
        <ToolButton tool="pen-black">
          🖊(<span className="penBlack">黒</span>)
        </ToolButton>
        <ToolButton tool="pen-red">
          🖊(<span className="penRed">赤</span>)
        </ToolButton>
        <ToolButton tool="penDelete">
          🖊(<span className="penDelete">削除</span>)
        </ToolButton>
        <SaveLoadButton />
      </div>
    </div>
  );
};

export default Toolbar;
