"use client";

import { useRef, useState, type ReactNode } from "react";

export function NavAnchor({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const lastClick = useRef(0);

  return (
    <a
      href={href}
      aria-busy={pending}
      className={`relative transition active:scale-[0.98] active:brightness-90 ${className}`}
      onClick={(event) => {
        const now = Date.now();
        if (pending || now - lastClick.current < 700) {
          event.preventDefault();
          return;
        }
        lastClick.current = now;
        setPending(true);
      }}
    >
      {children}
      {pending ? <NavPending /> : null}
    </a>
  );
}

export function NavPending() {
  return (
    <span
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/50"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <span
        className="size-4 animate-spin rounded-full border-2 border-[#E4D7C6] border-t-[#F5821F]"
        aria-hidden="true"
      />
      <span className="sr-only">移動しています</span>
    </span>
  );
}
