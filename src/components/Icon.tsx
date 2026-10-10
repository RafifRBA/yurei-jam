const PATHS = {
  play: 'M8 5v14l11-7z',
  pause: 'M8 5v14M16 5v14',
  reset: 'M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5',
  brake: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  chevron: 'm6 9 6 6 6-6',
  close: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  warn: 'M12 4 3 20h18L12 4zM12 10v5M12 17.5v.5',
} as const

export type IconName = keyof typeof PATHS

/** Drawn icons, one stroke weight. Decorative: the button carries the text. */
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
