import type { ReactNode } from "react";

type Tone = "success" | "danger";

type AppBadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

export default function AppBadge({ children, tone = "success", className = "" }: AppBadgeProps) {
  const toneClass = tone === "success" ? "app-badge-success" : "app-badge-danger";
  return <span className={`app-badge ${toneClass} ${className}`.trim()}>{children}</span>;
}
