import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HabitForm } from "@/components/Habits";

describe("HabitForm", () => {
  it("submits a new habit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<HabitForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.type(screen.getByPlaceholderText("Morning stretch"), "Drink water");
    await user.click(screen.getByRole("button", { name: "Create habit" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Drink water",
        scheduleType: "daily",
      }),
    );
  });
});
