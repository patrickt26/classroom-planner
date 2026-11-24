"use client";

import { createContext, type ReactNode } from "react";
import type { Enums } from "@/types/database";

export const WeekStartContext =
  createContext<Enums<"week_start_day">>("monday");

export function WeekStartProvider({
  value,
  children,
}: {
  value: Enums<"week_start_day">;
  children: ReactNode;
}) {
  return <WeekStartContext value={value}>{children}</WeekStartContext>;
}
