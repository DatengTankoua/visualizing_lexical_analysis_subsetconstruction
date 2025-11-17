
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  Handle,
  Position,
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

/* --------- Circular node with START / ACCEPT inside --------- */

function StateNode({
  data,
}: {
  data: { id: string; isStart?: boolean; isAccept?: boolean };
}) {
  const { id, isStart, isAccept } = data;
  const size = 72;
  const stroke = isAccept ? "#2563eb" : "#4b5563";
  const fill = isStart ? "#d1fae5" : "#ffffff";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {isAccept && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            border: `3px solid ${stroke}`,
            borderRadius: "50%",
          }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: fill,
          border: `3px solid ${stroke}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1.1,
          }}
        >
          {isStart && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.4,
                color: "#065f46",
              }}
            >
              START
            </span>
          )}
          {isAccept && !isStart && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.4,
                color: "#2563eb",
              }}
            >
              ACCEPT
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            {id}
          </span>
        </div>
      </div>

      {/* four handles for routing / loops */}
      <Handle type="source" position={Position.Top} id="top-s" />
      <Handle type="source" position={Position.Right} id="right-s" />
      <Handle type="source" position={Position.Bottom} id="bottom-s" />
      <Handle type="source" position={Position.Left} id="left-s" />
      <Handle type="target" position={Position.Top} id="top-t" />
      <Handle type="target" position={Position.Right} id="right-t" />
      <Handle type="target" position={Position.Bottom} id="bottom-t" />
      <Handle type="target" position={Position.Left} id="left-t" />
    </div>
  );
}

const nodeTypes = { state: StateNode };

/* ---------------- outer wrapper ---------------- */

export default function GraphViewer({ nfa, interactive = false }: ViewerProps) {
  if (!nfa) {
    return (
      <div className="border p-4 h-[480px] rounded-xl grid place-items-center text-gray-500">
        Graph visualization here
      </div>
    );
  }
  return <GraphCanvas nfa={nfa} interactive={interactive} />;
}

/* ---------------- canvas with edges ---------------- */

function GraphCanvas({
  nfa,
  interactive = false,
}: {
  nfa: NFA;
  interactive?: boolean;
}) {
  const model = nfa;

  const initial = useMemo(() => {
    const gapX = 250;
    const yStart = 100;
    const yNorm = 240;

    const nodes: Node[] = model.states.map((s, i) => {
      const isStart = s === model.startState;
      const isAccept = model.acceptStates.includes(s);
      return {
        id: s,
        type: "state",
        position: { x: i * gapX, y: isStart ? yStart : yNorm },
        data: { id: s, isStart, isAccept },
      };
    });

    const pairOrder: Record<string, number> = {};
    const loopOrder: Record<string, number> = {};

    const edges: Edge[] = model.transitions.map((t: Transition) => {
      const key = `${t.from}->${t.to}`;
      pairOrder[key] = (pairOrder[key] ?? 0) + 1;
      const isLoop = t.from === t.to;

      // base style for all edges
      const baseStyle: CSSProperties = {
        stroke: "#334155",
        strokeWidth: 2,
      };

      if (isLoop) {
        loopOrder[t.from] = (loopOrder[t.from] ?? 0) + 1;
        const idx = loopOrder[t.from] - 1;

        const variants: Array<{
          sourceHandle: string;
          targetHandle: string;
          labelOffsetY: number;
        }> = [
          { sourceHandle: "right-s", targetHandle: "top-t", labelOffsetY: -10 },
          { sourceHandle: "right-s", targetHandle: "bottom-t", labelOffsetY: 10 },
          { sourceHandle: "left-s", targetHandle: "top-t", labelOffsetY: -10 },
          { sourceHandle: "left-s", targetHandle: "bottom-t", labelOffsetY: 10 },
        ];

        const variant = variants[idx % variants.length];

        return {
          id: `${t.from}-${t.symbol}-${t.to}-${pairOrder[key]}`,
          source: t.from,
          target: t.to,
          type: "step",
          sourceHandle: variant.sourceHandle,
          targetHandle: variant.targetHandle,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label: t.symbol,
          style: baseStyle,
          labelStyle: {
            transform: "translateY(-2px)",
            fontSize: 12,
            fontWeight: 500,
            pointerEvents: "none",
          } as CSSProperties,
        } as Edge;
      }

      const order = pairOrder[key];

      return {
        id: `${t.from}-${t.symbol}-${t.to}-${order}`,
        source: t.from,
        target: t.to,
        type: "step",
        sourceHandle: "right-s",
        targetHandle: "left-t",
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        label: t.symbol,
        style: baseStyle,
        labelStyle: {
          transform: "translateY(-2px)",
          fontSize: 12,
          fontWeight: 500,
          pointerEvents: "none",
        } as CSSProperties,
      } as Edge;
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
            type: "step",
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          },
          eds
        )
      );
    },
    [interactive]
  );

  return (
    <div className="border p-4 h-[520px] rounded-xl shadow-sm relative">
      <div className="absolute top-2 left-3 text-sm text-gray-500">
      </div>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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