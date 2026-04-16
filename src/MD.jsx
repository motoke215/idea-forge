import React from "react";
import { theme } from "./theme";

function MD({ src }) {
  if (!src) return null;
  const lines = src.split("\n"), out = [];
  let inCode = false, codeLines = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; codeLines = []; return; }
      out.push(
        <pre key={i} style={{
          background: "#1a3a5c",
          border: "1px solid #2a5a8c",
          borderRadius: 7,
          padding: "0.7rem 0.9rem",
          overflow: "auto",
          margin: "0.5rem 0",
          fontSize: "0.76rem",
          lineHeight: 1.6
        }}>
          <code style={{
            color: "#E8F4FC",
            fontFamily: theme.fonts.mono
          }}>
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      inCode = false;
      return;
    }

    if (inCode) { codeLines.push(line); return; }

    const b = t => t
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#003366">$1</strong>')
      .replace(/`(.*?)`/g, `<code style="background:#E8F4FC;color:#004488;padding:0.1em 0.3em;border-radius:3px;font-size:0.81em;font-family:monospace">$1</code>`);

    if (line.startsWith("# ")) return out.push(
      <h1 key={i} style={{
        fontSize: "1.2rem", fontWeight: 700, color: "#003366",
        margin: "1.2rem 0 0.5rem", paddingBottom: "0.3rem",
        borderBottom: `1px solid ${theme.colors.border}`,
        fontFamily: theme.fonts.serif
      }}>{line.slice(2)}</h1>
    );
    if (line.startsWith("## ")) return out.push(
      <h2 key={i} style={{
        fontSize: "0.93rem", fontWeight: 600, color: theme.colors.primary,
        margin: "0.9rem 0 0.3rem", letterSpacing: "0.02em"
      }}>{line.slice(3)}</h2>
    );
    if (line.startsWith("### ")) return out.push(
      <h3 key={i} style={{
        fontSize: "0.83rem", fontWeight: 600, color: theme.colors.textSecondary,
        margin: "0.7rem 0 0.22rem"
      }}>{line.slice(4)}</h3>
    );
    if (line.startsWith("---")) return out.push(
      <hr key={i} style={{
        border: "none", borderTop: `1px solid ${theme.colors.border}`, margin: "0.8rem 0"
      }} />
    );
    if (line.startsWith("> ")) return out.push(
      <blockquote key={i} style={{
        borderLeft: `2px solid ${theme.colors.primaryLight}`,
        paddingLeft: "0.65rem", margin: "0.4rem 0",
        color: theme.colors.textSecondary, fontStyle: "italic", fontSize: "0.83rem"
      }} dangerouslySetInnerHTML={{ __html: b(line.slice(2)) }} />
    );
    if (/^[-*] /.test(line)) return out.push(
      <li key={i} style={{
        color: "#003366", fontSize: "0.81rem", marginBottom: "0.2rem",
        lineHeight: 1.65, marginLeft: "0.8rem"
      }} dangerouslySetInnerHTML={{ __html: b(line.slice(2)) }} />
    );
    if (/^\d+\./.test(line)) return out.push(
      <li key={i} style={{
        color: "#003366", fontSize: "0.81rem", marginBottom: "0.2rem",
        lineHeight: 1.65, marginLeft: "0.8rem", listStyleType: "decimal"
      }} dangerouslySetInnerHTML={{ __html: b(line.replace(/^\d+\.\s*/, "")) }} />
    );
    if (line.startsWith("|")) return out.push(
      <div key={i} style={{
        fontFamily: "monospace", fontSize: "0.74rem",
        color: theme.colors.textSecondary, padding: "0.07rem 0", whiteSpace: "pre-wrap"
      }}>{line}</div>
    );
    if (line.trim() === "") return out.push(<div key={i} style={{ height: "0.35rem" }} />);
    return out.push(
      <p key={i} style={{
        color: "#003366", fontSize: "0.81rem", lineHeight: 1.68, margin: "0.1rem 0"
      }} dangerouslySetInnerHTML={{ __html: b(line) }} />
    );
  });

  return <div>{out}</div>;
}

export default MD;
