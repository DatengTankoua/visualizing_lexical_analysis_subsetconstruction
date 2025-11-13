
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import type { NFA, Transition } from "../../core/models/types";

type ViewerProps = { nfa?: NFA; interactive?: boolean };

export default function GraphViewer({ nfa, interactive = false }: ViewerProps) {
  if (!nfa) {
    return (
      <div className="border p-4 h-[480px] rounded-xl grid place-items-center text-gray-500">
        Graphvisualisierung hier
      </div>
    );
  }
  return <GraphCanvas nfa={nfa} interactive={interactive} />;
}


function GraphCanvas({ nfa, interactive = false }: { nfa: NFA; interactive?: boolean }) {
  const model = nfa;

  const initial = useMemo(() => {
    const gapX = 220;
    const yStart = 60;
    const yNorm = 180;

    const nodes: Node[] = model.states.map((s, i) => {
      const isStart = s === model.startState;
      const isAccept = model.acceptStates.includes(s);
      const base = 42;

      const doubleCircle = (
        <div style={{ position: "relative", width: base, height: base }}>
          {isAccept && (
            <div
              style={{
                position: "absolute",
                inset: -6,
                border: "2px solid #2563eb",
                borderRadius: "50%",
              }}
            />
          )}
          <div
            style={{
              width: base,
              height: base,
              borderRadius: base / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              border: `2px solid ${isAccept ? "#2563eb" : "#111"}`,
              fontWeight: 700,
            }}
          >
            {s}
          </div>
        </div>
      );

      return {
        id: s,
        position: { x: i * gapX, y: isStart ? yStart : yNorm },
        data: {
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isStart && (
                <span
                  title="start"
                  style={{ borderLeft: "6px solid #2563eb", padding: "0 6px" }}
                />
              )}
              {doubleCircle}
              {isAccept && (
                <span style={{ fontSize: 12, color: "#2563eb" }}>accept</span>
              )}
            </div>
          ),
        },
        style: { padding: 6, background: "#fff", borderRadius: 12 },
      };
    });

    const count: Record<string, number> = {};
    const edges: Edge[] = model.transitions.map((t: Transition) => {
      const key = `${t.from}->${t.to}`;
      count[key] = (count[key] ?? 0) + 1;
      return {
        id: `${t.from}-${t.symbol}-${t.to}-${count[key]}`,
        source: t.from,
        target: t.to,
        label: t.symbol,
        animated: t.symbol === "ε" || t.symbol === "epsilon",
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: "#fff" },
        style: { strokeWidth: 2 },
      };
    });

    return { nodes, edges };
  }, [model]);

  const [nodes, setNodes] = useState<Node[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);

  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
  }, [initial]);

  const onNodesChange = useCallback(
    (c: NodeChange[]) => {
      if (!interactive) return;
      setNodes((nds) => applyNodeChanges(c, nds));
    },
    [interactive]
  );

  const onEdgesChange = useCallback(
    (c: EdgeChange[]) => {
      if (!interactive) return;
      setEdges((eds) => applyEdgeChanges(c, eds));
    },
    [interactive]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!interactive) return;
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          },
          eds
        )
      );
    },
    [interactive]
  );

  return (
    <div className="border p-4 h-[480px] rounded-xl shadow-sm">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          attributionPosition="bottom-left"
        >
          <MiniMap nodeStrokeColor={() => "#111"} />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
