/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import GraphViewer from "./GraphViewer";
import type { NFA } from "../../core/models/types";

/* ---------------- Mock Storage für Positionen ---------------- */
const mockNodePositions = new Map<string, { x: number; y: number }>();

/* ---------------- dagre Mock ---------------- */
vi.mock("dagre", () => {
  const Graph = function () {
    return {
      setDefaultEdgeLabel: vi.fn(),
      setGraph: vi.fn(),
      setNode: vi.fn((id: string) => {
        if (!mockNodePositions.has(id)) {
          mockNodePositions.set(id, { x: 100, y: 100 });
        }
      }),
      setEdge: vi.fn(),
      node: vi.fn((id: string) => mockNodePositions.get(id) ?? { x: 100, y: 100 }),
    };
  };

  return {
    __esModule: true,
    default: {
      graphlib: { Graph },
      layout: vi.fn(),
    },
  };
});

/* ---------------- reactflow Mock ---------------- */
const mockReactFlowRender = vi.fn();

vi.mock("reactflow", () => {
  return {
    __esModule: true,
    default: (props: any) => {
      mockReactFlowRender(props);
      return (
        <div
          data-testid="reactflow"
          data-nodes-count={props.nodes?.length ?? 0}
          data-edges-count={props.edges?.length ?? 0}
        >
          {props.children}
        </div>
      );
    },
    MiniMap: () => <div data-testid="rf-minimap" />,
    Controls: () => <div data-testid="rf-controls" />,
    Background: () => <div data-testid="rf-background" />,
    Handle: () => <div data-testid="rf-handle" />,
    Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
    MarkerType: { ArrowClosed: "arrowclosed" },
    BaseEdge: ({ path, markerEnd }: any) => (
      <path data-testid="rf-baseedge" d={path} markerEnd={markerEnd} />
    ),
    EdgeLabelRenderer: ({ children }: any) => (
      <div data-testid="rf-edgelabel">{children}</div>
    ),
    applyNodeChanges: vi.fn((_, nodes) => nodes),
    applyEdgeChanges: vi.fn((_, edges) => edges),
    addEdge: vi.fn((edge, edges) => [...edges, edge]),
  };
});

/* ---------------- Helpers ---------------- */
function getLastRenderProps() {
  const calls = mockReactFlowRender.mock.calls;
  return calls[calls.length - 1]?.[0];
}

function getNodes() {
  return getLastRenderProps()?.nodes ?? [];
}

function getEdges() {
  return getLastRenderProps()?.edges ?? [];
}

/* ---------------- Test Data ---------------- */
const simpleNFA: NFA = {
  name: "Simple",
  regex: "a",
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: ["q1"],
  alphabet: ["a"],
  transitions: [{ from: "q0", to: "q1", symbol: "a" }],
  hasEpsilon: false,
};

const nfaWithSelfLoop: NFA = {
  name: "SelfLoop",
  regex: "a*",
  states: ["q0"],
  startState: "q0",
  acceptStates: ["q0"],
  alphabet: ["a"],
  transitions: [{ from: "q0", to: "q0", symbol: "a" }],
  hasEpsilon: false,
};

const nfaWithEpsilon: NFA = {
  name: "Epsilon",
  regex: "a*",
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: ["q1"],
  alphabet: [],
  transitions: [{ from: "q0", to: "q1", symbol: "ε" }],
  hasEpsilon: true,
};

const nfaWithMultiTransitions: NFA = {
  name: "Multi",
  regex: "(a|b)*",
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: ["q1"],
  alphabet: ["a", "b"],
  transitions: [
    { from: "q0", to: "q1", symbol: "a" },
    { from: "q0", to: "q1", symbol: "b" },
  ],
  hasEpsilon: false,
};

const nfaWithSpanning: NFA = {
  name: "Spanning",
  regex: "a",
  states: ["q0", "q1", "q2"],
  startState: "q0",
  acceptStates: ["q2"],
  alphabet: ["a"],
  transitions: [{ from: "q0", to: "q2", symbol: "a" }],
  hasEpsilon: false,
};

const nfaWithReversePair: NFA = {
  name: "Reverse",
  regex: "ab|ba",
  states: ["q0", "q1"],
  startState: "q0",
  acceptStates: ["q1"],
  alphabet: ["a", "b"],
  transitions: [
    { from: "q0", to: "q1", symbol: "a" },
    { from: "q1", to: "q0", symbol: "b" },
  ],
  hasEpsilon: false,
};

/* ---------------- Tests ---------------- */

