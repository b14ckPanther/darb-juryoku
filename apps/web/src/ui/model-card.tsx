import { useId } from 'react';
import { PostureGlyph, type PostureClass } from './glyphs';
import { GroupedList, ListRow } from './list';

interface ModelCardProps {
  name: string;
  version: string;
  dataVersion: string;
  classes: string[];
  classLabels: Record<string, string>;
  facts: { label: string; value: string }[];
}

const isPosture = (c: string): c is PostureClass =>
  ['upright', 'slouch', 'forward_head', 'lean_side'].includes(c);

/** The active model at a glance: version, the data it learned from, its classes and headline metrics. */
export function ModelCard({
  name,
  version,
  dataVersion,
  classes,
  classLabels,
  facts,
}: ModelCardProps) {
  const titleId = useId();
  return (
    <article
      aria-labelledby={titleId}
      className="grid gap-4 rounded-container bg-surface-raised p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={titleId} className="text-title2">
          {name}{' '}
          <span className="font-ui text-subhead font-normal text-text-secondary">{version}</span>
        </h3>
        <span className="num text-footnote text-text-secondary">{dataVersion}</span>
      </header>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {classes.map((c) => (
          <li
            key={c}
            className="flex min-h-9 items-center gap-1.5 rounded-control bg-surface-overlay px-3 text-footnote"
          >
            {isPosture(c) && <PostureGlyph posture={c} size={18} />}
            {classLabels[c] ?? c}
          </li>
        ))}
      </ul>
      <GroupedList>
        {facts.map((f) => (
          <ListRow key={f.label} label={f.label} value={f.value} />
        ))}
      </GroupedList>
    </article>
  );
}
