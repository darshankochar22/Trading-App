import type { ReactNode } from "react";

type AppSectionProps = {
  children: ReactNode;
  className?: string;
};

export default function AppSection({ children, className = "" }: AppSectionProps) {
  return <section className={`app-section ${className}`.trim()}>{children}</section>;
}
