export { sessionCreate } from "./session-create.js";
export { sessionList } from "./session-list.js";
export { sessionClose } from "./session-close.js";
export { navigate } from "./navigate.js";
export { getUrl } from "./get-url.js";
export { getTitle } from "./get-title.js";
export { click } from "./click.js";
export { fill } from "./fill.js";
export { typeText } from "./type-text.js";
export { screenshot } from "./screenshot.js";
export { extractText } from "./extract-text.js";
export { extractHtml } from "./extract-html.js";
export { scroll } from "./scroll.js";
export { wait } from "./wait.js";
export { waitForSelector } from "./wait-for-selector.js";
export { hover } from "./hover.js";
export { selectOption } from "./select-option.js";
export { check } from "./check.js";
export { pressKey } from "./press-key.js";
export { goBack } from "./go-back.js";
export { goForward } from "./go-forward.js";
export { reload } from "./reload.js";
export { evaluate } from "./evaluate.js";
export { getAttribute } from "./get-attribute.js";
export { getCookies } from "./get-cookies.js";
export { setCookies } from "./set-cookies.js";
export { clearCookies } from "./clear-cookies.js";
export { setViewport } from "./set-viewport.js";
export { pdf } from "./pdf.js";
export { uploadFile } from "./upload-file.js";
export { dialogHandle } from "./dialog-handle.js";
export { login } from "./login.js";
export { startGame } from "./start-game.js";

import { sessionCreate } from "./session-create.js";
import { sessionList } from "./session-list.js";
import { sessionClose } from "./session-close.js";
import { navigate } from "./navigate.js";
import { getUrl } from "./get-url.js";
import { getTitle } from "./get-title.js";
import { click } from "./click.js";
import { fill } from "./fill.js";
import { typeText } from "./type-text.js";
import { screenshot } from "./screenshot.js";
import { extractText } from "./extract-text.js";
import { extractHtml } from "./extract-html.js";
import { scroll } from "./scroll.js";
import { wait } from "./wait.js";
import { waitForSelector } from "./wait-for-selector.js";
import { hover } from "./hover.js";
import { selectOption } from "./select-option.js";
import { check } from "./check.js";
import { pressKey } from "./press-key.js";
import { goBack } from "./go-back.js";
import { goForward } from "./go-forward.js";
import { reload } from "./reload.js";
import { evaluate } from "./evaluate.js";
import { getAttribute } from "./get-attribute.js";
import { getCookies } from "./get-cookies.js";
import { setCookies } from "./set-cookies.js";
import { clearCookies } from "./clear-cookies.js";
import { setViewport } from "./set-viewport.js";
import { pdf } from "./pdf.js";
import { uploadFile } from "./upload-file.js";
import { dialogHandle } from "./dialog-handle.js";
import { login } from "./login.js";
import { startGame } from "./start-game.js";

import type { SkillDefinition } from "../core/types.js";

/** All registered skills */
export const allSkills: SkillDefinition[] = [
  sessionCreate,
  sessionList,
  sessionClose,
  navigate,
  getUrl,
  getTitle,
  click,
  fill,
  typeText,
  screenshot,
  extractText,
  extractHtml,
  scroll,
  wait,
  waitForSelector,
  hover,
  selectOption,
  check,
  pressKey,
  goBack,
  goForward,
  reload,
  evaluate,
  getAttribute,
  getCookies,
  setCookies,
  clearCookies,
  setViewport,
  pdf,
  uploadFile,
  dialogHandle,
  login,
  startGame,
];
