import React from "react";

export function renderMarkdownBold(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}
