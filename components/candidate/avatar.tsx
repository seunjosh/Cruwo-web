"use client";

import { useState } from "react";

// A circular avatar that falls back to initials if there's no photo, or
// if the photo URL fails to load (e.g. no photo has been uploaded yet).
// This needs to be a client component specifically because checking
// "did the image fail to load" requires an event handler, which server
// components can't have.
export function Avatar({
  src,
  name,
  size = 64,
}: {
  src: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-bg border border-border flex items-center justify-center text-muted font-display font-medium"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover border border-border"
      onError={() => setFailed(true)}
    />
  );
}