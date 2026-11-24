import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, SelectField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { ToastProvider, useToast } from "@/components/ui/toast";

describe("Button", () => {
  it("defaults to type=button so it never submits forms by accident", () => {
    render(<Button>Add to plan</Button>);
    expect(screen.getByRole("button", { name: "Add to plan" })).toHaveAttribute("type", "button");
  });

  it("keeps a 44px minimum touch target in every size", () => {
    for (const size of ["sm", "md"] as const) expect(buttonClasses({ size })).toContain("min-h-11");
    expect(buttonClasses({ size: "lg" })).toContain("min-h-12");
  });
});

describe("Icon", () => {
  it("is hidden from assistive tech unless labelled", () => {
    const { container } = render(<Icon name="today" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    render(<Icon name="close" label="Close" />);
    expect(screen.getByRole("img", { name: "Close" })).toBeInTheDocument();
  });
});

describe("Tag", () => {
  it("renders its text", () => {
    render(<Tag tone="protein">32 g protein</Tag>);
    expect(screen.getByText("32 g protein")).toBeInTheDocument();
  });
});

describe("form fields", () => {
  it("TextField has a visible label and links hint and error", () => {
    render(<TextField label="Daily protein (g)" hint="Most people choose 100–180 g" error="Must be zero or more." />);
    const input = screen.getByLabelText("Daily protein (g)");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Most people choose 100–180 g Must be zero or more.");
  });

  it("TextField is not marked invalid without an error", () => {
    render(<TextField label="Name" />);
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
  });

  it("SelectField is labelled", () => {
    render(
      <SelectField label="Meal type">
        <option>Breakfast</option>
        <option>Snack</option>
      </SelectField>,
    );
    expect(screen.getByRole("combobox", { name: "Meal type" })).toBeInTheDocument();
  });

  it("Checkbox toggles from its label", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Greek yoghurt" />);
    const box = screen.getByRole("checkbox", { name: "Greek yoghurt" });
    await user.click(screen.getByText("Greek yoghurt"));
    expect(box).toBeChecked();
  });
});

describe("Tabs", () => {
  const tabs = [
    { id: "mon", label: "Mon", panel: <p>Monday meals</p> },
    { id: "tue", label: "Tue", panel: <p>Tuesday meals</p> },
    { id: "wed", label: "Wed", panel: <p>Wednesday meals</p> },
  ];

  it("shows the first panel and exposes tab semantics", () => {
    render(<Tabs label="Days" tabs={tabs} />);
    expect(screen.getByRole("tablist", { name: "Days" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mon" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Mon" })).toHaveTextContent("Monday meals");
  });

  it("supports arrow keys with wrap-around, Home, and End", async () => {
    const user = userEvent.setup();
    render(<Tabs label="Days" tabs={tabs} />);
    await user.click(screen.getByRole("tab", { name: "Mon" }));

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tue" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Tue" })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Wed" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Mon" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Wed" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Mon" })).toHaveFocus();
  });

  it("keeps only the selected tab in the Tab order", () => {
    render(<Tabs label="Days" tabs={tabs} defaultTabId="tue" />);
    expect(screen.getByRole("tab", { name: "Tue" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Mon" })).toHaveAttribute("tabindex", "-1");
  });
});

describe("Dialog", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Swap meal</Button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Swap lunch" description="Pick a replacement">
          <p>Options</p>
        </Dialog>
      </>
    );
  }

  it("opens as a labelled modal and closes from the close button", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Swap meal" }));

    const dialog = screen.getByRole("dialog", { name: "Swap lunch" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAccessibleDescription("Pick a replacement");

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function Trigger({ duration }: { duration?: number | null }) {
    const toast = useToast();
    return <Button onClick={() => toast.show({ message: "Added to Tuesday lunch", tone: "success", duration })}>Add</Button>;
  }

  it("announces messages in a polite live region and can be dismissed", async () => {
    const user = userEvent.setup();
    render(<ToastProvider><Trigger duration={null} /></ToastProvider>);
    await user.click(screen.getByRole("button", { name: "Add" }));

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Added to Tuesday lunch");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(region).not.toHaveTextContent("Added to Tuesday lunch");
  });

  it("auto-dismisses after its duration", () => {
    vi.useFakeTimers();
    render(<ToastProvider><Trigger duration={1000} /></ToastProvider>);
    act(() => screen.getByRole("button", { name: "Add" }).click());
    expect(screen.getByRole("status")).toHaveTextContent("Added to Tuesday lunch");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).not.toHaveTextContent("Added to Tuesday lunch");
  });

  it("throws a clear error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow("useToast must be used inside <ToastProvider>");
  });
});
