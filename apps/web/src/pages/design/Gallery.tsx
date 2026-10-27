import { Download, Inbox, Pause, PictureInPicture2, Settings, Trash2, Volume2 } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { designTokens } from '../../design';
import { designSeed } from '../../demo/seed';
import { Button, IconButton } from '../../ui/button';
import { BarChart, ConfusionMatrix, Heatmap, TimelineRibbon } from '../../ui/charts';
import { SegmentedControl, Slider, Toggle } from '../../ui/controls';
import { Banner, Nudge, Toast } from '../../ui/feedback';
import { PostureGlyph, type PostureClass } from '../../ui/glyphs';
import { GroupedList, ListRow, SwipeRow } from '../../ui/list';
import { ModelCard } from '../../ui/model-card';
import { Sheet } from '../../ui/sheet';
import { EmptyState, PermissionPrompt } from '../../ui/states';
import { DesignShell } from './DesignShell';

function Section({
  title,
  children,
  wide,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={wide ? 'grid gap-5 lg:col-span-2' : 'grid content-start gap-5'}
    >
      <h2 id={id} className="text-title1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StateRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="m-0 text-footnote text-text-secondary">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const chimeUrl = `/audio/${designTokens.sound.chime.file}`;

/** Every component in each of its states, on the live tokens. */
export default function Gallery() {
  const { gallery, history, model, permission, empty, glyphs, today } = designSeed;
  const [range, setRange] = useState(gallery.segmented.options[0] ?? '');
  const [sound, setSound] = useState(false);
  const [sensitivity, setSensitivity] = useState(gallery.slider.value);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [style, setStyle] = useState(gallery.sheet.options[1] ?? '');
  const audio = useRef<HTMLAudioElement | null>(null);
  const s = gallery.sections;
  const b = gallery.buttons;
  const noop = () => undefined;

  return (
    <DesignShell current="/design/components">
      <div className="grid max-w-[62ch] gap-4">
        <h1 className="text-display">{gallery.title}</h1>
        <p className="m-0 text-body text-text-secondary">{gallery.intro}</p>
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-16 lg:grid-cols-2">
        <Section title={s.buttons}>
          <StateRow label={gallery.state_labels.default}>
            <Button>{b.primary}</Button>
            <Button variant="quiet">{b.quiet}</Button>
            <Button variant="destructive" icon={Trash2}>
              {b.destructive}
            </Button>
          </StateRow>
          <StateRow label={gallery.state_labels.disabled}>
            <Button disabled>{b.primary}</Button>
            <Button variant="quiet" disabled>
              {b.quiet}
            </Button>
            <Button variant="destructive" disabled>
              {b.destructive}
            </Button>
          </StateRow>
          <StateRow label={gallery.state_labels.loading}>
            <Button loading>{b.loading}</Button>
            <IconButton icon={Pause} label={b.icon_pause} />
            <IconButton icon={Settings} label={b.icon_settings} />
            <IconButton icon={PictureInPicture2} label={b.icon_sentinel} tone="filled" />
          </StateRow>
        </Section>

        <Section title={s.controls}>
          <SegmentedControl
            label={gallery.segmented.label}
            options={gallery.segmented.options}
            value={range}
            onChange={setRange}
          />
          <div className="grid gap-5 rounded-container bg-surface-raised p-4">
            <Toggle
              label={gallery.toggle.label}
              detail={gallery.toggle.detail}
              checked={sound}
              onChange={setSound}
            />
            <Slider
              label={gallery.slider.label}
              min={gallery.slider.min}
              max={gallery.slider.max}
              value={sensitivity}
              valueLabels={gallery.slider.value_labels}
              onChange={setSensitivity}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="quiet" onClick={() => setSheetOpen(true)}>
              {gallery.sheet.open}
            </Button>
            <Button
              variant="quiet"
              icon={Volume2}
              onClick={() => {
                audio.current ??= new Audio(chimeUrl);
                audio.current.currentTime = 0;
                void audio.current.play();
              }}
            >
              {gallery.chime}
            </Button>
          </div>
        </Section>

        <Section title={s.lists}>
          <GroupedList title={gallery.settings_title}>
            {gallery.rows.map((r) => (
              <ListRow key={r.label} label={r.label} value={r.value} onPress={noop} />
            ))}
          </GroupedList>
          <GroupedList title={gallery.history_title} footer={gallery.swipe_hint}>
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
        </Section>

        <Section title={s.feedback}>
          <Nudge
            title={gallery.nudge.title}
            body={gallery.nudge.body}
            primary={gallery.nudge.primary}
            secondary={gallery.nudge.secondary}
            glyph={<PostureGlyph posture="slouch" />}
            onPrimary={noop}
            onSecondary={noop}
          />
          <div>
            <Toast>{gallery.toast}</Toast>
          </div>
          <Banner tone="warning">{gallery.banner_warning}</Banner>
        </Section>

        <Section title={s.data} wide>
          <div className="grid gap-10 lg:grid-cols-2">
            <TimelineRibbon
              title={today.ribbon.title}
              start={today.ribbon.start}
              bucketMinutes={today.ribbon.bucket_minutes}
              states={today.ribbon.states}
              labels={today.ribbon.labels}
              toggle={gallery.chart_table_toggle}
            />
            <BarChart
              title={history.bars_title}
              bars={history.bars}
              unit={today.hero_unit}
              toggle={gallery.chart_table_toggle}
            />
            <Heatmap
              title={history.heatmap_title}
              rows={history.heatmap.rows}
              columns={history.heatmap.columns}
              values={history.heatmap.values}
              unit={today.hero_unit}
              toggle={gallery.chart_table_toggle}
            />
            <ConfusionMatrix
              title={model.confusion_title}
              classes={model.classes}
              labels={model.class_labels}
              matrix={model.confusion}
              axis={model.confusion_axis}
              toggle={gallery.chart_table_toggle}
            />
          </div>
        </Section>

        <Section title={s.model}>
          <ModelCard
            name={model.name}
            version={model.version}
            dataVersion={model.data_version}
            classes={model.classes}
            classLabels={model.class_labels}
            facts={model.facts}
          />
        </Section>

        <Section title={s.glyphs}>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
            {(Object.keys(glyphs) as PostureClass[]).map((g) => (
              <li
                key={g}
                className="grid justify-items-center gap-2 rounded-container bg-surface-raised px-3 py-5 text-footnote"
              >
                <span className="text-accent-text">
                  <PostureGlyph posture={g} size={40} />
                </span>
                {glyphs[g]}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={s.states} wide>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PermissionPrompt state="prompt" {...permission.prompt} onAction={noop} />
            <PermissionPrompt state="denied" {...permission.denied} onAction={noop} />
            <PermissionPrompt state="missing" {...permission.missing} onAction={noop} />
            <EmptyState icon={Inbox} {...empty} onAction={noop} />
          </div>
        </Section>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={gallery.sheet.title}>
        <p className="mt-0 text-subhead text-text-secondary">{gallery.sheet.body}</p>
        <div className="grid gap-4">
          <SegmentedControl
            label={gallery.sheet.title}
            options={gallery.sheet.options}
            value={style}
            onChange={setStyle}
            orientation="vertical"
          />
          <Button onClick={() => setSheetOpen(false)}>{gallery.sheet.close}</Button>
        </div>
      </Sheet>
    </DesignShell>
  );
}
