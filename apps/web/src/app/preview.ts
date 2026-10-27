/**
 * Demo-only review switch: `?state=loading|error|empty` and screen states such as `denied`,
 * `missing`, `unsupported`, `absent`, `fallback` and `nogpu`, so every state can be seen and tested.
 */
export function previewState(demo: boolean, search = window.location.search): string | null {
  return demo ? new URLSearchParams(search).get('state') : null;
}
