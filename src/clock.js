let offset = 0;
export const now = () => Date.now() + offset;
export function setClockOffset(milliseconds) {
  if (Number.isFinite(milliseconds)) offset = milliseconds;
}
export const clockOffset = () => offset;
