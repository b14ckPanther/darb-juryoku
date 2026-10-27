import { CalendarDays, Download, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useData } from '../app/data';
import { useRouter } from '../app/router';
import { useToast } from '../app/toast';
import { downloadJson } from '../app/download';
import { reportConfig } from '../config/runtime';
import { addDays } from '../demo/generate-sessions';
import { copy, t } from '../copy';
import { dailySummaries, dayStreaks, hourWeekdayGrid } from '../report/engine';
import { longDate, percent, shortDate } from '../report/format';
import { Button } from '../ui/button';
import { BarChart, Heatmap } from '../ui/charts';
import { SegmentedControl } from '../ui/controls';
import { GroupedList, SwipeRow } from '../ui/list';
import { Sheet } from '../ui/sheet';
import { Stat } from '../ui/stat';
import { Notice, Page } from './Page';

const toggle = { show: copy.charts.show_table, hide: copy.charts.hide_table };
const days = (n: number) => (n === 1 ? copy.units.day : t(copy.units.days, { n }));

/** Week and month views: daily good share, the hour by weekday heatmap, streaks and the days. */
export default function History() {
  const { data, dispatch } = useData();
  const { navigate } = useRouter();
  const toast = useToast();
  const [range, setRange] = useState(copy.history.week);
  const [deleting, setDeleting] = useState<string | null>(null);
  const span =
    range === copy.history.week ? reportConfig.history_days.week : reportConfig.history_days.month;
  const from = addDays(data.today, -(span - 1));

  const view = useMemo(() => {
    const inRange = data.buckets.filter((b) => b.day >= from && b.day <= data.today);
    const summaries = dailySummaries(inRange).filter((d) => d.share !== null);
    const { from: h0, to: h1 } = reportConfig.heatmap_hours;
    return {
      summaries,
      streaks: dayStreaks(dailySummaries(data.buckets), reportConfig.streak_goal),
      grid: hourWeekdayGrid(inRange, h0, h1).map((row) =>
        row.map((v) => (v === null ? null : percent(v))),
      ),
      hours: Array.from({ length: h1 - h0 + 1 }, (_, i) => String(h0 + i).padStart(2, '0')),
    };
  }, [data.buckets, data.today, from]);

  if (view.summaries.length === 0 && data.buckets.length === 0) {
    return (
      <Page title={copy.history.title}>
        <Notice
          icon={CalendarDays}
          title={copy.history.empty_title}
          body={copy.history.empty_body}
          action={copy.history.empty_action}
          href="/"
        />
      </Page>
    );
  }

  const deletingName = deleting ? longDate(deleting, copy.locale) : '';

  return (
    <Page title={copy.history.title}>
      <div className="grid gap-8">
        <SegmentedControl
          label={copy.history.range_label}
          options={[copy.history.week, copy.history.month]}
          value={range}
          onChange={setRange}
        />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <section className="rounded-container bg-surface-raised p-4 sm:p-5">
            <BarChart
              title={copy.history.bars_title}
              unit="%"
              toggle={toggle}
              bars={view.summaries.map((d) => ({
                label: shortDate(d.date, copy.locale),
                value: percent(d.share ?? 0),
              }))}
            />
          </section>
          <section className="rounded-container bg-surface-raised p-4 sm:p-5">
            <Heatmap
              title={copy.history.heatmap_title}
              unit="%"
              toggle={toggle}
              emptyLabel={copy.history.no_sitting}
              rows={copy.history.weekdays}
              columns={view.hours}
              values={view.grid}
            />
          </section>
        </div>
        <section aria-labelledby="streaks" className="grid gap-3">
          <h2 id="streaks" className="px-4 font-ui text-footnote font-medium text-text-secondary">
            {copy.history.streaks_title}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                [copy.history.current, view.streaks.current],
                [copy.history.best, view.streaks.best],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-container bg-surface-raised p-4">
                <Stat size="display" value={String(n)} label={`${label}, ${days(n)}`} />
              </div>
            ))}
          </div>
          <p className="m-0 px-4 text-footnote text-text-secondary">
            {t(copy.history.streak_note, { goal: `${percent(reportConfig.streak_goal)}%` })}
          </p>
        </section>
        <GroupedList title={copy.history.days_title} footer={copy.history.swipe_hint} level={2}>
          {[...view.summaries].reverse().map((d) => {
            const name = longDate(d.date, copy.locale);
            const act = (action: string) =>
              t(copy.history.swipe_action_name, { action, row: name });
            return (
              <SwipeRow
                key={d.date}
                label={name}
                value={`${percent(d.share ?? 0)}%`}
                onOpen={() => navigate(`/history/${d.date}`)}
                actions={[
                  {
                    label: copy.history.export,
                    accessibleName: act(copy.history.export),
                    icon: Download,
                    tone: 'neutral',
                    onPress: () => {
                      downloadJson(`juryoku-${d.date}.json`, {
                        demo: data.demo,
                        minutes: data.buckets.filter((b) => b.day === d.date),
                      });
                      toast(t(copy.history.exported, { day: name }));
                    },
                  },
                  {
                    label: copy.history.delete,
                    accessibleName: act(copy.history.delete),
                    icon: Trash2,
                    tone: 'danger',
                    onPress: () => setDeleting(d.date),
                  },
                ]}
              />
            );
          })}
        </GroupedList>
      </div>
      <Sheet
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t(copy.history.delete_title, { day: deletingName })}
      >
        <p className="mt-0 text-subhead text-text-secondary">{copy.history.delete_body}</p>
        <div className="grid gap-2 pb-2 sm:grid-cols-2">
          <Button variant="quiet" onClick={() => setDeleting(null)}>
            {copy.history.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (deleting) dispatch({ type: 'delete_day', date: deleting });
              setDeleting(null);
              toast(t(copy.history.deleted, { day: deletingName }));
            }}
          >
            {copy.history.delete_confirm}
          </Button>
        </div>
      </Sheet>
    </Page>
  );
}
