import type { ReactNode } from "react";

type AppContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "main" | "section" | "div";
};

export default function AppContainer({
  children,
  className = "",
  as = "main",
}: AppContainerProps) {
  const Component = as;
  return <Component className={`app-container ${className}`.trim()}>{children}</Component>;
}
