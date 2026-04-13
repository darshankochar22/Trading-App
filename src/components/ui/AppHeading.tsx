import type { ReactNode } from "react";

type AppHeadingProps = {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
};

export default function AppHeading({
  children,
  className = "",
  as = "h2",
}: AppHeadingProps) {
  const Component = as;
  return <Component className={`app-display ${className}`.trim()}>{children}</Component>;
}
