/**
 * Filename Sanitizer
 *
 * Sanitizes filenames to be safe across different operating systems
 * (Windows, Linux, macOS) by removing/replacing invalid characters.
 *
 * Invalid characters on Windows: \ / : * ? " < > |
 * Control characters (ASCII 0-31)
 * Leading/trailing dots and spaces (problematic on some filesystems)
 * Reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9) - handled by appending suffix
 */

/**
 * Maximum allowed filename length (excluding extension)
 * Keeping it at 100 as specified in the issue
 */
export const MAX_FILENAME_LENGTH = 100;

/**
 * Windows reserved device names
 */
const WINDOWS_RESERVED = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

/**
 * Regex matching invalid characters for filenames across OSes
 * - Windows: \ / : * ? " < > |
 * - Control characters: ASCII 0-31 (0x00-0x1F)
 * - Also includes % as it can cause issues in URLs and some contexts
 */
const INVALID_CHARS_REGEX = /[\\/?%*:|"<>[\x00-\x1F]/g;

/**
 * Regex to match leading/trailing dots and spaces
 */
const TRIM_REGEX = /^[\s.]+|[\s.]+$/g;

/**
 * Sanitizes a filename to be safe across operating systems.
 *
 * @param filename - The original filename (with or without extension)
 * @param options - Optional configuration
 * @returns Sanitized filename
 *
 * @example
 * sanitizeFilename('test:file?.png') // 'test-file-.png'
 * sanitizeFilename('CON.txt') // 'CON-.txt' (Windows reserved name)
 * sanitizeFilename('  .file  ') // 'file'
 */
export function sanitizeFilename(
  filename: string,
  options: { maxLength?: number } = {},
): string {
  const { maxLength = MAX_FILENAME_LENGTH } = options;

  // Handle empty or undefined input
  if (!filename || typeof filename !== "string") {
    return "untitled";
  }

  // Split into name and extension
  const lastDotIndex = filename.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;
  const name = hasExtension ? filename.slice(0, lastDotIndex) : filename;
  const extension = hasExtension ? filename.slice(lastDotIndex) : "";

  // Remove invalid characters
  let sanitizedName = name.replace(INVALID_CHARS_REGEX, "-");

  // Trim leading/trailing dots and spaces
  sanitizedName = sanitizedName.replace(TRIM_REGEX, "");

  // Handle empty name after sanitization
  if (!sanitizedName) {
    sanitizedName = "untitled";
  }

  // Handle Windows reserved names (case-insensitive)
  if (WINDOWS_RESERVED.has(sanitizedName.toUpperCase())) {
    sanitizedName += "-";
  }

  // Enforce max length on the name part (not including extension)
  if (sanitizedName.length > maxLength) {
    sanitizedName = sanitizedName.slice(0, maxLength);
    // Re-trim in case truncation created trailing dots/spaces
    sanitizedName = sanitizedName.replace(TRIM_REGEX, "");
    if (!sanitizedName) {
      sanitizedName = "untitled";
    }
  }

  return sanitizedName + extension;
}

/**
 * Sanitizes a filename and ensures it's unique by appending a counter if needed.
 * Useful when generating multiple files with similar names.
 *
 * @param baseName - Base filename
 * @param existingNames - Set of existing filenames to avoid collisions
 * @returns Unique sanitized filename
 */
export function sanitizeAndUniqueFilename(
  baseName: string,
  existingNames: Set<string>,
): string {
  const sanitized = sanitizeFilename(baseName);
  if (!existingNames.has(sanitized)) {
    existingNames.add(sanitized);
    return sanitized;
  }

  let counter = 1;
  const lastDotIndex = sanitized.lastIndexOf(".");
  const name = lastDotIndex > 0 ? sanitized.slice(0, lastDotIndex) : sanitized;
  const extension = lastDotIndex > 0 ? sanitized.slice(lastDotIndex) : "";

  while (true) {
    const candidate = `${name}-${counter}${extension}`;
    if (!existingNames.has(candidate)) {
      existingNames.add(candidate);
      return candidate;
    }
    counter++;
  }
}
