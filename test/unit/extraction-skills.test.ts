import { describe, it, expect, vi } from "vitest";
import { extractText } from "../../src/skills/extract-text.js";
import { extractHtml } from "../../src/skills/extract-html.js";
import { getAttribute } from "../../src/skills/get-attribute.js";
import { screenshot } from "../../src/skills/screenshot.js";
import { pdf } from "../../src/skills/pdf.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockPage,
  createMockLocator,
} from "../helpers/mock-factories.js";

describe("browser_extract_text", () => {
  it("uses 'body' when no selector provided", async () => {
    const locator = createMockLocator();
    locator.innerText.mockResolvedValue("page text");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await extractText.handler({}, ctx);
    expect(page.locator).toHaveBeenCalledWith("body");
    expect(result.content).toBe("page text");
    expect(result.success).toBe(true);
  });

  it("validates and uses provided selector", async () => {
    const locator = createMockLocator();
    locator.innerText.mockResolvedValue("element text");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await extractText.handler({ selector: "#content" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#content");
    expect(result.content).toBe("element text");
  });

  it("passes empty selector to locator (not nullish, skips validation)", async () => {
    const locator = createMockLocator();
    locator.innerText.mockResolvedValue("body text");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    // empty string is falsy so validation is skipped, but ?? doesn't replace ""
    const result = await extractText.handler({ selector: "" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("");
    expect(result.success).toBe(true);
  });
});

describe("browser_extract_html", () => {
  it("returns innerHTML by default", async () => {
    const locator = createMockLocator();
    locator.innerHTML.mockResolvedValue("<p>inner</p>");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await extractHtml.handler({}, ctx);
    expect(page.locator).toHaveBeenCalledWith("html");
    expect(locator.innerHTML).toHaveBeenCalled();
    expect(result.content).toBe("<p>inner</p>");
  });

  it("returns outerHTML when outer=true", async () => {
    const locator = createMockLocator();
    locator.evaluate.mockResolvedValue("<div><p>outer</p></div>");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await extractHtml.handler({ outer: true }, ctx);
    expect(locator.evaluate).toHaveBeenCalled();
    expect(result.content).toBe("<div><p>outer</p></div>");
  });

  it("uses custom selector", async () => {
    const locator = createMockLocator();
    locator.innerHTML.mockResolvedValue("<span>hi</span>");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await extractHtml.handler({ selector: ".content" }, ctx);
    expect(page.locator).toHaveBeenCalledWith(".content");
  });

  it("passes empty selector to locator (not nullish, skips validation)", async () => {
    const locator = createMockLocator();
    locator.innerHTML.mockResolvedValue("<html></html>");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    // empty string is falsy so validation is skipped, but ?? doesn't replace ""
    const result = await extractHtml.handler({ selector: "" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("");
    expect(result.success).toBe(true);
  });
});

describe("browser_get_attribute", () => {
  it("returns attribute value", async () => {
    const locator = createMockLocator();
    locator.getAttribute.mockResolvedValue("my-class");
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await getAttribute.handler({ selector: "div", attribute: "class" }, ctx);
    expect(locator.getAttribute).toHaveBeenCalledWith("class");
    expect(result.content).toBe("my-class");
    expect(result.success).toBe(true);
  });

  it("returns '(null)' when attribute not found", async () => {
    const locator = createMockLocator();
    locator.getAttribute.mockResolvedValue(null);
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await getAttribute.handler({ selector: "div", attribute: "data-x" }, ctx);
    expect(result.content).toBe("(null)");
  });

  it("validates selector", async () => {
    const ctx = createMockSkillContext();
    await expect(
      getAttribute.handler({ selector: "", attribute: "id" }, ctx),
    ).rejects.toThrow("empty");
  });
});

describe("browser_screenshot", () => {
  it("takes full page screenshot by default", async () => {
    const page = createMockPage();
    page.screenshot.mockResolvedValue(Buffer.from("png-data"));
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await screenshot.handler({}, ctx);
    expect(page.screenshot).toHaveBeenCalledWith({ fullPage: false });
    expect(result.success).toBe(true);
    expect(result.image).toBeDefined();
    expect(result.image!.mimeType).toBe("image/png");
    expect(result.image!.data).toBe(Buffer.from("png-data").toString("base64"));
  });

  it("takes element screenshot when selector provided", async () => {
    const locator = createMockLocator();
    locator.screenshot.mockResolvedValue(Buffer.from("el-png"));
    const page = createMockPage(locator);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await screenshot.handler({ selector: "#hero" }, ctx);
    expect(page.locator).toHaveBeenCalledWith("#hero");
    expect(locator.screenshot).toHaveBeenCalled();
    expect(result.image).toBeDefined();
  });

  it("uses fullPage option", async () => {
    const page = createMockPage();
    page.screenshot.mockResolvedValue(Buffer.from("full"));
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await screenshot.handler({ fullPage: true }, ctx);
    expect(page.screenshot).toHaveBeenCalledWith({ fullPage: true });
  });

  it("returns base64 encoded image data", async () => {
    const page = createMockPage();
    const buf = Buffer.from("test-image-data");
    page.screenshot.mockResolvedValue(buf);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await screenshot.handler({}, ctx);
    expect(result.image!.data).toBe(buf.toString("base64"));
    expect(result.content).toContain(`${buf.length} bytes`);
  });
});

describe("browser_pdf", () => {
  it("generates PDF with default options", async () => {
    const page = createMockPage();
    page.pdf.mockResolvedValue(Buffer.from("pdf-data"));
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await pdf.handler({}, ctx);
    expect(page.pdf).toHaveBeenCalledWith({
      format: "Letter",
      landscape: false,
      printBackground: true,
    });
    expect(result.success).toBe(true);
    expect(result.image!.mimeType).toBe("application/pdf");
  });

  it("uses custom format options", async () => {
    const page = createMockPage();
    page.pdf.mockResolvedValue(Buffer.from("pdf"));
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await pdf.handler({ format: "A4", landscape: true, printBackground: false }, ctx);
    expect(page.pdf).toHaveBeenCalledWith({
      format: "A4",
      landscape: true,
      printBackground: false,
    });
  });

  it("returns base64 PDF data", async () => {
    const page = createMockPage();
    const buf = Buffer.from("pdf-content");
    page.pdf.mockResolvedValue(buf);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await pdf.handler({}, ctx);
    expect(result.image!.data).toBe(buf.toString("base64"));
    expect(result.content).toContain(`${buf.length} bytes`);
  });
});
