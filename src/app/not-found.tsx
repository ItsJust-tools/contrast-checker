export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>404</h1>
      <h2 style={{ fontSize: "1.25rem" }}>Page not found</h2>
      <p style={{ color: "var(--muted)" }}>
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
