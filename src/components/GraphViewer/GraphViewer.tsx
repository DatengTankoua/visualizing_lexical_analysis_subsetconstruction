// src/components/GraphViewer/GraphViewer.tsx
import React, { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
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
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";

import type { NFA, Transition } from "../../core/models/types";

type ViewerProps = { nfa?: NFA; interactive?: boolean };

type OffsetEdgeData = {
  offset?: number;
};

/* ---------------- Custom Offset Bezier Edge ----------------
   edge.data.offset: number  (negative => arc up, positive => arc down)
*/
function OffsetBezierEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    style,
    label,
    labelStyle,
    data,
  } = props;

  const offset = (data as OffsetEdgeData | undefined)?.offset ?? 0;

  // cubic bezier with y-offset control points
  const c1x = sourceX;
  const c1y = sourceY + offset;
  const c2x = targetX;
  const c2y = targetY + offset;

  const path = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;

  // label at midpoint + offset
  const lx = (sourceX + targetX) / 2;
  const ly = (sourceY + targetY) / 2 + offset;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label != null && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
              ...(labelStyle as CSSProperties),
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { offsetBezier: OffsetBezierEdge };

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
            inset: 6,
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
          {isStart && (
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, color: "#065f46" }}>
              START
            </span>
          )}
          {isAccept && !isStart && (
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, color: "#2563eb" }}>
              ACCEPT
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{id}</span>
        </div>
      </div>

      {/* handles */}
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

/* ---------------- canvas ---------------- */
function GraphCanvas({ nfa, interactive = false }: { nfa: NFA; interactive?: boolean }) {
  const { states, startState, acceptStates, transitions } = nfa;

  const initial = useMemo(() => {
    // ---- layout ----
    const gapX = 180;
    const yStart = 120;
    const yNorm = 260;

    // index map for "跨越边" detection
    const indexOf = new Map<string, number>();
    states.forEach((s, i) => indexOf.set(s, i));

    const nodes: Node[] = states.map((s, i) => {
      const isStart = s === startState;
      const isAccept = acceptStates.includes(s);
      return {
        id: s,
        type: "state",
        position: { x: i * gapX, y: isStart ? yStart : yNorm },
        data: { id: s, isStart, isAccept },
      };
    });

    const labelStyle: CSSProperties = {
      fontSize: 12,
      fontWeight: 600,
      pointerEvents: "none",
      background: "rgba(255,255,255,0.95)",
      padding: "2px 6px",
      borderRadius: 8,
      border: "1px solid rgba(148,163,184,0.7)",
      zIndex: 10,
      whiteSpace: "nowrap",
    };

    // detect reverse edges: a<->b
    const directed = new Set(transitions.map((t) => `${t.from}->${t.to}`));
    const unorderedKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    const hasReverse = new Map<string, boolean>();
    transitions.forEach((t) => {
      const k = unorderedKey(t.from, t.to);
      if (directed.has(`${t.to}->${t.from}`)) hasReverse.set(k, true);
    });

    // for multiple edges between same from->to
    const pairCount: Record<string, number> = {};

    const edges: Edge[] = transitions.map((t: Transition) => {
      const key = `${t.from}->${t.to}`;
      pairCount[key] = (pairCount[key] ?? 0) + 1;
      const order = pairCount[key] - 1;

      const iFrom = indexOf.get(t.from) ?? 0;
      const iTo = indexOf.get(t.to) ?? 0;
      const dist = Math.abs(iFrom - iTo);

      const isLoop = t.from === t.to;
      const isEps = t.symbol === "ε";
      const isReversePair = hasReverse.get(unorderedKey(t.from, t.to)) === true;

      const baseStyle: CSSProperties = {
        stroke: "#334155",
        strokeWidth: 2,
        ...(isEps ? { strokeDasharray: "6 4" } : null),
      };

      // ----- 1) self-loop -----
      if (isLoop) {
        return {
          id: `${t.from}-${t.symbol}-${t.to}-${order}`,
          source: t.from,
          target: t.to,
          type: "offsetBezier",
          sourceHandle: "right-s",
          targetHandle: "top-t",
          data: { offset: -70 - order * 20 },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label: t.symbol,
          style: baseStyle,
          labelStyle,
        };
      }

      // ----- 2) spanning edge (跨越边 dist>1): force arc UP by default -----
      // If you prefer some spanning edges arc DOWN, you can add conditions here.
      if (dist > 1) {
        const offset = -140 - order * 25 - (isEps ? 25 : 0);
        return {
          id: `${t.from}-${t.symbol}-${t.to}-${order}`,
          source: t.from,
          target: t.to,
          type: "offsetBezier",
          sourceHandle: "top-s",
          targetHandle: "top-t",
          data: { offset },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label: t.symbol,
          style: baseStyle,
          labelStyle,
        };
      }

      // ----- 3) reverse pair (相反方向边): split up/down -----
      if (isReversePair) {
        // smallIndex -> largeIndex goes UP; reverse goes DOWN
        const forward = iFrom < iTo;
        const offset = (forward ? -80 : 80) + order * (forward ? -15 : 15);

        return {
          id: `${t.from}-${t.symbol}-${t.to}-${order}`,
          source: t.from,
          target: t.to,
          type: "offsetBezier",
          sourceHandle: forward ? "top-s" : "bottom-s",
          targetHandle: forward ? "top-t" : "bottom-t",
          data: { offset },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label: t.symbol,
          style: baseStyle,
          labelStyle,
        };
      }

      // ----- 4) normal adjacent edge -----
      // epsilon gets small upward bend to avoid perfect overlap
      const offset = (isEps ? -55 : 0) + order * -18;

      return {
        id: `${t.from}-${t.symbol}-${t.to}-${order}`,
        source: t.from,
        target: t.to,
        type: "offsetBezier",
        sourceHandle: "right-s",
        targetHandle: "left-t",
        data: { offset },
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        label: t.symbol,
        style: baseStyle,
        labelStyle,
      };
    });

    return { nodes, edges };
  }, [states, startState, acceptStates, transitions]);

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
            type: "offsetBezier",
            data: { offset: -60 },
            animated: true,
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.45 }}
        nodesDraggable={interactive}
        nodesConnectable={interactive}
        elementsSelectable={interactive}
        proOptions={{ hideAttribution: true }}
        attributionPosition="bottom-left"
      >
        <MiniMap nodeStrokeColor={() => "#111"} />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
