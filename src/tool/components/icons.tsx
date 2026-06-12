/** Shared SVG icon components used across the tool UI. */

/** Check icon SVG — green checkmark for passing WCAG compliance. */
export function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "18px", height: "18px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
CheckIcon.displayName = "CheckIcon";

/** X icon SVG — red X for failing WCAG compliance. */
export function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "18px", height: "18px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
XIcon.displayName = "XIcon";

/** Plus icon SVG — add/save current combination. */
export function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "16px", height: "16px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
PlusIcon.displayName = "PlusIcon";

/** Chevron down icon SVG — used in export dropdown toggle. */
export function ChevronDownIcon({ open }: { open?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{
        width: "14px",
        height: "14px",
        transition: "transform 0.15s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
ChevronDownIcon.displayName = "ChevronDownIcon";

/** Download/Export icon SVG — export combinations. */
export function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "16px", height: "16px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
DownloadIcon.displayName = "DownloadIcon";

/** Trash/Delete icon SVG — clear or remove saved combinations. */
export function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "16px", height: "16px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
TrashIcon.displayName = "TrashIcon";

/** Swap/Exchange icon SVG — swap foreground and background colors. */
export function SwapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "16px", height: "16px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L6 6.414V15a1 1 0 11-2 0V6.414L2.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 015 3zm10 2a1 1 0 011 1v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L14 13.586V6a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
SwapIcon.displayName = "SwapIcon";

/** Spinner icon SVG — animated loading indicator for async actions. */
export function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "14px", height: "14px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm4.242 1.757a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 10a1 1 0 100 2h1a1 1 0 100-2h-1zm-1.757 4.242a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.242-1.757a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm1.757-4.243a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
SpinnerIcon.displayName = "SpinnerIcon";

/** Check circle icon SVG — success indicator for completed actions. */
export function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "14px", height: "14px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
CheckCircleIcon.displayName = "CheckCircleIcon";

/** Undo icon SVG — revert the last color change or action. */
export function UndoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "16px", height: "16px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a5 5 0 010 10H6a1 1 0 010-2h5a3 3 0 100-6H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
UndoIcon.displayName = "UndoIcon";

/** Redo icon SVG — reapply a previously undone change. */
export function RedoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ width: "16px", height: "16px" }}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 000 10h5a1 1 0 010 2H9a7 7 0 010-14h5.586l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
RedoIcon.displayName = "RedoIcon";
