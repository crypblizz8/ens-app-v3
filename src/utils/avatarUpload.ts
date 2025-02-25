export const imagePercent = 0.6875
export const resolutionMultiplier = 4
export const maxSpeed = 96

export const getVars = (canvas: HTMLCanvasElement) => {
  if (!canvas) {
    return {
      imagePercent: 0,
      size: 0,
      cropSize: 0,
      inverseCropSize: 0,
      ctx: null,
      max: 0,
    }
  }

  const ctx = canvas.getContext('2d')!

  const size = canvas.width
  const cropSize = size * imagePercent
  const inverseCropSize = size * (1 - imagePercent)
  return {
    imagePercent,
    size,
    cropSize,
    inverseCropSize,
    ctx,
    max: inverseCropSize / 2,
  }
}

export const distanceFromEdge = (a: number, max: number, imgSize: number, cropSize: number) =>
  a > max ? max - a : Math.max(max - (a + imgSize) + cropSize, 0)

export const calcMomentum = (a: number, max: number, imgSize: number, crpSz: number) => {
  let momentum = 0
  const distance = distanceFromEdge(a, max, imgSize, crpSz)
  if (distance > 0 || distance < 0) {
    if (distance <= resolutionMultiplier * 2 && distance >= -resolutionMultiplier * 2) {
      momentum = distance
    } else {
      momentum = Math.round(Math.min(Math.max(distance / 16, -maxSpeed), maxSpeed))
    }
  }
  return momentum
}
