export function getAsistenciaEmoji(value: 1 | 0 | null): string {
  if (value === 1) return '🟢';
  if (value === 0) return '🔴';
  return '⚪';
}