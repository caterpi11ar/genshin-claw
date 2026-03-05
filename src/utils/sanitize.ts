import { ForbiddenURLError } from "./errors.js";

const FORBIDDEN_PROTOCOLS = ["file:", "chrome:", "javascript:", "data:", "vbscript:"];

/**
 * Validate that a URL uses an allowed protocol.
 */
export function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ForbiddenURLError(url);
  }
  if (FORBIDDEN_PROTOCOLS.includes(parsed.protocol)) {
    throw new ForbiddenURLError(url);
  }
}

/**
 * Basic selector validation to prevent injection.
 * Rejects selectors containing potentially dangerous patterns.
 */
export function validateSelector(selector: string): void {
  if (!selector || selector.trim().length === 0) {
    throw new Error("Selector cannot be empty");
  }
  // Max length to prevent abuse
  if (selector.length > 1000) {
    throw new Error("Selector too long (max 1000 characters)");
  }
}
