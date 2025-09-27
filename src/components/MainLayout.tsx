import React from "react";
import Palette from "./Palette";
import Canvas from "./Canvas";
import DrawingLayer from "./DrawingLayer";
import LoadingOverlay from "./LoadingOverlay";

const MainLayout: React.FC = () => {
  return (
    <main className="layout">
      <Palette />
      <section className="workspace" aria-label="Diagram Canvas Area">
        <Canvas />
        <DrawingLayer />
        <LoadingOverlay />
      </section>
    </main>
  );
};

export default MainLayout;
