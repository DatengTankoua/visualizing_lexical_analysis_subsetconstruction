/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GraphViewer from "./GraphViewer";

/* ---------------- reactflow Mock ---------------- */

const mockReactFlow = vi.fn((props: any) => {
  return (
    <div
      data-testid="reactflow"
      data-nodes-count={(props.nodes ?? []).length}
      data-edges-count={(props.edges ?? []).length}
      data-draggable={String(!!props.nodesDraggable)}
      data-connectable={String(!!props.nodesConnectable)}
      data-selectable={String(!!props.elementsSelectable)}
    >
      {props.children}
    </div>
  );
});

const mockApplyNodeChanges = vi.fn((changes: any, nodes: any[]) => nodes);
const mockApplyEdgeChanges = vi.fn((changes: any, edges: any[]) => edges);
const mockAddEdge = vi.fn((conn: any, edges: any[]) => {
  const id = conn?.id ?? `added-${edges.length}`;
  return [...edges, { id, ...conn }];
});

vi.mock("reactflow", async () => {
  return {
    __esModule: true,
    default: (props: any) => mockReactFlow(props),

    MiniMap: (props: any) => <div data-testid="rf-minimap" {...props} />,
    Controls: (props: any) => <div data-testid="rf-controls" {...props} />,
    Background: (props: any) => <div data-testid="rf-background" {...props} />,

    applyNodeChanges: (...args: any[]) => mockApplyNodeChanges(...args),
    applyEdgeChanges: (...args: any[]) => mockApplyEdgeChanges(...args),
    addEdge: (...args: any[]) => mockAddEdge(...args),

    MarkerType: { ArrowClosed: "ArrowClosed" },
    Handle: () => <div data-testid="rf-handle" />,
    Position: { Top: "Top", Right: "Right", Bottom: "Bottom", Left: "Left" },
    BaseEdge: (props: any) => <div data-testid="rf-baseedge" {...props} />,
    EdgeLabelRenderer: ({ children }: any) => <div data-testid="rf-edgelabel">{children}</div>,
  };
});

/* ---------------- Hilfsfunktionen ---------------- */

function lastReactFlowProps() {
  const calls = mockReactFlow.mock.calls;
  return calls[calls.length - 1]?.[0];
}

function getEdgesFromReactFlow(): any[] {
  return (lastReactFlowProps()?.edges ?? []) as any[];
}

function getNodesFromReactFlow(): any[] {
  return (lastReactFlowProps()?.nodes ?? []) as any[];
}

/* ---------------- Testdaten (NFAs) ---------------- */

const nfaNormal: any = {
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: ["q1"],
  transitions: [{ from: "q0", to: "q1", symbol: "a" }],
};

const nfaWithLoop: any = {
  states: ["q0"],
  startState: "q0",
  acceptStates: ["q0"],
  transitions: [{ from: "q0", to: "q0", symbol: "a" }],
};

const nfaWithSpanning: any = {
  states: ["q0", "q1", "q2"],
  startState: "q0",
  acceptStates: [],
  transitions: [{ from: "q0", to: "q2", symbol: "a" }], // dist = 2
};

const nfaWithReversePair: any = {
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: [],
  transitions: [
    { from: "q0", to: "q1", symbol: "a" },
    { from: "q1", to: "q0", symbol: "b" },
  ],
};

const nfaWithEpsilonAdjacent: any = {
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: [],
  transitions: [{ from: "q0", to: "q1", symbol: "ε" }],
};

const nfaWithMultiEdgesSamePair: any = {
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: [],
  transitions: [
    { from: "q0", to: "q1", symbol: "a" },
    { from: "q0", to: "q1", symbol: "b" }, // order = 1 => offset stärker negativ
  ],
};

/* ---------------- Tests ---------------- */

