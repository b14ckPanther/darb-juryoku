import { ChevronLeft, Sun, CalendarX2 } from 'lucide-react';
import { useMemo } from 'react';
import { useData } from '../app/data';
import { Link } from '../app/router';
import { reportConfig } from '../config/runtime';
import { copy, t } from '../copy';
import { buildDayReport } from '../report/day-report';
import { clock, duration, longDate, percent, points } from '../report/format';
import { ICON_STROKE } from '../ui/button';
import { TimelineRibbon } from '../ui/charts';
import { GroupedList, ListRow } from '../ui/list';
import { Stat } from '../ui/stat';
import { Notice, Page } from './Page';

const toggle = { show: copy.charts.show_table, hide: copy.charts.hide_table };

/** One day's report: the hero share, the observation, the ribbon and the facts. */
function DayReportView({
  date,
  title,
  subtitle,
  back,
}: {
  date: string;
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  const { data } = useData();
  const report = useMemo(
    () => buildDayReport(data.buckets, date, reportConfig, copy),
    [data.buckets, date],
  );
  const backLink = back && (
    <Link
      href="/history"
      className="pressable -ml-2 inline-flex min-h-(--touch-min) items-center gap-1 rounded-control pr-3 text-subhead text-accent-text no-underline"
    >
      <ChevronLeft aria-hidden size={22} strokeWidth={ICON_STROKE} />
      {copy.nav.back}
    </Link>
  );

  if (report.share === null) {
    return (
      <>
        {backLink}
        <Page title={title} subtitle={subtitle}>
          {back ? (
            <Notice
              icon={CalendarX2}
              title={t(copy.today.no_day_title, { date: title })}
              body={copy.today.no_day_body}
            />
          ) : (
            <Notice
              icon={Sun}
              title={copy.today.empty_title}
              body={copy.today.empty_body}
              action={copy.today.empty_action}
              href="/"
            />
          )}
        </Page>
      </>
    );
  }

  const facts = [
    { label: copy.today.sat, value: duration(report.sittingMinutes, copy.units) },
    {
      label: copy.today.longest_drift,
      value: report.longestDrift
        ? duration(report.longestDrift.minutes, copy.units)
        : copy.units.none,
    },
    {
      label: copy.today.worst_hour,
      value: report.worstHour
        ? t(copy.units.clock_range, {
            from: clock(report.worstHour.hour * 60),
            to: clock(report.worstHour.hour * 60 + 60),
          })
        : copy.units.none,
    },
    {
      label: t(copy.today.vs_average, { days: reportConfig.average_window_days }),
      value: report.comparison ? points(report.comparison.delta, copy.units) : copy.units.none,
    },
  ];

  return (
    <>
      {backLink}
      <Page title={title} subtitle={subtitle}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div className="grid content-start gap-6">
            <Stat value={String(percent(report.share))} unit="%" label={copy.today.hero_label} />
            {report.observation && (
              <p className="m-0 max-w-[30ch] font-display text-title2 leading-snug font-normal">
                {report.observation}
              </p>
            )}
          </div>
          <div className="grid content-start gap-8">
            <section className="rounded-container bg-surface-raised p-4 sm:p-5">
              <TimelineRibbon
                title={t(copy.ribbon.title, { minutes: reportConfig.ribbon_step_minutes })}
                start={clock(report.ribbon.start)}
                bucketMinutes={reportConfig.ribbon_step_minutes}
                states={report.ribbon.states}
                labels={{ G: copy.ribbon.G, D: copy.ribbon.D, A: copy.ribbon.A }}
                toggle={toggle}
              />
            </section>
            <GroupedList title={copy.today.facts_title} level={2}>
              {facts.map((f) => (
                <ListRow key={f.label} label={f.label} value={f.value} />
              ))}
            </GroupedList>
          </div>
        </div>
      </Page>
    </>
  );
}

export function Today() {
  const { data } = useData();
  return (
    <DayReportView
      date={data.today}
      title={copy.today.title}
      subtitle={longDate(data.today, copy.locale)}
    />
  );
}

export function Day({ date }: { date: string }) {
  return <DayReportView date={date} title={longDate(date, copy.locale)} back />;
}
