import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WordSimulationPanel from "./WordSimulationPanel";
import type { DFA } from "../../core/models/types";
import type { SimulationResult } from "../../core/algorithm/simulateDfaRun";
import { simulateDfaRun } from "../../core/algorithm/simulateDfaRun";

vi.mock("@tolgee/react", () => ({
  useTranslate: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "simulation.errors.noTransition" && params) {
        return `No transition for symbol "${params.symbol}" from state "${params.state}"`;
      }
      return key;
    },
  }),
}));

vi.mock("../../core/algorithm/simulateDfaRun", () => ({
  simulateDfaRun: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

const mockedSimulateDfaRun = vi.mocked(simulateDfaRun);

const mockDfa = {
  states: [
    { id: "A", isStart: true, isAccept: false },
    { id: "B", isStart: false, isAccept: true },
  ],
  alphabet: ["a", "b"],
  transitions: [],
  startStateId: "A",
  acceptStateIds: ["B"],
} as unknown as DFA;

function createNormalSimulationResult(): SimulationResult {
  return {
    accepted: true,
    stoppedEarly: false,
    finalStateId: "B",
    steps: [
      {
        stepIndex: 0,
        currentStateId: "A",
        currentSymbol: "a",
        consumed: "",
        remaining: "ab",
      },
      {
        stepIndex: 1,
        currentStateId: "B",
        currentSymbol: "b",
        consumed: "a",
        remaining: "b",
      },
      {
        stepIndex: 2,
        currentStateId: "B",
        currentSymbol: null,
        consumed: "ab",
        remaining: "",
      },
    ],
  };
}

function createStoppedEarlyResult(): SimulationResult {
  return {
    accepted: false,
    stoppedEarly: true,
    finalStateId: "B",
    steps: [
      {
        stepIndex: 0,
        currentStateId: "A",
        currentSymbol: "a",
        consumed: "",
        remaining: "ac",
      },
      {
        stepIndex: 1,
        currentStateId: "B",
        currentSymbol: "c",
        consumed: "a",
        remaining: "c",
      },
    ],
  };
}

describe("WordSimulationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables input and start button when dfa is null", () => {
    render(<WordSimulationPanel dfa={null} />);

    const input = screen.getByPlaceholderText("simulation.inputPlaceholder");
    const startButton = screen.getByRole("button", {
      name: "simulation.buttons.start",
    });

    expect(input).toBeDisabled();
    expect(startButton).toBeDisabled();
  });

  it("starts simulation and shows the first step", async () => {
    const user = userEvent.setup();
    const onActiveStateChange = vi.fn();

    mockedSimulateDfaRun.mockReturnValue(createNormalSimulationResult());

    render(
      <WordSimulationPanel
        dfa={mockDfa}
        onActiveStateChange={onActiveStateChange}
      />
    );

    const input = screen.getByPlaceholderText("simulation.inputPlaceholder");
    const startButton = screen.getByRole("button", {
      name: "simulation.buttons.start",
    });

    await user.type(input, "ab");
    await user.click(startButton);

    expect(mockedSimulateDfaRun).toHaveBeenCalledWith(mockDfa, "ab");
    expect(onActiveStateChange).toHaveBeenCalledWith("A");

    expect(screen.getByText(/simulation\.step/i)).toBeInTheDocument();
    expect(screen.getByText(/simulation\.currentState/i)).toBeInTheDocument();
    expect(screen.getByText(/simulation\.wordProgress/i)).toBeInTheDocument();
  });

  it("moves forward and backward through simulation steps", async () => {
    const user = userEvent.setup();
    const onActiveStateChange = vi.fn();

    mockedSimulateDfaRun.mockReturnValue(createNormalSimulationResult());

    render(
      <WordSimulationPanel
        dfa={mockDfa}
        onActiveStateChange={onActiveStateChange}
      />
    );

    await user.type(
      screen.getByPlaceholderText("simulation.inputPlaceholder"),
      "ab"
    );
    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.start" })
    );

    const nextButton = screen.getByRole("button", {
      name: "simulation.buttons.next",
    });
    const backButton = screen.getByRole("button", {
      name: "simulation.buttons.back",
    });

    expect(backButton).toBeDisabled();

    await user.click(nextButton);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(onActiveStateChange).toHaveBeenLastCalledWith("B");

    await user.click(backButton);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(onActiveStateChange).toHaveBeenLastCalledWith("A");
  });

  it("disables next button on the last step", async () => {
    const user = userEvent.setup();

    mockedSimulateDfaRun.mockReturnValue(createNormalSimulationResult());

    render(<WordSimulationPanel dfa={mockDfa} />);

    await user.type(
      screen.getByPlaceholderText("simulation.inputPlaceholder"),
      "ab"
    );
    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.start" })
    );

    const nextButton = screen.getByRole("button", {
      name: "simulation.buttons.next",
    });

    await user.click(nextButton);
    await user.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it("shows empty input message when starting with an empty word", async () => {
    const user = userEvent.setup();

    mockedSimulateDfaRun.mockReturnValue({
      accepted: true,
      stoppedEarly: false,
      finalStateId: "A",
      steps: [
        {
          stepIndex: 0,
          currentStateId: "A",
          currentSymbol: null,
          consumed: "",
          remaining: "",
        },
      ],
    });

    render(<WordSimulationPanel dfa={mockDfa} />);

    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.start" })
    );

    expect(screen.getByText("simulation.emptyInput")).toBeInTheDocument();
  });

  it("shows stopped-early error on the last step", async () => {
    const user = userEvent.setup();

    mockedSimulateDfaRun.mockReturnValue(createStoppedEarlyResult());

    render(<WordSimulationPanel dfa={mockDfa} />);

    await user.type(
      screen.getByPlaceholderText("simulation.inputPlaceholder"),
      "ac"
    );
    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.start" })
    );

    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.next" })
    );

    expect(screen.getByText(/No transition for symbol/i)).toBeInTheDocument();
    expect(screen.getByText(/stoppedEarly/i)).toBeInTheDocument();
});

  it("resets the panel and clears active state", async () => {
    const user = userEvent.setup();
    const onActiveStateChange = vi.fn();

    mockedSimulateDfaRun.mockReturnValue(createNormalSimulationResult());

    render(
      <WordSimulationPanel
        dfa={mockDfa}
        onActiveStateChange={onActiveStateChange}
      />
    );

    const input = screen.getByPlaceholderText(
      "simulation.inputPlaceholder"
    ) as HTMLInputElement;

    await user.type(input, "ab");
    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.start" })
    );

    expect(screen.getByText(/simulation\.step/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "simulation.buttons.reset" })
    );

    expect(input.value).toBe("");
    expect(
      screen.queryByText(/simulation\.wordProgress/i)
    ).not.toBeInTheDocument();
    expect(onActiveStateChange).toHaveBeenLastCalledWith(null);
  });
});