describe("GraphViewer", () => {
  beforeEach(() => {
    mockReactFlowRender.mockClear();
    mockNodePositions.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders placeholder when nfa is undefined", () => {
    render(<GraphViewer />);
    expect(screen.getByText(/Graph visualization here/i)).toBeInTheDocument();
  });

  it("renders ReactFlow with minimap, controls and background", () => {
    render(<GraphViewer nfa={simpleNFA} />);
    
    expect(screen.getByTestId("reactflow")).toBeInTheDocument();
    expect(screen.getByTestId("rf-minimap")).toBeInTheDocument();
    expect(screen.getByTestId("rf-controls")).toBeInTheDocument();
    expect(screen.getByTestId("rf-background")).toBeInTheDocument();
  });

  it("creates correct number of nodes and edges", () => {
    render(<GraphViewer nfa={simpleNFA} />);
    
    expect(screen.getByTestId("reactflow")).toHaveAttribute("data-nodes-count", "2");
    expect(screen.getByTestId("reactflow")).toHaveAttribute("data-edges-count", "1");
  });

  it("marks start state with bold border", () => {
    render(<GraphViewer nfa={simpleNFA} />);
    
    const nodes = getNodes();
    const startNode = nodes.find((n: any) => n.id === "q0");
    
    expect(startNode).toBeDefined();
    expect(startNode.data.isStart).toBe(true);
  });

  it("marks accept states with double border", () => {
    render(<GraphViewer nfa={simpleNFA} />);
    
    const nodes = getNodes();
    const acceptNode = nodes.find((n: any) => n.id === "q1");
    
    expect(acceptNode).toBeDefined();
    expect(acceptNode.data.isAccept).toBe(true);
  });

  it("handles self-loop transitions", () => {
    render(<GraphViewer nfa={nfaWithSelfLoop} />);
    
    const edges = getEdges();
    expect(edges).toHaveLength(1);
    
    const selfLoop = edges[0];
    expect(selfLoop.source).toBe("q0");
    expect(selfLoop.target).toBe("q0");
    expect(selfLoop.label).toBe("a");
  });

  it("renders epsilon transitions with dashed style", () => {
    render(<GraphViewer nfa={nfaWithEpsilon} />);
    
    const edges = getEdges();
    const epsilonEdge = edges.find((e: any) => e.label === "ε");
    
    expect(epsilonEdge).toBeDefined();
    expect(epsilonEdge.animated).toBe(true);
  });

  it("merges multiple transitions between same states", () => {
    render(<GraphViewer nfa={nfaWithMultiTransitions} />);
    
    const edges = getEdges();
    // Sollte nur 1 Edge sein mit Label "{a,b}"
    expect(edges).toHaveLength(1);
    expect(edges[0].label).toBe("{a,b}");
  });

  it("handles spanning transitions (distance > 1)", () => {
    render(<GraphViewer nfa={nfaWithSpanning} />);
    
    const edges = getEdges();
    expect(edges).toHaveLength(1);
    
    // q0 -> q2 mit q1 dazwischen (dist = 2)
    const spanEdge = edges[0];
    expect(spanEdge.source).toBe("q0");
    expect(spanEdge.target).toBe("q2");
  });

  it("handles reverse pair transitions", () => {
    render(<GraphViewer nfa={nfaWithReversePair} />);
    
    const edges = getEdges();
    expect(edges).toHaveLength(2);
    
    // q0 -> q1 und q1 -> q0
    const forward = edges.find((e: any) => e.source === "q0" && e.target === "q1");
    const backward = edges.find((e: any) => e.source === "q1" && e.target === "q0");
    
    expect(forward).toBeDefined();
    expect(backward).toBeDefined();
  });

  it("calculates curved paths for reverse pairs", () => {
    render(<GraphViewer nfa={nfaWithReversePair} />);
    
    const edges = getEdges();
    
    // Beide Edges sollten type: 'offsetBezier' haben
    edges.forEach((e: any) => {
      expect(e.type).toBe("offsetBezier");
    });
  });

  it("uses dagre layout for node positioning", () => {
    // Setze spezifische Positionen
    mockNodePositions.set("q0", { x: 200, y: 150 });
    mockNodePositions.set("q1", { x: 400, y: 150 });
    
    render(<GraphViewer nfa={simpleNFA} />);
    
    const nodes = getNodes();
    const q0 = nodes.find((n: any) => n.id === "q0");
    const q1 = nodes.find((n: any) => n.id === "q1");
    
    // Position sollte um 36 Pixel versetzt sein (Zentrierung)
    expect(q0.position.x).toBe(200 - 36);
    expect(q0.position.y).toBe(150 - 36);
    expect(q1.position.x).toBe(400 - 36);
    expect(q1.position.y).toBe(150 - 36);
  });

  it("handles complex NFA with multiple features", () => {
    const complexNFA: NFA = {
      name: "Complex",
      regex: "(a|b)*c",
      states: ["q0", "q1", "q2", "q3"],
      startState: "q0",
      acceptStates: ["q3"],
      alphabet: ["a", "b", "c"],
      transitions: [
        { from: "q0", to: "q1", symbol: "a" },
        { from: "q0", to: "q1", symbol: "b" },
        { from: "q1", to: "q0", symbol: "ε" },
        { from: "q1", to: "q2", symbol: "c" },
        { from: "q2", to: "q3", symbol: "ε" },
      ],
      hasEpsilon: true,
    };

    render(<GraphViewer nfa={complexNFA} />);
    
    expect(screen.getByTestId("reactflow")).toHaveAttribute("data-nodes-count", "4");
    const edges = getEdges();
    expect(edges.length).toBeGreaterThan(0);
  });
});
