"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: only renders when the root layout itself throws,
 * so it must provide its own <html>/<body> and cannot rely on app CSS.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#0f1020",
          color: "#f4f4f8",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <p style={{ fontSize: 96, fontWeight: 800, margin: 0, lineHeight: 1, color: "#8b5cf6" }}>500</p>
          <h1 style={{ fontSize: 24, margin: "12px 0 8px" }}>FlowDesk hit an unexpected error</h1>
          <p style={{ opacity: 0.7, margin: "0 0 20px" }}>Reload the page. If it keeps happening, tell your admin.</p>
          <button
            onClick={reset}
            style={{
              background: "#6366f1",
              color: "white",
              border: 0,
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error?.digest && <p style={{ opacity: 0.5, fontSize: 12, marginTop: 16 }}>Error ID: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