describe("GraphViewer (vollständige Tests)", () => {
  beforeEach(() => {
    mockReactFlow.mockClear();
    mockApplyNodeChanges.mockClear();
    mockApplyEdgeChanges.mockClear();
    mockAddEdge.mockClear();
  });

  describe("Placeholder (ohne NFA)", () => {
    it("rendert den Platzhalter, wenn nfa undefined ist", () => {
      render(<GraphViewer />);
      expect(screen.getByText(/Graph visualization here/i)).toBeInTheDocument();
    });
  });

  describe("Grundrendering (mit NFA)", () => {
    it("rendert ReactFlow", () => {
      render(<GraphViewer nfa={nfaNormal} />);
      expect(screen.getByTestId("reactflow")).toBeInTheDocument();
    });

    it("rendert MiniMap, Controls und Background", () => {
      render(<GraphViewer nfa={nfaNormal} />);
      expect(screen.getByTestId("rf-minimap")).toBeInTheDocument();
      expect(screen.getByTestId("rf-controls")).toBeInTheDocument();
      expect(screen.getByTestId("rf-background")).toBeInTheDocument();
    });

    it("übergibt nodeTypes und edgeTypes an ReactFlow", () => {
      render(<GraphViewer nfa={nfaNormal} />);
      const props = lastReactFlowProps();
      expect(props.nodeTypes).toBeTruthy();
      expect(props.edgeTypes).toBeTruthy();
      expect(props.nodeTypes.state).toBeTruthy();
      expect(props.edgeTypes.offsetBezier).toBeTruthy();
    });
  });

  describe("Layout der Nodes", () => {
    it("setzt die Start-State-Node auf y=120 und normale Nodes auf y=260", () => {
      render(<GraphViewer nfa={{ ...nfaNormal, states: ["q0", "q1", "q2"], acceptStates: [] , transitions: [{ from: "q0", to: "q1", symbol: "a" }] }} />);
      const nodes = getNodesFromReactFlow();

      const q0 = nodes.find((n) => n.id === "q0");
      const q1 = nodes.find((n) => n.id === "q1");
      const q2 = nodes.find((n) => n.id === "q2");

      expect(q0.position.y).toBe(120);
      expect(q1.position.y).toBe(260);
      expect(q2.position.y).toBe(260);
    });

    it("setzt x-Position als index * 180", () => {
      render(<GraphViewer nfa={{ ...nfaNormal, states: ["q0", "q1", "q2"], acceptStates: [] , transitions: [{ from: "q0", to: "q1", symbol: "a" }] }} />);
      const nodes = getNodesFromReactFlow();

      expect(nodes.find((n) => n.id === "q0").position.x).toBe(0);
      expect(nodes.find((n) => n.id === "q1").position.x).toBe(180);
      expect(nodes.find((n) => n.id === "q2").position.x).toBe(360);
    });

    it("setzt isStart/isAccept korrekt in node.data", () => {
      render(<GraphViewer nfa={nfaNormal} />);
      const nodes = getNodesFromReactFlow();
      const q0 = nodes.find((n) => n.id === "q0");
      const q1 = nodes.find((n) => n.id === "q1");

      expect(q0.data.isStart).toBe(true);
      expect(q0.data.isAccept).toBe(false);

      expect(q1.data.isStart).toBe(false);
      expect(q1.data.isAccept).toBe(true);
    });
  });

  describe("Edge-Erzeugung: alle Branches", () => {
    it("1) Self-Loop: setzt Handles right-s -> top-t und offset negativ", () => {
      render(<GraphViewer nfa={nfaWithLoop} />);
      const edges = getEdgesFromReactFlow();
      expect(edges).toHaveLength(1);

      const e = edges[0];
      expect(e.source).toBe("q0");
      expect(e.target).toBe("q0");
      expect(e.type).toBe("offsetBezier");
      expect(e.sourceHandle).toBe("right-s");
      expect(e.targetHandle).toBe("top-t");
      expect(e.data.offset).toBeLessThan(0);
      expect(e.markerEnd).toEqual(expect.objectContaining({ type: "ArrowClosed" }));
      expect(e.label).toBe("a");
    });

    it("2) Sprungkante (dist>1): setzt Handles top-s -> top-t und offset stark negativ", () => {
      render(<GraphViewer nfa={nfaWithSpanning} />);
      const edges = getEdgesFromReactFlow();
      expect(edges).toHaveLength(1);

      const e = edges[0];
      expect(e.type).toBe("offsetBezier");
      expect(e.sourceHandle).toBe("top-s");
      expect(e.targetHandle).toBe("top-t");
      expect(e.data.offset).toBeLessThan(-100);
    });

    it("3) Gegenrichtungskanten: forward geht nach oben (top), reverse nach unten (bottom)", () => {
      render(<GraphViewer nfa={nfaWithReversePair} />);
      const edges = getEdgesFromReactFlow();
      expect(edges).toHaveLength(2);

      const eForward = edges.find((x) => x.source === "q0" && x.target === "q1");
      const eBack = edges.find((x) => x.source === "q1" && x.target === "q0");

      expect(eForward.sourceHandle).toBe("top-s");
      expect(eForward.targetHandle).toBe("top-t");
      expect(eForward.data.offset).toBeLessThan(0);

      expect(eBack.sourceHandle).toBe("bottom-s");
      expect(eBack.targetHandle).toBe("bottom-t");
      expect(eBack.data.offset).toBeGreaterThan(0);
    });

    it("4) Normale Nachbarkante: nutzt right-s -> left-t, ε hat Dasharray und leichten Up-Offset", () => {
      render(<GraphViewer nfa={nfaWithEpsilonAdjacent} />);
      const edges = getEdgesFromReactFlow();
      expect(edges).toHaveLength(1);

      const e = edges[0];
      expect(e.sourceHandle).toBe("right-s");
      expect(e.targetHandle).toBe("left-t");
      expect(e.label).toBe("ε");
      expect(e.style).toEqual(expect.objectContaining({ strokeDasharray: "6 4" }));
      expect(e.data.offset).toBeLessThan(0);
    });

    it("Mehrfachkanten (gleiches from->to): order beeinflusst offset (zweite Kante stärker negativ)", () => {
      render(<GraphViewer nfa={nfaWithMultiEdgesSamePair} />);
      const edges = getEdgesFromReactFlow();
      expect(edges).toHaveLength(2);

      // In deiner Logik: offset = (isEps ? -55 : 0) + order * -18
      const e0 = edges[0];
      const e1 = edges[1];

      expect(e0.data.offset).toBe(0);
      expect(e1.data.offset).toBe(-18);
    });
  });

  describe("interactive Flag: Props und Callback-Gating", () => {
    it("interactive=false (default): nodesDraggable/nodesConnectable/elementsSelectable sind false", () => {
      render(<GraphViewer nfa={nfaNormal} />);
      const canvas = screen.getByTestId("reactflow");
      expect(canvas).toHaveAttribute("data-draggable", "false");
      expect(canvas).toHaveAttribute("data-connectable", "false");
      expect(canvas).toHaveAttribute("data-selectable", "false");
    });

    it("interactive=true: nodesDraggable/nodesConnectable/elementsSelectable sind true", () => {
      render(<GraphViewer nfa={nfaNormal} interactive />);
      const canvas = screen.getByTestId("reactflow");
      expect(canvas).toHaveAttribute("data-draggable", "true");
      expect(canvas).toHaveAttribute("data-connectable", "true");
      expect(canvas).toHaveAttribute("data-selectable", "true");
    });

    it("interactive=false: onNodesChange/onEdgesChange/onConnect lösen keine apply*/addEdge Aufrufe aus", () => {
      render(<GraphViewer nfa={nfaNormal} interactive={false} />);
      const props = lastReactFlowProps();

      props.onNodesChange([{ type: "position", id: "q0" }]);
      props.onEdgesChange([{ type: "remove", id: "e" }]);
      props.onConnect({ source: "q0", target: "q1" });

      expect(mockApplyNodeChanges).not.toHaveBeenCalled();
      expect(mockApplyEdgeChanges).not.toHaveBeenCalled();
      expect(mockAddEdge).not.toHaveBeenCalled();
    });

    it("interactive=true: onNodesChange/onEdgesChange rufen apply* auf; onConnect ruft addEdge auf und erhöht edges", async () => {
      render(<GraphViewer nfa={nfaNormal} interactive />);
      let props = lastReactFlowProps();

      props.onNodesChange([{ type: "position", id: "q0" }]);
      expect(mockApplyNodeChanges).toHaveBeenCalled();

      props.onEdgesChange([{ type: "remove", id: "e" }]);
      expect(mockApplyEdgeChanges).toHaveBeenCalled();

      const before = Number(screen.getByTestId("reactflow").getAttribute("data-edges-count"));
      props.onConnect({ source: "q0", target: "q1" });

      await waitFor(() => {
        const after = Number(screen.getByTestId("reactflow").getAttribute("data-edges-count"));
        expect(after).toBe(before + 1);
      });

      expect(mockAddEdge).toHaveBeenCalled();

      // Prüfen, dass GraphCanvas die zusätzlichen Felder beim Connect setzt
      const [connArg] = mockAddEdge.mock.calls[0];
      expect(connArg).toEqual(
        expect.objectContaining({
          source: "q0",
          target: "q1",
          type: "offsetBezier",
          animated: true,
          data: { offset: -60 },
          markerEnd: expect.objectContaining({ type: "ArrowClosed", width: 18, height: 18 }),
        })
      );

      // Props wurden nach State-Update erneut gerendert
      props = lastReactFlowProps();
      expect(props).toBeTruthy();
    });
  });

  describe("Reset bei neuem NFA (useEffect + initial)", () => {
    it("setzt nodes/edges zurück, wenn nfa wechselt", async () => {
      const { rerender } = render(<GraphViewer nfa={nfaNormal} />);
      expect(screen.getByTestId("reactflow")).toHaveAttribute("data-nodes-count", "2");
      expect(screen.getByTestId("reactflow")).toHaveAttribute("data-edges-count", "1");

      const nfa2: any = {
        states: ["q0", "q1", "q2"],
        startState: "q1",
        acceptStates: ["q2"],
        transitions: [
          { from: "q0", to: "q1", symbol: "a" },
          { from: "q1", to: "q2", symbol: "b" },
        ],
      };

      rerender(<GraphViewer nfa={nfa2} />);

      await waitFor(() => {
        expect(screen.getByTestId("reactflow")).toHaveAttribute("data-nodes-count", "3");
        expect(screen.getByTestId("reactflow")).toHaveAttribute("data-edges-count", "2");
      });

      // StartState hat sich geändert: q1 sollte y=120 bekommen
      const nodes = getNodesFromReactFlow();
      const q1 = nodes.find((n) => n.id === "q1");
      expect(q1.position.y).toBe(120);
    });
  });
});
