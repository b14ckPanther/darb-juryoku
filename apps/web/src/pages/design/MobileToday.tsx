import {
  CalendarDays,
  Download,
  Settings,
  SlidersHorizontal,
  Sun,
  Trash2,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../app/theme';
import { designSeed } from '../../demo/seed';
import { IconButton } from '../../ui/button';
import { TimelineRibbon } from '../../ui/charts';
import { SegmentedControl } from '../../ui/controls';
import { Banner } from '../../ui/feedback';
import { GroupedList, ListRow, SwipeRow } from '../../ui/list';
import { LargeTitle, TabBar } from '../../ui/mobile';
import { Sheet } from '../../ui/sheet';
import { Stat } from '../../ui/stat';

/** Today as the installed phone app: large title, grouped content, swipe rows, a sheet and the tab bar. */
export default function MobileToday() {
  const { today, gallery, banner, mobile } = designSeed;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [style, setStyle] = useState(gallery.sheet.options[1] ?? '');
  useTheme();
  const noop = () => undefined;

  return (
    <div className="min-h-dvh bg-surface text-text">
      <main className="mx-auto max-w-xl px-(--space-gutter) pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <LargeTitle
          title={mobile.title}
          subtitle={today.date}
          trailing={
            <IconButton
              icon={SlidersHorizontal}
              label={gallery.sheet.open}
              onClick={() => setSheetOpen(true)}
            />
          }
        />
        <div className="grid gap-8">
          <Banner tone="demo">{banner.demo}</Banner>
          <Stat value={today.hero_value} unit={today.hero_unit} label={today.hero_label} />
          <section className="grid gap-3 rounded-container bg-surface-raised p-4">
            <TimelineRibbon
              title={mobile.sections.day}
              start={today.ribbon.start}
              bucketMinutes={today.ribbon.bucket_minutes}
              states={today.ribbon.states}
              labels={today.ribbon.labels}
              toggle={gallery.chart_table_toggle}
            />
          </section>
          <GroupedList title={mobile.sections.facts} level={2}>
            {today.facts.map((f) => (
              <ListRow key={f.label} label={f.label} value={f.value} />
            ))}
          </GroupedList>
          <p className="m-0 font-display text-title3 font-normal leading-snug">
            {today.observation}
          </p>
          <GroupedList title={mobile.sections.recent} footer={gallery.swipe_hint} level={2}>
            {gallery.history_rows.map((r) => (
              <SwipeRow
                key={r.label}
                label={r.label}
                value={r.value}
                actions={[
                  {
                    label: gallery.swipe_actions.export,
                    icon: Download,
                    tone: 'neutral',
                    onPress: noop,
                  },
                  {
                    label: gallery.swipe_actions.delete,
                    icon: Trash2,
                    tone: 'danger',
                    onPress: noop,
                  },
                ]}
              />
            ))}
          </GroupedList>
        </div>
      </main>
      <TabBar
        label={gallery.title}
        current="today"
        tabs={[
          { id: 'today', label: today.tabs.today, icon: Sun, href: '/design/mobile' },
          {
            id: 'history',
            label: today.tabs.history,
            icon: CalendarDays,
            href: '/design/components',
          },
          { id: 'live', label: today.tabs.live, icon: Video, href: '/design/overlay' },
          { id: 'settings', label: today.tabs.settings, icon: Settings, href: '/design' },
        ]}
      />
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={gallery.sheet.title}>
        <p className="mt-0 text-subhead text-text-secondary">{gallery.sheet.body}</p>
        <SegmentedControl
          label={gallery.sheet.title}
          options={gallery.sheet.options}
          value={style}
          onChange={setStyle}
          orientation="vertical"
        />
      </Sheet>
    </div>
  );
}
