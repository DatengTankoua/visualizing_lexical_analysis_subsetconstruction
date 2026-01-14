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
import dagre from "dagre";

type ViewerProps = { nfa?: NFA; interactive?: boolean };

type OffsetEdgeData = {
  offset?: number;
};

const NODE_W = 72;
const NODE_H = 72;

/* ---------------- Dagre Auto-Layout ---------------- */
function layoutWithDagre(states: string[], transitions: Transition[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: "LR",
    nodesep: 60,
    ranksep: 90,
  });

  states.forEach((id) => g.setNode(id, { width: NODE_W, height: NODE_H }));
  transitions.forEach((t) => g.setEdge(t.from, t.to));

  dagre.layout(g);

  const pos = new Map<string, { x: number; y: number }>();
  states.forEach((id) => {
    const n = g.node(id) as { x: number; y: number };
    pos.set(id, { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 });
  });

  return pos;
}

/* ---------------- Benutzerdefinierte Bezier-Kante mit Offset ---------------- */
function OffsetBezierEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, labelStyle, data } = props;

  const offset = (data as OffsetEdgeData | undefined)?.offset ?? 0;

  const c1x = sourceX;
  const c1y = sourceY + offset;
  const c2x = targetX;
  const c2y = targetY + offset;

  const path = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;

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

/* ---------------- Zustand als Kreis mit START / ACCEPT ---------------- */
function StateNode({ data }: { data: { id: string; isStart?: boolean; isAccept?: boolean } }) {
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

      {/* Handles */}
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

/* ---------------- Wrapper ---------------- */
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

/* ---------------- Canvas ---------------- */
function GraphCanvas({ nfa, interactive = false }: { nfa: NFA; interactive?: boolean }) {
  const { states, startState, acceptStates, transitions } = nfa;

  const initial = useMemo(() => {
    const dagrePos = layoutWithDagre(states, transitions);

    const indexOf = new Map<string, number>();
    states.forEach((s, i) => indexOf.set(s, i));

    const nodes: Node[] = states.map((s) => {
      const isStart = s === startState;
      const isAccept = acceptStates.includes(s);
      const p = dagrePos.get(s) ?? { x: 0, y: 0 };

      return {
        id: s,
        type: "state",
        position: p,
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

    /* Transitionen nach (from,to) gruppieren und Labels zusammenfassen */
    type Grouped = {
      from: string;
      to: string;
      symbols: string[];
      hasEps: boolean;
    };

    const grouped: Grouped[] = (() => {
      const m = new Map<string, { from: string; to: string; symbols: Set<string> }>();

      for (const tr of transitions) {
        const key = `${tr.from}->${tr.to}`;
        if (!m.has(key)) m.set(key, { from: tr.from, to: tr.to, symbols: new Set<string>() });
        m.get(key)!.symbols.add(tr.symbol);
      }

      return Array.from(m.values()).map((g) => {
        const symbols = Array.from(g.symbols).sort();
        return { from: g.from, to: g.to, symbols, hasEps: g.symbols.has("ε") };
      });
    })();

    /* Reverse-Paare erkennen: a<->b */
    const unorderedKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    const directedPairs = new Set(grouped.map((g) => `${g.from}->${g.to}`));
    const hasReverse = new Map<string, boolean>();
    for (const g of grouped) {
      const k = unorderedKey(g.from, g.to);
      if (directedPairs.has(`${g.to}->${g.from}`)) hasReverse.set(k, true);
    }

    const formatLabel = (symbols: string[]) => {
      if (symbols.length <= 1) return symbols[0] ?? "";
      return `{${symbols.join(",")}}`;
    };

    const edges: Edge[] = grouped.map((g) => {
      const iFrom = indexOf.get(g.from) ?? 0;
      const iTo = indexOf.get(g.to) ?? 0;
      const dist = Math.abs(iFrom - iTo);

      const isLoop = g.from === g.to;
      const isEps = g.hasEps;
      const isReversePair = hasReverse.get(unorderedKey(g.from, g.to)) === true;

      const baseStyle: CSSProperties = {
        stroke: "#334155",
        strokeWidth: 2,
        ...(isEps ? { strokeDasharray: "6 4" } : null),
      };

      const label = formatLabel(g.symbols);

      /* 1) Self-Loop */
      if (isLoop) {
        return {
          id: `${g.from}->${g.to}`,
          source: g.from,
          target: g.to,
          type: "offsetBezier",
          sourceHandle: "right-s",
          targetHandle: "top-t",
          data: { offset: -70 },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label,
          style: baseStyle,
          labelStyle,
        };
      }

      /* 2) Sprungkante (dist > 1): Bogen nach oben */
      if (dist > 1) {
        const offset = -140 - (isEps ? 25 : 0);
        return {
          id: `${g.from}->${g.to}`,
          source: g.from,
          target: g.to,
          type: "offsetBezier",
          sourceHandle: "top-s",
          targetHandle: "top-t",
          data: { offset },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label,
          style: baseStyle,
          labelStyle,
        };
      }

      /* 3) Reverse-Paar: oben/unten trennen */
      if (isReversePair) {
        const forward = iFrom < iTo;
        const offset = forward ? -80 : 80;

        return {
          id: `${g.from}->${g.to}`,
          source: g.from,
          target: g.to,
          type: "offsetBezier",
          sourceHandle: forward ? "top-s" : "bottom-s",
          targetHandle: forward ? "top-t" : "bottom-t",
          data: { offset },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          label,
          style: baseStyle,
          labelStyle,
        };
      }

      /* 4) Normale Nachbarkante */
      const offset = isEps ? -55 : 0;

      return {
        id: `${g.from}->${g.to}`,
        source: g.from,
        target: g.to,
        type: "offsetBezier",
        sourceHandle: "right-s",
        targetHandle: "left-t",
        data: { offset },
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        label,
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
