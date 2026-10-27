import {
  Bell,
  Camera,
  Database,
  Download,
  FlaskConical,
  Keyboard,
  LogOut,
  Moon,
  ScanFace,
  Send,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useData } from '../app/data';
import { downloadJson } from '../app/download';
import { usePrefs } from '../app/prefs';
import { useRouter } from '../app/router';
import { ShortcutSheet, ThemeSwitch } from '../app/Shell';
import { useToast } from '../app/toast';
import { settingsConfig } from '../config/runtime';
import { copy, t } from '../copy';
import { rememberDemoMode } from '../data/mode';
import { Button } from '../ui/button';
import { SegmentedControl, Slider, Toggle } from '../ui/controls';
import { TextField } from '../ui/field';
import { GroupedList, ListRow } from '../ui/list';
import { Sheet } from '../ui/sheet';
import { Page } from './Page';

type SheetName = 'camera' | 'style' | 'quiet' | 'delete' | 'shortcuts' | null;

/** Inset grouped settings, as on the phone, with every choice from config and copy. */
export default function Settings() {
  const { data, dispatch, initial } = useData();
  const { navigate } = useRouter();
  const toast = useToast();
  const [prefs, update] = usePrefs();
  const [sheet, setSheet] = useState<SheetName>(null);
  const s = copy.settings;
  const lib = data.library;
  const cameras = lib?.cameras ?? [];
  const close = () => setSheet(null);
  const row = 'rounded-container bg-surface-raised px-4 py-3';
  const quietValue = prefs.quiet.enabled
    ? t(copy.units.clock_range, { from: prefs.quiet.from, to: prefs.quiet.to })
    : s.quiet_off;
  const retention = (d: number) =>
    (s.retention_options as Record<string, string>)[String(d)] ?? t(copy.units.days, { n: d });

  return (
    <Page title={s.title}>
      <div className="grid max-w-2xl gap-8">
        <GroupedList title={s.groups.camera} level={2}>
          <ListRow
            icon={Camera}
            label={s.camera_device}
            value={prefs.camera || s.camera_none}
            onPress={cameras.length ? () => setSheet('camera') : undefined}
          />
          <ListRow
            icon={ScanFace}
            label={s.calibrations}
            value={t(s.calibrations_value, { n: lib?.calibrations.length ?? 0 })}
            onPress={() => navigate('/calibrate')}
          />
        </GroupedList>

        <GroupedList title={s.groups.nudges} level={2}>
          <ListRow
            icon={Bell}
            label={s.nudge_style}
            value={s.nudge_styles[prefs.style]}
            onPress={() => setSheet('style')}
          />
          <ListRow
            icon={Moon}
            label={s.quiet_hours}
            value={quietValue}
            onPress={() => setSheet('quiet')}
          />
          <li className="px-4 py-1.5">
            <Toggle
              label={s.chime}
              detail={s.chime_detail}
              checked={prefs.chime}
              onChange={(chime) => update({ chime })}
            />
          </li>
        </GroupedList>

        <section aria-labelledby="tracking" className="grid gap-2">
          <h2 id="tracking" className="px-4 font-ui text-footnote font-medium text-text-secondary">
            {s.groups.tracking}
          </h2>
          <div className={`${row} grid gap-5`}>
            <Slider
              label={s.sensitivity}
              min={settingsConfig.sensitivity.min}
              max={settingsConfig.sensitivity.max}
              value={prefs.sensitivity}
              valueLabels={s.sensitivity_levels}
              onChange={(sensitivity) => update({ sensitivity })}
            />
            <div className="grid gap-2">
              <span className="text-body">{s.sample_rate}</span>
              <SegmentedControl
                label={s.sample_rate}
                options={settingsConfig.sample_rates_hz.map((n) => t(s.sample_rate_value, { n }))}
                value={t(s.sample_rate_value, { n: prefs.sampleHz })}
                onChange={(v) =>
                  update({
                    sampleHz:
                      settingsConfig.sample_rates_hz.find(
                        (n) => t(s.sample_rate_value, { n }) === v,
                      ) ?? prefs.sampleHz,
                  })
                }
              />
              <p className="m-0 text-footnote text-text-secondary">{s.sample_rate_note}</p>
            </div>
          </div>
          <p className="m-0 px-4 text-footnote text-text-secondary">{s.sensitivity_note}</p>
        </section>

        <section aria-labelledby="budokai" className="grid gap-2">
          <h2 id="budokai" className="px-4 font-ui text-footnote font-medium text-text-secondary">
            {s.groups.budokai}
          </h2>
          <div className={`${row} grid gap-4`}>
            <Toggle
              label={s.budokai_toggle}
              detail={s.budokai_detail}
              checked={prefs.budokai.enabled}
              onChange={(enabled) => update({ budokai: { ...prefs.budokai, enabled } })}
            />
            {prefs.budokai.enabled && (
              <div className="grid gap-4 border-t border-rule pt-4">
                <TextField
                  label={s.budokai_url}
                  type="url"
                  inputMode="url"
                  placeholder={s.budokai_url_hint}
                  value={prefs.budokai.url}
                  onChange={(url) => update({ budokai: { ...prefs.budokai, url } })}
                />
                <TextField
                  label={s.budokai_key}
                  type="password"
                  autoComplete="off"
                  value={prefs.budokai.key}
                  onChange={(key) => update({ budokai: { ...prefs.budokai, key } })}
                />
                <TextField
                  label={s.budokai_secret}
                  hint={s.budokai_secret_hint}
                  type="password"
                  autoComplete="off"
                  value={prefs.budokai.secret}
                  onChange={(secret) => update({ budokai: { ...prefs.budokai, secret } })}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="quiet"
                    icon={Send}
                    disabled={!prefs.budokai.url}
                    onClick={() => toast(s.budokai_test_demo)}
                  >
                    {s.budokai_test}
                  </Button>
                  <span className="text-subhead text-text-secondary">
                    {s.budokai_outbox} <span className="num text-text">0</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        <GroupedList title={s.groups.data} level={2}>
          <li className="grid gap-2 px-4 py-3">
            <span className="text-body">{s.retention}</span>
            <SegmentedControl
              label={s.retention}
              options={settingsConfig.retention_days_options.map(retention)}
              value={retention(prefs.retentionDays)}
              onChange={(v) =>
                update({
                  retentionDays:
                    settingsConfig.retention_days_options.find((d) => retention(d) === v) ??
                    prefs.retentionDays,
                })
              }
            />
          </li>
          <ListRow
            icon={Download}
            label={s.export}
            onPress={() => {
              downloadJson(`${settingsConfig.export_file_prefix}-export.json`, {
                demo: data.demo,
                sessions: data.sessions,
                minutes: data.buckets,
              });
              toast(s.exported);
            }}
          />
        </GroupedList>

        <GroupedList title={s.groups.tools} level={2}>
          <ListRow icon={Database} label={copy.nav.studio} onPress={() => navigate('/studio')} />
          <ListRow icon={FlaskConical} label={copy.nav.lab} onPress={() => navigate('/lab')} />
          <ListRow icon={Bell} label={copy.nav.nudges} onPress={() => navigate('/nudges')} />
          <ListRow icon={Keyboard} label={s.shortcuts} onPress={() => setSheet('shortcuts')} />
        </GroupedList>

        <section aria-labelledby="appearance" className="grid gap-2">
          <h2
            id="appearance"
            className="px-4 font-ui text-footnote font-medium text-text-secondary"
          >
            {s.groups.appearance}
          </h2>
          <div className={`${row} flex items-center justify-between gap-4`}>
            <span className="text-body">{copy.theme.label}</span>
            <ThemeSwitch />
          </div>
        </section>

        <div className="grid gap-3">
          <Button
            variant="destructive"
            icon={Trash2}
            className="w-full sm:w-fit"
            onClick={() => setSheet('delete')}
          >
            {s.delete}
          </Button>
          {data.demo && (
            <Button
              variant="quiet"
              icon={LogOut}
              className="w-full sm:w-fit"
              onClick={() => {
                rememberDemoMode(false);
                window.location.assign('/?demo=0');
              }}
            >
              {copy.demo.leave}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={sheet === 'camera'} onClose={close} title={s.camera_device}>
        <div className="pb-4">
          <SegmentedControl
            label={s.camera_device}
            options={cameras}
            value={prefs.camera}
            onChange={(camera) => update({ camera })}
            orientation="vertical"
          />
        </div>
      </Sheet>
      <Sheet open={sheet === 'style'} onClose={close} title={s.nudge_style}>
        <p className="mt-0 text-subhead text-text-secondary">{s.nudge_style_body}</p>
        <div className="pb-4">
          <SegmentedControl
            label={s.nudge_style}
            options={[s.nudge_styles.glow, s.nudge_styles.glow_notify]}
            value={s.nudge_styles[prefs.style]}
            onChange={(v) => update({ style: v === s.nudge_styles.glow ? 'glow' : 'glow_notify' })}
            orientation="vertical"
          />
        </div>
      </Sheet>
      <Sheet open={sheet === 'quiet'} onClose={close} title={s.quiet_hours}>
        <div className="grid gap-5 pb-4">
          <Toggle
            label={s.quiet_enabled}
            checked={prefs.quiet.enabled}
            onChange={(enabled) => update({ quiet: { ...prefs.quiet, enabled } })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={s.from}
              type="time"
              value={prefs.quiet.from}
              disabled={!prefs.quiet.enabled}
              onChange={(from) => update({ quiet: { ...prefs.quiet, from } })}
            />
            <TextField
              label={s.to}
              type="time"
              value={prefs.quiet.to}
              disabled={!prefs.quiet.enabled}
              onChange={(to) => update({ quiet: { ...prefs.quiet, to } })}
            />
          </div>
          <Button onClick={close}>{s.done}</Button>
        </div>
      </Sheet>
      <Sheet open={sheet === 'delete'} onClose={close} title={s.delete_title}>
        <p className="mt-0 text-subhead text-text-secondary">{s.delete_body}</p>
        <div className="grid gap-2 pb-2 sm:grid-cols-2">
          <Button variant="quiet" onClick={close}>
            {s.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              dispatch({
                type: 'reset',
                snapshot: data.demo
                  ? initial
                  : { ...data, buckets: [], sessions: [], library: null },
              });
              close();
              toast(data.demo ? s.delete_demo : s.deleted);
            }}
          >
            {s.delete_confirm}
          </Button>
        </div>
      </Sheet>
      <ShortcutSheet open={sheet === 'shortcuts'} onClose={close} />
    </Page>
  );
}
