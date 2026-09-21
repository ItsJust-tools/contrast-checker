/**
 * Clipboard copy with graceful fallback.
 *
 * `navigator.clipboard.writeText` rejects (or is unavailable entirely) on
 * insecure origins (plain HTTP), inside unauthenticated iframes, or when
 * browser clipboard permissions are denied by policy. This helper tries the
 * modern Clipboard API first and transparently falls back to the legacy
 * `document.execCommand("copy")` trick inside an off-screen textarea.
 *
 * Resolves when the text was copied. Rejects with the original Clipboard API
 * error (or a generic error when the API was unavailable) when both
 * strategies fail, so callers can surface a meaningful message.
 */
export async function copyToClipboard(text: string): Promise<void> {
  const clipboard =
    typeof navigator === "undefined" ? undefined : navigator.clipboard;

  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      await clipboard.writeText(text);
      return;
    } catch (err) {
      // Permission denied / insecure origin / blocked iframe — try the
      // legacy fallback before giving up.
      if (legacyCopy(text)) return;
      throw err;
    }
  }

  if (legacyCopy(text)) return;
  throw new Error("Clipboard is not available in this context");
}

/**
 * Legacy copy via a temporary off-screen textarea and execCommand("copy").
 * Restores the previous text selection and always removes the textarea.
 */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  // Snapshot the current selection BEFORE the textarea takes focus, so it can
  // be restored after the copy attempt (the textarea select would clobber it).
  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(textarea);

  let success = false;
  try {
    textarea.focus();
    textarea.select();
    // execCommand is deprecated but remains the only programmatic fallback
    // available on insecure origins and in restricted iframes.
    success = document.execCommand("copy");
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textarea);
    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }
  return success;
}
