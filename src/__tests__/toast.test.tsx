/**
 * Toast Component Tests
 *
 * Tests the toast notification system including:
 * - Toast rendering with different types
 * - Auto-dismiss functionality
 * - Manual dismissal
 * - useToast hook functionality
 * - Accessibility attributes
 * - Animation states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastContainer, useToast, type Toast } from "../components/ui/toast";

// Note: crypto.randomUUID is used for ID generation but we don't need to mock it
// since we're testing behavior, not specific IDs

describe("ToastContainer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should render multiple toasts", () => {
    const toasts: Toast[] = [
      { id: "1", message: "First toast", type: "info" },
      { id: "2", message: "Second toast", type: "success" },
    ];

    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(screen.getByText("First toast")).toBeInTheDocument();
    expect(screen.getByText("Second toast")).toBeInTheDocument();
  });

  it("should render toast with info type", () => {
    const toasts: Toast[] = [
      { id: "1", message: "Information", type: "info" },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Information");
  });

  it("should render toast with success type", () => {
    const toasts: Toast[] = [
      { id: "1", message: "Operation successful", type: "success" },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Operation successful");
  });

  it("should render toast with warning type", () => {
    const toasts: Toast[] = [
      { id: "1", message: "Warning message", type: "warning" },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Warning message");
  });

  it("should render toast with error type and alert role", () => {
    const toasts: Toast[] = [
      { id: "1", message: "Error occurred", type: "error" },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("alert");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Error occurred");
  });

  it("should default to info type when type is not specified", () => {
    const toasts: Toast[] = [{ id: "1", message: "Default toast" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should auto-dismiss toast after default duration", async () => {
    const toasts: Toast[] = [{ id: "1", message: "Auto dismiss" }];
    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(screen.getByText("Auto dismiss")).toBeInTheDocument();

    // Fast-forward past the default duration (5000ms) + exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(5300);
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("1");
    });
  });

  it("should auto-dismiss toast after custom duration", async () => {
    const toasts: Toast[] = [
      { id: "1", message: "Custom duration", duration: 2000 },
    ];
    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    // Fast-forward past custom duration (2000ms) + exit animation (300ms)
    act(() => {
      vi.advanceTimersByTime(2300);
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("1");
    });
  });

  it("should manually dismiss toast when close button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const toasts: Toast[] = [{ id: "1", message: "Manual dismiss" }];
    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole("button", {
      name: /dismiss notification/i,
    });
    await user.click(dismissButton);

    // Fast-forward exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("1");
    });
  });

  it("should have accessible close button", () => {
    const toasts: Toast[] = [{ id: "1", message: "Test" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const dismissButton = screen.getByRole("button", {
      name: /dismiss notification/i,
    });
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton).toHaveAttribute("aria-label", "Dismiss notification");
  });

  it("should have correct ARIA attributes for info toast", () => {
    const toasts: Toast[] = [{ id: "1", message: "Info", type: "info" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  it("should have correct ARIA attributes for error toast", () => {
    const toasts: Toast[] = [{ id: "1", message: "Error", type: "error" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("alert");
    expect(toast).toHaveAttribute("aria-live", "assertive");
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  it("should render toast icons", () => {
    const toasts: Toast[] = [
      { id: "1", message: "Info", type: "info" },
      { id: "2", message: "Success", type: "success" },
      { id: "3", message: "Warning", type: "warning" },
      { id: "4", message: "Error", type: "error" },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    // Each toast should have an SVG icon
    const svgs = screen.getAllByRole("img", { hidden: true });
    expect(svgs.length).toBeGreaterThanOrEqual(toasts.length);
  });

  it("should cleanup timer on unmount", () => {
    const toasts: Toast[] = [{ id: "1", message: "Test" }];
    const onDismiss = vi.fn();

    const { unmount } = render(
      <ToastContainer toasts={toasts} onDismiss={onDismiss} />,
    );

    unmount();

    // Advance timers to ensure cleanup happened
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("should render empty container when no toasts", () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={vi.fn()} />,
    );

    // Container should exist but be empty
    expect(container.querySelector("div")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("useToast hook", () => {
  // Test component that uses the hook
  function TestComponent() {
    const toast = useToast();

    return (
      <div>
        <button onClick={() => toast.addToast("Test message", "info")}>
          Add Toast
        </button>
        <button onClick={() => toast.showInfo("Info message")}>
          Show Info
        </button>
        <button onClick={() => toast.showSuccess("Success message")}>
          Show Success
        </button>
        <button onClick={() => toast.showWarning("Warning message")}>
          Show Warning
        </button>
        <button onClick={() => toast.showError("Error message")}>
          Show Error
        </button>
        <button
          onClick={() => {
            if (toast.toasts[0]) {
              toast.dismissToast(toast.toasts[0].id);
            }
          }}
        >
          Dismiss
        </button>
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should add toast with addToast", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Add Toast"));

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should add info toast with showInfo", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Show Info"));

    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should add success toast with showSuccess", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("should add warning toast with showWarning", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Show Warning"));

    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should add error toast with showError", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Show Error"));

    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should generate unique IDs for each toast", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Show Info"));
    await user.click(screen.getByText("Show Success"));

    const toasts = screen.getAllByRole("status");
    expect(toasts).toHaveLength(2);
  });

  it("should dismiss toast", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Add Toast"));
    expect(screen.getByText("Test message")).toBeInTheDocument();

    await user.click(screen.getByText("Dismiss"));

    // The toast should be removed from state
    await waitFor(() => {
      expect(screen.queryByText("Test message")).not.toBeInTheDocument();
    });
  });

  it("should support custom duration", async () => {
    function CustomDurationComponent() {
      const toast = useToast();

      return (
        <div>
          <button onClick={() => toast.showInfo("Quick", 1000)}>
            Quick Toast
          </button>
          <ToastContainer
            toasts={toast.toasts}
            onDismiss={toast.dismissToast}
          />
        </div>
      );
    }

    const user = userEvent.setup({ delay: null });
    render(<CustomDurationComponent />);

    await user.click(screen.getByText("Quick Toast"));
    expect(screen.getByText("Quick")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    await waitFor(() => {
      expect(screen.queryByText("Quick")).not.toBeInTheDocument();
    });
  });

  it("should stack multiple toasts", async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestComponent />);

    await user.click(screen.getByText("Show Info"));
    await user.click(screen.getByText("Show Success"));
    await user.click(screen.getByText("Show Error"));

    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });
});

describe("Toast Visual States", () => {
  it("should apply correct color classes for info type", () => {
    const toasts: Toast[] = [{ id: "1", message: "Info", type: "info" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast.className).toContain("blue");
  });

  it("should apply correct color classes for success type", () => {
    const toasts: Toast[] = [{ id: "1", message: "Success", type: "success" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast.className).toContain("green");
  });

  it("should apply correct color classes for warning type", () => {
    const toasts: Toast[] = [{ id: "1", message: "Warning", type: "warning" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("status");
    expect(toast.className).toContain("amber");
  });

  it("should apply correct color classes for error type", () => {
    const toasts: Toast[] = [{ id: "1", message: "Error", type: "error" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const toast = screen.getByRole("alert");
    expect(toast.className).toContain("red");
  });
});

describe("Toast Edge Cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle very long messages", () => {
    const longMessage = "A".repeat(500);
    const toasts: Toast[] = [{ id: "1", message: longMessage }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("should handle messages with special characters", () => {
    const specialMessage = "Error: <script>alert('xss')</script>";
    const toasts: Toast[] = [{ id: "1", message: specialMessage }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    // React should escape the content automatically
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it("should handle empty message", () => {
    const toasts: Toast[] = [{ id: "1", message: "" }];

    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    // Toast should render even with empty message
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should handle rapid successive toasts", async () => {
    function RapidToastComponent() {
      const toast = useToast();

      return (
        <div>
          <button
            onClick={() => {
              toast.showInfo("Toast 1");
              toast.showInfo("Toast 2");
              toast.showInfo("Toast 3");
            }}
          >
            Add Multiple
          </button>
          <ToastContainer
            toasts={toast.toasts}
            onDismiss={toast.dismissToast}
          />
        </div>
      );
    }

    const user = userEvent.setup({ delay: null });
    render(<RapidToastComponent />);

    await user.click(screen.getByText("Add Multiple"));

    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
  });

  it("should handle zero duration (edge case)", async () => {
    const toasts: Toast[] = [
      { id: "1", message: "Instant dismiss", duration: 0 },
    ];
    const onDismiss = vi.fn();

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("1");
    });
  });
});
