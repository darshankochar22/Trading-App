import type { ReactNode } from "react";

type DashboardHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  rightSlot?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function DashboardHero({
  eyebrow,
  title,
  description,
  rightSlot,
  actions,
  className = "",
}: DashboardHeroProps) {
  return (
    <section className={`app-card-elevated overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white sm:p-8 ${className}`.trim()}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">{eyebrow}</p>
          <h1 className="app-display mt-3 text-4xl text-white sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">{description}</p>
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
