import { describe, it, expect, vi } from "vitest";
import { scroll } from "../../src/skills/scroll.js";
import { wait } from "../../src/skills/wait.js";
import { waitForSelector } from "../../src/skills/wait-for-selector.js";
import { evaluate } from "../../src/skills/evaluate.js";
import { setViewport } from "../../src/skills/set-viewport.js";
import { uploadFile } from "../../src/skills/upload-file.js";
import { dialogHandle } from "../../src/skills/dialog-handle.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockPage,
  createMockLocator,
} from "../helpers/mock-factories.js";

describe("browser_scroll", () => {
  it("scrolls down by viewport height by default", async () => {
    const page = createMockPage();
    page.viewportSize.mockReturnValue({ width: 1280, height: 720 });
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await scroll.handler({}, ctx);
    expect(page.evaluate).toHaveBeenCalledWith("window.scrollBy(0, 720)");
    expect(result.content).toContain("down");
    expect(result.content).toContain("720");
  });

  it("scrolls up", async () => {
    const page = createMockPage();
    page.viewportSize.mockReturnValue({ width: 1280, height: 720 });
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await scroll.handler({ direction: "up" }, ctx);
    expect(page.evaluate).toHaveBeenCalledWith("window.scrollBy(0, -720)");
    expect(result.content).toContain("up");
  });

  it("scrolls by custom amount", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await scroll.handler({ amount: 300 }, ctx);
    expect(page.evaluate).toHaveBeenCalledWith("window.scrollBy(0, 300)");
    expect(result.content).toContain("300");
  });

  it("scrolls to top edge", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await scroll.handler({ toEdge: "top" }, ctx);
    expect(page.evaluate).toHaveBeenCalledWith("window.scrollTo(0, 0)");
    expect(result.content).toContain("top");
  });

  it("scrolls to bottom edge", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await scroll.handler({ toEdge: "bottom" }, ctx);
    expect(page.evaluate).toHaveBeenCalledWith(
      `window.scrollTo(0, ${Number.MAX_SAFE_INTEGER})`,
    );
    expect(result.content).toContain("bottom");
  });

  it("scrolls element with selector", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    page.viewportSize.mockReturnValue({ width: 1280, height: 720 });
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await scroll.handler({ selector: "#container" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#container");
    expect(locator.evaluate).toHaveBeenCalled();
  });

  it("scrolls element to edge with selector", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await scroll.handler({ selector: "#box", toEdge: "top" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#box");
    expect(locator.evaluate).toHaveBeenCalled();
  });

  it("defaults to 600 when viewport is null", async () => {
    const page = createMockPage();
    page.viewportSize.mockReturnValue(null);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await scroll.handler({}, ctx);
    expect(page.evaluate).toHaveBeenCalledWith("window.scrollBy(0, 600)");
    expect(result.content).toContain("600");
  });
});

describe("browser_wait", () => {
  it("waits for specified milliseconds", async () => {
    const ctx = createMockSkillContext();
    const start = Date.now();
    const result = await wait.handler({ ms: 10 }, ctx);
    expect(result.success).toBe(true);
    expect(result.content).toContain("10");
  });

  it("returns success message", async () => {
    const ctx = createMockSkillContext();
    const result = await wait.handler({ ms: 5 }, ctx);
    expect(result.content).toBe("Waited 5ms");
  });
});

describe("browser_wait_for_selector", () => {
  it("uses default state visible and timeout 10000", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await waitForSelector.handler({ selector: "#el" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#el");
    expect(locator.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 10000 });
    expect(result.success).toBe(true);
    expect(result.content).toContain("visible");
  });

  it("uses custom state and timeout", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await waitForSelector.handler({ selector: ".item", state: "hidden", timeout: 5000 }, ctx);
    expect(locator.waitFor).toHaveBeenCalledWith({ state: "hidden", timeout: 5000 });
  });

  it("validates selector", async () => {
    const ctx = createMockSkillContext();
    await expect(waitForSelector.handler({ selector: "" }, ctx)).rejects.toThrow("empty");
  });
});

describe("browser_evaluate", () => {
  it("returns JSON.stringify result", async () => {
    const page = createMockPage();
    page.evaluate.mockResolvedValue({ key: "value" });
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await evaluate.handler({ expression: "document.title" }, ctx);
    expect(page.evaluate).toHaveBeenCalledWith("document.title");
    expect(result.content).toBe(JSON.stringify({ key: "value" }, null, 2));
    expect(result.success).toBe(true);
  });

  it("returns 'undefined' string for undefined result", async () => {
    const page = createMockPage();
    page.evaluate.mockResolvedValue(undefined);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await evaluate.handler({ expression: "void 0" }, ctx);
    expect(result.content).toBe("undefined");
  });

  it("handles string results", async () => {
    const page = createMockPage();
    page.evaluate.mockResolvedValue("hello");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await evaluate.handler({ expression: "'hello'" }, ctx);
    expect(result.content).toBe('"hello"');
  });
});

describe("browser_set_viewport", () => {
  it("calls page.setViewportSize", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await setViewport.handler({ width: 1920, height: 1080 }, ctx);
    expect(page.setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
    expect(result.success).toBe(true);
    expect(result.content).toContain("1920x1080");
  });
});

describe("browser_upload_file", () => {
  it("calls locator.setInputFiles", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await uploadFile.handler(
      { selector: "input[type=file]", filePath: "/tmp/test.png" },
      ctx,
    );
    expect(page.locator).toHaveBeenCalledWith("input[type=file]");
    expect(locator.setInputFiles).toHaveBeenCalledWith("/tmp/test.png");
    expect(result.success).toBe(true);
  });

  it("validates selector", async () => {
    const ctx = createMockSkillContext();
    await expect(
      uploadFile.handler({ selector: "", filePath: "/tmp/f.txt" }, ctx),
    ).rejects.toThrow("empty");
  });
});

describe("browser_dialog_handle", () => {
  it("registers accept handler via page.once", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await dialogHandle.handler({ action: "accept" }, ctx);
    expect(page.once).toHaveBeenCalledWith("dialog", expect.any(Function));
    expect(result.success).toBe(true);
    expect(result.content).toContain("accept");
  });

  it("registers dismiss handler", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await dialogHandle.handler({ action: "dismiss" }, ctx);
    expect(result.content).toContain("dismiss");
  });

  it("accept handler calls dialog.accept with promptText", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await dialogHandle.handler({ action: "accept", promptText: "my input" }, ctx);
    // Simulate dialog event
    const callback = page.once.mock.calls[0]![1] as (dialog: any) => Promise<void>;
    const mockDialog = { accept: vi.fn(), dismiss: vi.fn() };
    await callback(mockDialog);
    expect(mockDialog.accept).toHaveBeenCalledWith("my input");
  });

  it("dismiss handler calls dialog.dismiss", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await dialogHandle.handler({ action: "dismiss" }, ctx);
    const callback = page.once.mock.calls[0]![1] as (dialog: any) => Promise<void>;
    const mockDialog = { accept: vi.fn(), dismiss: vi.fn() };
    await callback(mockDialog);
    expect(mockDialog.dismiss).toHaveBeenCalled();
  });
});
