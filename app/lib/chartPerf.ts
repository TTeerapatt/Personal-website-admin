export const CHART_ANIMATION_MS = 650;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function downsamplePoints<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points;
  if (maxPoints <= 2) return [points[0], points[points.length - 1]];

  const result: T[] = [];
  const lastIndex = points.length - 1;
  const step = lastIndex / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round(i * step);
    const point = points[index];
    if (result.length === 0 || result[result.length - 1] !== point) {
      result.push(point);
    }
  }

  const last = points[lastIndex];
  if (result[result.length - 1] !== last) {
    result.push(last);
  }

  return result;
}
