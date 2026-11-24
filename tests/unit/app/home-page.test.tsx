import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page placeholder", () => {
  it("renders a level-one heading and the not-medical-advice note", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Protein Plate" })).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
