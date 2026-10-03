"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { NavPending } from "@/components/nav-anchor";

function PendingShade() {
  const { pending } = useLinkStatus();
  if (!pending) {
    return null;
  }
  return <NavPending />;
}

export function InstantLink({
  href,
  className = "",
  children,
  onMouseEnter,
  onTouchStart,
  prefetch,
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  const router = useRouter();
  const lastClick = useRef(0);
  const path = typeof href === "string" ? href : (href.pathname ?? "");
  const skipsFullPrefetch = path.startsWith("/days/") || path === "/" || path.startsWith("/?");
  const resolvedPrefetch = prefetch ?? (skipsFullPrefetch ? undefined : true);

  function warm() {
    if (typeof href === "string") {
      router.prefetch(href);
    }
  }

  return (
    <Link
      {...props}
      href={href}
      prefetch={resolvedPrefetch}
      className={`relative transition active:scale-[0.98] active:brightness-90 ${className}`}
      onClick={(event) => {
        const now = Date.now();
        if (now - lastClick.current < 700) {
          event.preventDefault();
          return;
        }
        lastClick.current = now;
        props.onClick?.(event);
      }}
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
