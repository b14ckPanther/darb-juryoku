import markUrl from '../../../../brand/exports/svg/mark-gold.svg?url';
import { designSeed } from '../demo/seed';

/** The shell's front door until the Phase 3 screens exist: the name, the promise, the design system. */
export function Home({ name }: { name: string }) {
  const { home, nav } = designSeed;
  return (
    <main className="mx-auto grid min-h-dvh max-w-3xl content-center gap-8 px-(--space-gutter) py-16">
      <img src={markUrl} alt="" width={88} height={88} className="size-22" />
      <div className="grid gap-4">
        <h1 translate="no" className="text-display">
          {name}
        </h1>
        <p className="m-0 max-w-[34ch] font-display text-title2 font-normal text-text-secondary">
          {home.intro}
        </p>
      </div>
      <a
        href={nav.links[0]?.href ?? '/design'}
        className="pressable inline-flex min-h-(--touch-min) w-fit items-center rounded-control bg-accent-fill px-6 text-subhead font-medium text-on-accent no-underline"
      >
        {home.cta}
      </a>
    </main>
  );
}
