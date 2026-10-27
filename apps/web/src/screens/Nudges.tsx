import { BellRing, Moon, Timer, Volume2, Layers } from 'lucide-react';
import { useRef } from 'react';
import { useData } from '../app/data';
import { useToast } from '../app/toast';
import { nudgeConfig } from '../config/runtime';
import { copy, t } from '../copy';
import { Mirror } from '../live/Mirror';
import { Button } from '../ui/button';
import { Nudge } from '../ui/feedback';
import { PostureGlyph } from '../ui/glyphs';
import { GroupedList, ListRow } from '../ui/list';
import { Page } from './Page';
import { clockAfter } from '../report/format';

/** How a nudge escalates (glow, notification, optional chime) and the limits that keep it rare. */
// The original chime (scripts/audio/make_chime.py), served from the app origin.
const chimeUrl = '/audio/nudge-chime.wav';

export default function Nudges() {
  const { data } = useData();
  const toast = useToast();
  const chime = useRef<HTMLAudioElement | null>(null);
  const drift = data.library?.playback.drift_class ?? 'slouch';
  const n = nudgeConfig.notify_after_minutes;
  const quiet = nudgeConfig.quiet_hours_default;
  const stages = [
    { title: copy.nudge.glow_title, body: copy.nudge.glow_body, when: copy.nudge.glow_when },
    {
      title: copy.nudge.notify_title,
      body: t(copy.nudge.notify_body, { minutes: n }),
      when: t(copy.nudge.notify_when, { minutes: n }),
    },
    { title: copy.nudge.chime_title, body: copy.nudge.chime_body, when: copy.nudge.chime_when },
  ];

  const testNotification = async () => {
    if (!('Notification' in window)) return toast(copy.nudge.unsupported);
    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== 'granted') return toast(copy.nudge.blocked);
    new Notification(copy.nudge.app_name, {
      body: t(copy.nudge.titles[drift], { minutes: n }),
      silent: true,
    });
    toast(copy.nudge.test_sent);
  };

  return (
    <Page title={copy.nudge.title}>
      <p className="m-0 mb-10 max-w-[48ch] font-display text-title3 leading-normal font-normal">
        {copy.nudge.intro}
      </p>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section aria-labelledby="ladder">
          <h2 id="ladder" className="mb-5 text-title2">
            {copy.nudge.ladder_title}
          </h2>
          <ol className="m-0 grid list-none gap-0 p-0">
            {stages.map((s, i) => (
              <li
                key={s.title}
                className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0"
              >
                {i < stages.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-12 bottom-1 left-[1.35rem] w-px bg-rule"
                  />
                )}
                <span className="grid size-11 place-items-center rounded-full border border-rule bg-surface-raised text-drift-text">
                  {i === 0 && <Layers aria-hidden size={20} strokeWidth={1.75} />}
                  {i === 1 && <BellRing aria-hidden size={20} strokeWidth={1.75} />}
                  {i === 2 && <Volume2 aria-hidden size={20} strokeWidth={1.75} />}
                </span>
                <div className="grid gap-1 pt-1.5">
                  <h3 className="flex flex-wrap items-baseline gap-x-3 font-ui text-body font-semibold">
                    {s.title}
                    <span className="num text-footnote font-normal text-text-secondary">
                      {s.when}
                    </span>
                  </h3>
                  <p className="m-0 max-w-[52ch] text-subhead text-text-secondary">{s.body}</p>
                  {i === 0 && data.library && (
                    <div className="mt-3 aspect-[4/3] w-56 overflow-hidden rounded-container">
                      <Mirror
                        size="mini"
                        match={0.35}
                        label={copy.live.image_label}
                        state={copy.posture[drift]}
                        posture={drift}
                        good={false}
                      />
                    </div>
                  )}
                  {i === 1 && (
                    <div className="mt-3 grid gap-3">
                      <Nudge
                        title={t(copy.nudge.titles[drift], { minutes: n })}
                        body={copy.nudge.bodies[drift]}
                        primary={copy.nudge.primary}
                        secondary={t(copy.nudge.secondary, { minutes: nudgeConfig.snooze_minutes })}
                        glyph={<PostureGlyph posture={drift} />}
                        onPrimary={() => toast(copy.nudge.sitting_up)}
                        onSecondary={() =>
                          toast(
                            t(copy.nudge.snoozed, { time: clockAfter(nudgeConfig.snooze_minutes) }),
                          )
                        }
                      />
                      <Button
                        variant="quiet"
                        icon={BellRing}
                        className="w-fit"
                        onClick={() => void testNotification()}
                      >
                        {copy.nudge.test}
                      </Button>
                    </div>
                  )}
                  {i === 2 && (
                    <>
                      <Button
                        variant="quiet"
                        icon={Volume2}
                        className="mt-3 w-fit"
                        onClick={() => {
                          chime.current ??= new Audio(chimeUrl);
                          void chime.current.play();
                        }}
                      >
                        {copy.nudge.play_chime}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
        <div className="self-start">
          <GroupedList title={copy.nudge.rules_title} level={2}>
            <ListRow
              icon={Timer}
              label={t(copy.nudge.cooldown, { minutes: nudgeConfig.cooldown_minutes })}
            />
            <ListRow icon={Moon} label={t(copy.nudge.quiet, { from: quiet.from, to: quiet.to })} />
            <ListRow icon={Layers} label={copy.nudge.one_at_a_time} />
          </GroupedList>
        </div>
      </div>
    </Page>
  );
}
