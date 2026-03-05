import { describe, it, expect, vi } from "vitest";
import { startGame } from "../../src/skills/start-game.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockPage,
  createMockLocator,
} from "../helpers/mock-factories.js";

const START_SEL = ".wel-card__content--start";
const POPUP_A = ".popup-a .close";
const POPUP_B = ".popup-b .close";
const LOADED_SEL = "#game-canvas";

function buildSession(opts?: { startExists?: boolean }) {
  const locator = createMockLocator();
  const page = createMockPage(locator);

  // Default: start button exists
  const startExists = opts?.startExists ?? true;

  page.locator.mockImplementation((sel: string) => {
    const loc = createMockLocator();
    if (sel === START_SEL) {
      if (startExists) {
        loc.waitFor.mockResolvedValue(undefined);
      } else {
        loc.waitFor.mockRejectedValue(new Error("not found"));
      }
    }
    return loc;
  });

  return createMockSessionInfo({
    id: "game-session",
    page: page as unknown as import("playwright").Page,
  });
}

describe("browser_start_game", () => {
  it("clicks start when logged in with no popups", async () => {
    const session = buildSession();
    const ctx = createMockSkillContext({
      getSession: vi.fn().mockResolvedValue(session),
    });

    const result = await startGame.handler(
      {
        startSelector: START_SEL,
        dismissSelectors: [],
        dismissTimeoutMs: 3000,
        gameLoadedTimeoutMs: 60_000,
        pollIntervalMs: 500,
      },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.content).toContain("clicked successfully");
    // Start selector checked once (existence) + clicked once
    expect(session.page.locator).toHaveBeenCalledWith(START_SEL);
  });

  it("dismisses popups before clicking start", async () => {
    const session = buildSession();
    const clickedSelectors: string[] = [];

    (session.page as unknown as { locator: ReturnType<typeof vi.fn> }).locator.mockImplementation(
      (sel: string) => {
        const loc = createMockLocator();
        loc.waitFor.mockResolvedValue(undefined);
        loc.click.mockImplementation(async () => {
          clickedSelectors.push(sel);
        });
        return loc;
      },
    );

    const ctx = createMockSkillContext({
      getSession: vi.fn().mockResolvedValue(session),
    });

    const result = await startGame.handler(
      {
        startSelector: START_SEL,
        dismissSelectors: [POPUP_A, POPUP_B],
        dismissTimeoutMs: 3000,
        gameLoadedTimeoutMs: 60_000,
        pollIntervalMs: 500,
      },
      ctx,
    );

    expect(result.success).toBe(true);
    // Popups dismissed, then start clicked
    expect(clickedSelectors).toContain(POPUP_A);
    expect(clickedSelectors).toContain(POPUP_B);
    expect(clickedSelectors).toContain(START_SEL);
    // Popups before start
    expect(clickedSelectors.indexOf(POPUP_A)).toBeLessThan(clickedSelectors.indexOf(START_SEL));
  });

  it("returns failure when start button not found (not logged in)", async () => {
    const session = buildSession({ startExists: false });
    const ctx = createMockSkillContext({
      getSession: vi.fn().mockResolvedValue(session),
    });

    const result = await startGame.handler(
      {
        startSelector: START_SEL,
        dismissSelectors: [],
        dismissTimeoutMs: 3000,
        gameLoadedTimeoutMs: 60_000,
        pollIntervalMs: 500,
      },
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.content).toContain("not found");
    expect(result.content).toContain("logged in");
  });

  it("waits for gameLoadedSelector and succeeds", async () => {
    const session = buildSession();
    let pollCount = 0;

    (session.page as unknown as { locator: ReturnType<typeof vi.fn> }).locator.mockImplementation(
      (sel: string) => {
        const loc = createMockLocator();
        if (sel === LOADED_SEL) {
          loc.waitFor.mockImplementation(async () => {
            pollCount++;
            if (pollCount < 3) throw new Error("not yet");
          });
        } else {
          loc.waitFor.mockResolvedValue(undefined);
        }
        return loc;
      },
    );

    const ctx = createMockSkillContext({
      getSession: vi.fn().mockResolvedValue(session),
    });

    const result = await startGame.handler(
      {
        startSelector: START_SEL,
        dismissSelectors: [],
        gameLoadedSelector: LOADED_SEL,
        dismissTimeoutMs: 3000,
        gameLoadedTimeoutMs: 60_000,
        pollIntervalMs: 10,
      },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.content).toContain("loaded");
    expect(result.content).toContain(LOADED_SEL);
  });

  it("returns failure when game loading times out", async () => {
    const session = buildSession();

    (session.page as unknown as { locator: ReturnType<typeof vi.fn> }).locator.mockImplementation(
      (sel: string) => {
        const loc = createMockLocator();
        if (sel === LOADED_SEL) {
          loc.waitFor.mockRejectedValue(new Error("not found"));
        } else {
          loc.waitFor.mockResolvedValue(undefined);
        }
        return loc;
      },
    );

    const ctx = createMockSkillContext({
      getSession: vi.fn().mockResolvedValue(session),
    });

    const result = await startGame.handler(
      {
        startSelector: START_SEL,
        dismissSelectors: [],
        gameLoadedSelector: LOADED_SEL,
        dismissTimeoutMs: 3000,
        gameLoadedTimeoutMs: 50,
        pollIntervalMs: 10,
      },
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.content).toContain("timed out");
  });

  it("skips missing popups and continues", async () => {
    const session = buildSession();
    const clickedSelectors: string[] = [];

    (session.page as unknown as { locator: ReturnType<typeof vi.fn> }).locator.mockImplementation(
      (sel: string) => {
        const loc = createMockLocator();
        if (sel === POPUP_A) {
          // popup A not found
          loc.waitFor.mockRejectedValue(new Error("not found"));
        } else {
          loc.waitFor.mockResolvedValue(undefined);
          loc.click.mockImplementation(async () => {
            clickedSelectors.push(sel);
          });
        }
        return loc;
      },
    );

    const ctx = createMockSkillContext({
      getSession: vi.fn().mockResolvedValue(session),
    });

    const result = await startGame.handler(
      {
        startSelector: START_SEL,
        dismissSelectors: [POPUP_A, POPUP_B],
        dismissTimeoutMs: 3000,
        gameLoadedTimeoutMs: 60_000,
        pollIntervalMs: 500,
      },
      ctx,
    );

    expect(result.success).toBe(true);
    // Popup A was not clicked (not found), popup B was clicked
    expect(clickedSelectors).not.toContain(POPUP_A);
    expect(clickedSelectors).toContain(POPUP_B);
    expect(clickedSelectors).toContain(START_SEL);
  });
});
