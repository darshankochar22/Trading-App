import type { ReactNode } from "react";

type AppCardProps = {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
};

export default function AppCard({ children, className = "", elevated = false }: AppCardProps) {
  return <div className={`${elevated ? "app-card-elevated" : "app-card"} ${className}`.trim()}>{children}</div>;
}
