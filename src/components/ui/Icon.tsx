import type { CSSProperties } from 'react'

/** Icon-IDs aus dem Sprite `public/icons/sprite.svg`. */
export type IconName =
  | 'icSearch' | 'icCards' | 'icList' | 'icQuiz' | 'icChart' | 'icCube'
  | 'icGear' | 'icSun' | 'icMoon' | 'icClose' | 'icChevD' | 'icChevR'
  | 'icCheck' | 'icFilter' | 'icMenu' | 'icArrow' | 'icArrowL'
  | 'icBookmark' | 'icFlip' | 'icFlame' | 'icTrophy' | 'icTarget'
  | 'icImage' | 'icPlus' | 'icInfo' | 'icFlag'

const SPRITE = `${import.meta.env.BASE_URL}icons/sprite.svg`

interface IconProps {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
  /** Gesetzt → Icon wird als Bild mit diesem Label angekündigt; sonst dekorativ (aria-hidden). */
  title?: string
}

/** SVG-Sprite-Wrapper. Erbt `currentColor`. */
export function Icon({ name, size = 20, className, style, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <use href={`${SPRITE}#${name}`} />
    </svg>
  )
}
