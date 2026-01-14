/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
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

    // Wichtig: keine Props spreaden -> sonst React Warnung (nodeStrokeColor etc.)
    MiniMap: () => <div data-testid="rf-minimap" />,
    Controls: () => <div data-testid="rf-controls" />,
    Background: () => <div data-testid="rf-background" />,

    applyNodeChanges: (changes: any, nodes: any[]) => mockApplyNodeChanges(changes, nodes),
    applyEdgeChanges: (changes: any, edges: any[]) => mockApplyEdgeChanges(changes, edges),
    addEdge: (conn: any, edges: any[]) => mockAddEdge(conn, edges),

    MarkerType: { ArrowClosed: "ArrowClosed" },
    Handle: () => <div data-testid="rf-handle" />,
    Position: { Top: "Top", Right: "Right", Bottom: "Bottom", Left: "Left" },
    BaseEdge: (props: any) => <div data-testid="rf-baseedge" {...props} />,
    EdgeLabelRenderer: ({ children }: any) => <div data-testid="rf-edgelabel">{children}</div>,
  };
});

/* ---------------- dagre Mock ---------------- */

vi.mock("dagre", () => {
  const nodes = new Map<string, { x: number; y: number }>();

  const Graph = function () {
    return {
      setDefaultEdgeLabel: vi.fn(),
      setGraph: vi.fn(),
      setNode: vi.fn((id: string) => {
        if (!nodes.has(id)) nodes.set(id, { x: 100, y: 100 });
      }),
      setEdge: vi.fn(),
      node: vi.fn((id: string) => nodes.get(id) ?? { x: 100, y: 100 }),
    };
  };

  return {
    __esModule: true,
    default: {
      graphlib: { Graph },
      layout: vi.fn(),
      __setNodePos: (id: string, x: number, y: number) => nodes.set(id, { x, y }),
      __reset: () => nodes.clear(),
    },
  };
});

import dagre from "dagre";
const dagreMock = dagre as unknown as {
  layout: ReturnType<typeof vi.fn>;
  __setNodePos: (id: string, x: number, y: number) => void;
  __reset: () => void;
};

/* ---------------- Helpers ---------------- */

function lastReactFlowProps() {
  const calls = mockReactFlow.mock.calls;
  return calls[calls.length - 1]?.[0];
}

function getEdges() {
  return (lastReactFlowProps()?.edges ?? []) as any[];
}

function getNodes() {
  return (lastReactFlowProps()?.nodes ?? []) as any[];
}

/* ---------------- Testdaten ---------------- */

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
  transitions: [{ from: "q0", to: "q2", symbol: "a" }], // dist=2
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
    { from: "q0", to: "q1", symbol: "b" },
  ],
};

/* ---------------- Tests ---------------- */

