import { designSeed } from '../../demo/seed';
import { TimelineRibbon } from '../../ui/charts';
import { GroupedList, ListRow } from '../../ui/list';
import { Stat } from '../../ui/stat';

/** The daily report body: hero share, the day ribbon, three facts and one plain sentence. */
export function TodayPanel({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const { today, gallery } = designSeed;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="grid gap-5">
      <div className="grid gap-0.5">
        <Heading className="text-large-title">{today.title}</Heading>
        <p className="m-0 text-subhead text-text-secondary">{today.date}</p>
      </div>
      <Stat value={today.hero_value} unit={today.hero_unit} label={today.hero_label} />
      <TimelineRibbon
        title={today.ribbon.title}
        start={today.ribbon.start}
        bucketMinutes={today.ribbon.bucket_minutes}
        states={today.ribbon.states}
        labels={today.ribbon.labels}
        toggle={gallery.chart_table_toggle}
      />
      <GroupedList>
        {today.facts.map((f) => (
          <ListRow key={f.label} label={f.label} value={f.value} />
        ))}
      </GroupedList>
      <p className="m-0 max-w-[40ch] font-display text-title3 font-normal leading-snug">
        {today.observation}
      </p>
    </div>
  );
}
