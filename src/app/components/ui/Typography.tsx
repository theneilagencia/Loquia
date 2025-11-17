"use client";

import clsx from "clsx";
import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1
      className={clsx(
        "text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2
      className={clsx(
        "text-3xl font-semibold text-gray-900 mb-4 leading-snug",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3
      className={clsx(
        "text-2xl font-semibold text-gray-900 mb-3 leading-snug",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function Body({ children, className }: TypographyProps) {
  return (
    <p
      className={clsx("text-lg text-gray-600 leading-relaxed mb-4", className)}
    >
      {children}
    </p>
  );
}
