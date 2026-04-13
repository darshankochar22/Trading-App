import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export default function AppButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: AppButtonProps) {
  const variantClass = variant === "primary" ? "app-btn-primary" : "app-btn-secondary";
  return (
    <button {...props} className={`app-btn ${variantClass} ${className}`.trim()}>
      {children}
    </button>
  );
}
