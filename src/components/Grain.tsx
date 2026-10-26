import { useMemo } from 'react'

/** A single static noise tile, generated once — unifies the surfaces at zero GPU cost. */
export function Grain() {
  const url = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 180
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(180, 180)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return c.toDataURL('image/png')
  }, [])
  return <div className="grain" aria-hidden="true" style={{ backgroundImage: `url(${url})` }} />
}
