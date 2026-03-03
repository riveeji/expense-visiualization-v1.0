import { useEffect, useMemo, useState } from 'react'

interface CountUpNumberProps {
  value: number
  prefix?: string
  suffix?: string
}

export default function CountUpNumber({ value, prefix = '', suffix = '' }: CountUpNumberProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = display
    const end = value
    const duration = 320
    const startedAt = performance.now()
    let frame = 0

    function step(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1)
      const next = start + (end - start) * progress
      setDisplay(next)
      if (progress < 1) {
        frame = requestAnimationFrame(step)
      }
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const formatted = useMemo(
    () => `${prefix}${display.toFixed(2)}${suffix}`,
    [display, prefix, suffix],
  )

  return <>{formatted}</>
}
