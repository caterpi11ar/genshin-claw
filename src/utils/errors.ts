export class SkillError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SkillError";
  }
}

export class SessionNotFoundError extends SkillError {
  constructor(sessionId: string) {
    super(`Session "${sessionId}" not found`, "SESSION_NOT_FOUND");
    this.name = "SessionNotFoundError";
  }
}

export class SessionLimitError extends SkillError {
  constructor(max: number) {
    super(
      `Maximum concurrent sessions (${max}) reached. Close a session first.`,
      "SESSION_LIMIT",
    );
    this.name = "SessionLimitError";
  }
}

export class NavigationError extends SkillError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to navigate to "${url}"`, "NAVIGATION_ERROR", cause);
    this.name = "NavigationError";
  }
}

export class SelectorError extends SkillError {
  constructor(selector: string, cause?: unknown) {
    super(
      `Element not found for selector "${selector}"`,
      "SELECTOR_ERROR",
      cause,
    );
    this.name = "SelectorError";
  }
}

export class TimeoutError extends SkillError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation "${operation}" timed out after ${timeoutMs}ms`,
      "TIMEOUT",
    );
    this.name = "TimeoutError";
  }
}

export class ForbiddenURLError extends SkillError {
  constructor(url: string) {
    super(
      `URL "${url}" uses a forbidden protocol`,
      "FORBIDDEN_URL",
    );
    this.name = "ForbiddenURLError";
  }
}

export class SkillDisabledError extends SkillError {
  constructor(skillName: string) {
    super(
      `Skill "${skillName}" is disabled`,
      "SKILL_DISABLED",
    );
    this.name = "SkillDisabledError";
  }
}
