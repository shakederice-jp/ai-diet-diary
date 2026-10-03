"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

function PendingShade() {
  const { pending } = useLinkStatus();
  if (!pending) {
    return null;
  }
  return (
    <span
      className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-black/10"
      aria-hidden="true"
    />
  );
}

export function InstantLink({
  href,
  className = "",
  children,
  onMouseEnter,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  const router = useRouter();

  function warm() {
    if (typeof href === "string") {
      router.prefetch(href);
    }
  }

  return (
    <Link
      {...props}
      href={href}
      className={`relative transition active:scale-[0.98] active:brightness-95 ${className}`}
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        warm();
        onTouchStart?.(event);
      }}
    >
      {children}
      <PendingShade />
    </Link>
  );
}
