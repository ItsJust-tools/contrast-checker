/**
 * Sanitize a filename by removing or replacing characters that are
 * invalid across operating systems, trimming whitespace, and enforcing
 * a maximum length.
 *
 * Replaces: / \ < > : " | ? * and all control characters (0x00–0x1F)
 * with a hyphen. Trims whitespace and truncates to 100 characters.
 * Falls back to "export" if the result is empty.
 */
export function sanitizeFilename(name: string): string {
  const safe = name
    .replace(/[/\\<>:"|?*\x00-\x1F]/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return safe.length > 0 ? safe.slice(0, 100) : "export";
}
