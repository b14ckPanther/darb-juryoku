// Pure gesture decisions for sheets and swipe rows. Every threshold comes from motion tokens.

interface SheetThresholds {
  dismiss_fraction: number;
  dismiss_velocity_px_s: number;
}

/**
 * A sheet dragged below its lowest detent (positive offset) closes past a fraction of its height or on
 * a fast downward flick. Above the lowest detent a flick steps down a detent instead (see nearestDetent).
 */
export function sheetShouldDismiss(
  offsetY: number,
  velocityY: number,
  sheetHeight: number,
  t: SheetThresholds,
): boolean {
  if (offsetY <= 0) return false;
  return offsetY > sheetHeight * t.dismiss_fraction || velocityY > t.dismiss_velocity_px_s;
}

/**
 * The detent (fraction of viewport height) a released sheet settles on. A flick faster than
 * `flickVelocity` moves one detent in its direction (negative velocity is upward, toward taller).
 */
export function nearestDetent(
  position: number,
  velocityY: number,
  detents: number[],
  flickVelocity = Infinity,
): number {
  const sorted = [...detents].sort((a, b) => a - b);
  if (Math.abs(velocityY) > flickVelocity) {
    const next =
      velocityY < 0
        ? sorted.find((d) => d > position)
        : [...sorted].reverse().find((d) => d < position);
    if (next !== undefined) return next;
  }
  return sorted.reduce((best, d) =>
    Math.abs(d - position) < Math.abs(best - position) ? d : best,
  );
}

/** Where a swipe row settles: fully open (negative actions width) or closed (0). */
export function swipeSettle(
  offsetX: number,
  velocityX: number,
  actionsWidth: number,
  commitFraction: number,
  projectionS: number,
): number {
  const projected = offsetX + velocityX * projectionS;
  return projected < -actionsWidth * commitFraction ? -actionsWidth : 0;
}