describe("GraphViewer", () => {
  beforeEach(() => {
    mockReactFlow.mockClear();
    mockApplyNodeChanges.mockClear();
    mockApplyEdgeChanges.mockClear();
    mockAddEdge.mockClear();

    dagreMock.__reset();
    dagreMock.layout.mockClear();
  });

  it("renders placeholder when nfa is undefined", () => {
    render(<GraphViewer />);
    expect(screen.getByText(/Graph visualization here/i)).toBeInTheDocument();
  });

  it("renders ReactFlow + minimap/controls/background", () => {
    render(<GraphViewer nfa={nfaNormal} />);
    expect(screen.getByTestId("reactflow")).toBeInTheDocument();
    expect(screen.getByTestId("rf-minimap")).toBeInTheDocument();
    expect(screen.getByTestId("rf-controls")).toBeInTheDocument();
    expect(screen.getByTestId("rf-background")).toBeInTheDocument();
  });

  it("node layout: uses dagre positions (center -> top-left) and calls dagre.layout", () => {
    // dagre liefert Mittelpunkt; Komponente nutzt linke obere Ecke (x-36, y-36)
    dagreMock.__setNodePos("q0", 200, 120);
    dagreMock.__setNodePos("q1", 400, 220);
    dagreMock.__setNodePos("q2", 600, 220);

    render(
      <GraphViewer
        nfa={{
          ...nfaNormal,
          states: ["q0", "q1", "q2"],
          acceptStates: [],
          transitions: [{ from: "q0", to: "q1", symbol: "a" }],
        }}
      />
    );

    expect(dagreMock.layout).toHaveBeenCalled();

    const ns = getNodes();
    expect(ns.find((n) => n.id === "q0")?.position).toEqual({ x: 200 - 36, y: 120 - 36 });
    expect(ns.find((n) => n.id === "q1")?.position).toEqual({ x: 400 - 36, y: 220 - 36 });
    expect(ns.find((n) => n.id === "q2")?.position).toEqual({ x: 600 - 36, y: 220 - 36 });
  });

  it("edge branch 1: self-loop", () => {
    render(<GraphViewer nfa={nfaWithLoop} />);
    const e = getEdges()[0];
    expect(e.sourceHandle).toBe("right-s");
    expect(e.targetHandle).toBe("top-t");
    expect(e.data.offset).toBeLessThan(0);
  });

  it("edge branch 2: spanning dist>1", () => {
    render(<GraphViewer nfa={nfaWithSpanning} />);
    const e = getEdges()[0];
    expect(e.sourceHandle).toBe("top-s");
    expect(e.targetHandle).toBe("top-t");
    expect(e.data.offset).toBeLessThan(-100);
  });

  it("edge branch 3: reverse pair up/down", () => {
    render(<GraphViewer nfa={nfaWithReversePair} />);
    const es = getEdges();
    const forward = es.find((x) => x.source === "q0" && x.target === "q1");
    const back = es.find((x) => x.source === "q1" && x.target === "q0");

    expect(forward).toBeTruthy();
    expect(back).toBeTruthy();

    expect(forward.sourceHandle).toBe("top-s");
    expect(back.sourceHandle).toBe("bottom-s");
  });

  it("edge branch 4: adjacent epsilon has dasharray + offset<0", () => {
    render(<GraphViewer nfa={nfaWithEpsilonAdjacent} />);
    const e = getEdges()[0];
    expect(e.sourceHandle).toBe("right-s");
    expect(e.targetHandle).toBe("left-t");
    expect(e.style).toEqual(expect.objectContaining({ strokeDasharray: "6 4" }));
    expect(e.data.offset).toBeLessThan(0);
  });

  it("multiple transitions same from->to: merges into a single edge with combined label", () => {
    render(<GraphViewer nfa={nfaWithMultiEdgesSamePair} />);
    const es = getEdges();

    expect(es).toHaveLength(1);
    expect(es[0].label).toBe("{a,b}");
    expect(es[0].sourceHandle).toBe("right-s");
    expect(es[0].targetHandle).toBe("left-t");
  });

  it("interactive=false: callbacks do nothing", () => {
    render(<GraphViewer nfa={nfaNormal} interactive={false} />);
    const p = lastReactFlowProps();

    p.onNodesChange([{ id: "q0" }]);
    p.onEdgesChange([{ id: "e" }]);
    p.onConnect({ source: "q0", target: "q1" });

    expect(mockApplyNodeChanges).not.toHaveBeenCalled();
    expect(mockApplyEdgeChanges).not.toHaveBeenCalled();
    expect(mockAddEdge).not.toHaveBeenCalled();
  });

  it("interactive=true: onConnect calls addEdge and increases edges", async () => {
    render(<GraphViewer nfa={nfaNormal} interactive />);
    const p = lastReactFlowProps();

    const before = Number(screen.getByTestId("reactflow").getAttribute("data-edges-count"));

    await act(async () => {
      p.onConnect({ source: "q0", target: "q1" });
    });

    await waitFor(() => {
      const after = Number(screen.getByTestId("reactflow").getAttribute("data-edges-count"));
      expect(after).toBe(before + 1);
    });

    expect(mockAddEdge).toHaveBeenCalled();
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
  });
});
