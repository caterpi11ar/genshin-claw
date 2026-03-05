import { describe, it, expect, vi } from "vitest";
import { click } from "../../src/skills/click.js";
import { fill } from "../../src/skills/fill.js";
import { typeText } from "../../src/skills/type-text.js";
import { hover } from "../../src/skills/hover.js";
import { check } from "../../src/skills/check.js";
import { pressKey } from "../../src/skills/press-key.js";
import { selectOption } from "../../src/skills/select-option.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockPage,
  createMockLocator,
} from "../helpers/mock-factories.js";

describe("browser_click", () => {
  it("validates selector and calls page.click", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await click.handler({ selector: "#btn" }, ctx);
    expect(page.click).toHaveBeenCalledWith("#btn", {
      button: undefined,
      clickCount: undefined,
      timeout: 5000,
    });
    expect(result.success).toBe(true);
    expect(result.content).toContain("#btn");
  });

  it("passes custom button and clickCount", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await click.handler({ selector: "a", button: "right", clickCount: 2, timeout: 3000 }, ctx);
    expect(page.click).toHaveBeenCalledWith("a", {
      button: "right",
      clickCount: 2,
      timeout: 3000,
    });
  });

  it("returns failure on empty selector without coordinates", async () => {
    const ctx = createMockSkillContext();
    const result = await click.handler({ selector: "" }, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("required");
  });

  it("uses default timeout of 5000", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await click.handler({ selector: "div" }, ctx);
    expect(page.click).toHaveBeenCalledWith("div", expect.objectContaining({ timeout: 5000 }));
  });
});

describe("browser_fill", () => {
  it("validates selector and calls page.fill", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await fill.handler({ selector: "#input", value: "hello" }, ctx);
    expect(page.fill).toHaveBeenCalledWith("#input", "hello", { timeout: 5000 });
    expect(result.success).toBe(true);
  });

  it("uses custom timeout", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await fill.handler({ selector: "input", value: "x", timeout: 1000 }, ctx);
    expect(page.fill).toHaveBeenCalledWith("input", "x", { timeout: 1000 });
  });

  it("throws on empty selector", async () => {
    const ctx = createMockSkillContext();
    await expect(fill.handler({ selector: "", value: "x" }, ctx)).rejects.toThrow("empty");
  });
});

describe("browser_type", () => {
  it("validates selector and calls locator.pressSequentially", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await typeText.handler({ selector: "#search", text: "hello" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#search");
    expect(locator.pressSequentially).toHaveBeenCalledWith("hello", {
      delay: undefined,
      timeout: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("passes delay and timeout options", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await typeText.handler({ selector: "input", text: "ab", delay: 50, timeout: 2000 }, ctx);
    expect(locator.pressSequentially).toHaveBeenCalledWith("ab", { delay: 50, timeout: 2000 });
  });

  it("throws on empty selector", async () => {
    const ctx = createMockSkillContext();
    await expect(typeText.handler({ selector: "", text: "x" }, ctx)).rejects.toThrow("empty");
  });
});

describe("browser_hover", () => {
  it("validates selector and calls page.hover", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await hover.handler({ selector: ".link" }, ctx);
    expect(page.hover).toHaveBeenCalledWith(".link", { timeout: 5000 });
    expect(result.success).toBe(true);
    expect(result.content).toContain(".link");
  });

  it("uses custom timeout", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await hover.handler({ selector: "a", timeout: 1000 }, ctx);
    expect(page.hover).toHaveBeenCalledWith("a", { timeout: 1000 });
  });

  it("throws on empty selector", async () => {
    const ctx = createMockSkillContext();
    await expect(hover.handler({ selector: "" }, ctx)).rejects.toThrow("empty");
  });
});

describe("browser_check", () => {
  it("calls page.check when checked is true (default)", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await check.handler({ selector: "#cb" }, ctx);
    expect(page.check).toHaveBeenCalledWith("#cb", { timeout: 5000 });
    expect(result.content).toContain("Checked");
  });

  it("calls page.uncheck when checked is false", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await check.handler({ selector: "#cb", checked: false }, ctx);
    expect(page.uncheck).toHaveBeenCalledWith("#cb", { timeout: 5000 });
    expect(result.content).toContain("Unchecked");
  });

  it("validates selector", async () => {
    const ctx = createMockSkillContext();
    await expect(check.handler({ selector: "" }, ctx)).rejects.toThrow("empty");
  });

  it("passes custom timeout", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await check.handler({ selector: "#cb", checked: true, timeout: 2000 }, ctx);
    expect(page.check).toHaveBeenCalledWith("#cb", { timeout: 2000 });
  });
});

describe("browser_press_key", () => {
  it("presses key on page keyboard when no selector", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await pressKey.handler({ key: "Enter" }, ctx);
    expect(page.keyboard.press).toHaveBeenCalledWith("Enter");
    expect(result.success).toBe(true);
    expect(result.content).toContain("Enter");
  });

  it("presses key on locator when selector provided", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await pressKey.handler({ key: "Tab", selector: "#input" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#input");
    expect(locator.press).toHaveBeenCalledWith("Tab");
    expect(result.success).toBe(true);
  });

  it("handles key combinations", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await pressKey.handler({ key: "Control+A" }, ctx);
    expect(page.keyboard.press).toHaveBeenCalledWith("Control+A");
    expect(result.content).toContain("Control+A");
  });
});

describe("browser_select_option", () => {
  it("selects by value", async () => {
    const locator = createMockLocator();
    locator.selectOption.mockResolvedValue(["val1"]);
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await selectOption.handler({ selector: "select", value: "val1" }, ctx);
    expect(locator.selectOption).toHaveBeenCalledWith({ value: "val1" }, { timeout: 5000 });
    expect(result.success).toBe(true);
    expect(result.content).toContain("val1");
  });

  it("selects by label", async () => {
    const locator = createMockLocator();
    locator.selectOption.mockResolvedValue(["opt"]);
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await selectOption.handler({ selector: "select", label: "Option A" }, ctx);
    expect(locator.selectOption).toHaveBeenCalledWith({ label: "Option A" }, { timeout: 5000 });
    expect(result.success).toBe(true);
  });

  it("selects by index", async () => {
    const locator = createMockLocator();
    locator.selectOption.mockResolvedValue(["idx0"]);
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await selectOption.handler({ selector: "select", index: 0 }, ctx);
    expect(locator.selectOption).toHaveBeenCalledWith({ index: 0 }, { timeout: 5000 });
    expect(result.success).toBe(true);
  });

  it("returns failure when no option specified", async () => {
    const locator = createMockLocator();
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await selectOption.handler({ selector: "select" }, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("Must provide one of");
  });

  it("validates selector", async () => {
    const ctx = createMockSkillContext();
    await expect(
      selectOption.handler({ selector: "", value: "x" }, ctx),
    ).rejects.toThrow("empty");
  });
});
