import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  delete (globalThis as { __testLocale?: string }).__testLocale;
});

/*
 * `next/root-params` only works inside a Next.js build. Server Components
 * under test get the locale from `globalThis.__testLocale` (default "en").
 */
vi.mock("next/root-params", () => ({
  locale: async () => (globalThis as { __testLocale?: string }).__testLocale ?? "en",
}));

/*
 * jsdom does not implement HTMLDialogElement.showModal/close. This minimal
 * stand-in toggles `open` and fires `close` like a browser does. Real modal
 * behaviour (focus trap, Escape, inert background) comes from the browser's
 * native <dialog>; add e2e coverage once a screen uses Dialog.
 */
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
