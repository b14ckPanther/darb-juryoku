import { AppWindow, PictureInPicture2, X } from 'lucide-react';
import { useData } from '../app/data';
import { useSentinel } from '../app/sentinel';
import { settingsConfig } from '../config/runtime';
import { copy } from '../copy';
import { SentinelView } from '../live/SentinelView';
import { Button } from '../ui/button';
import { Notice, Page } from './Page';

/** The sentinel: what it is, a true-size preview, and the button that opens it on top of everything. */
export default function Sentinel() {
  const { data } = useData();
  const sentinel = useSentinel();
  const { width, height } = settingsConfig.sentinel_window;

  return (
    <Page title={copy.sentinel.title}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="grid gap-5">
          <p className="m-0 max-w-[46ch] font-display text-title3 leading-normal font-normal">
            {copy.sentinel.intro}
          </p>
          {!sentinel.supported && (
            <Notice
              icon={AppWindow}
              tone="warning"
              title={copy.sentinel.unsupported_title}
              body={copy.sentinel.unsupported_body}
            />
          )}
          {sentinel.supported && data.library && (
            <div className="flex flex-wrap items-center gap-3">
              {sentinel.isOpen ? (
                <Button variant="quiet" icon={X} onClick={sentinel.close}>
                  {copy.sentinel.close}
                </Button>
              ) : (
                <Button icon={PictureInPicture2} onClick={() => void sentinel.open()}>
                  {copy.sentinel.open}
                </Button>
              )}
              {sentinel.isOpen && (
                <p className="m-0 text-subhead text-text-secondary">{copy.sentinel.is_open}</p>
              )}
            </div>
          )}
          <ul className="m-0 grid list-none gap-2 p-0 text-subhead text-text-secondary">
            {copy.sentinel.facts.map((f) => (
              <li key={f} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-outline-ideal/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        {data.library && (
          <figure className="m-0 grid justify-items-center gap-3">
            <div
              data-theme="dark"
              role="group"
              aria-label={copy.sentinel.preview_label}
              className="overflow-hidden rounded-[14px] border border-rule bg-surface shadow-popover"
              style={{ width, height }}
            >
              <SentinelView />
            </div>
            <figcaption className="num text-footnote text-text-secondary">
              {width} × {height}
            </figcaption>
          </figure>
        )}
      </div>
    </Page>
  );
}
