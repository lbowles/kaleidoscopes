function generateColors(mainHue: number, n: number) {
  let colors = []
  for (let i = 0; i < n; i++) {
    // Generate a color with a saturation and lightness value that decreases as the index increases
    let color = `hsl(${mainHue}, ${100 - (i / n) * 50}%, ${70 - (i / n) * 30}%)`
    colors.push(color)
  }
  return colors
}

function randomRange(min: number, max: number, random?: number) {
  random = random || Math.random()
  return random * (max + 1 - min) + min
}

function randomRect(x: number, y: number, r: number, color: string) {
  const width = randomRange(r / 2, r)
  const height = randomRange(r / 2, r)

  const duration = randomRange(5, 10)

  const animations = `<animateTransform attributeName="transform" type="rotate" from="0 0 -${y}" to="360 0 -${y}" begin="0s" dur="${duration}s" repeatCount="indefinite" />`

  return `
    <rect rx="3" ry="3" x="0" y="-${y}" width="${width}" height="${height}" fill="${color}">
      ${animations}
    </rect>
    `
}

function randomTriangle(x: number, y: number, r: number, color: string) {
  // Generate coordinates for isosceles triangle with side length r
  const x1 = randomRange(0, x)
  const y1 = randomRange(0, y)
  const x2 = x1 + r
  const y2 = y1

  const duration = randomRange(5, 10)

  const animations = `<animateTransform attributeName="transform" type="rotate" from="0 ${x1} -${y1}" to="360 ${x1} -${y1}" begin="0s" dur="${Math.round(
    randomRange(4, 10),
  )}s" repeatCount="indefinite" />`

  return `
    <polygon points="0,${-y} ${x2},${y2} ${x1},${y2}" fill="${color}">
      ${animations}
    </polygon>
    `
}

function getHueName(hue: number) {
  const colors = [
    "Red",
    "Orange",
    "Yellow",
    "Chartreuse",
    "Green",
    "Spring green",
    "Turquoise",
    "Teal",
    "Blue",
    "Violet",
    "Magenta",
    "Rose",
  ]

  const colorIndex = Math.round(hue / 30) % colors.length
  return colors[colorIndex]
}

function randomCircle(centerX: number, centerY: number, r: number, color: string) {
  const x1 = randomRange(0, centerX)
  const x2 = randomRange(r / 2, centerX)

  const y1 = randomRange(0, centerY)
  const y2 = randomRange(centerY, r)

  const radius = randomRange(5, r / 6)

  const duration = randomRange(5, 10)
  const alternatingClass = randomRange(0, 3)

  let animations = ""

  if (alternatingClass >= 2) {
    animations +=
      alternatingClass == 3
        ? `<animate attributeName="cx" values="${x1};${x2};${x1}" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="${duration}s" repeatCount="indefinite"/>`
        : `<animate attributeName="cy" values="${y1};${y2};${y1}" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="${
            duration / 2
          }s" repeatCount="indefinite"/>`
  } else {
    animations += `<animate attributeName="cx" values="${x1};${x2};${x1}" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="${duration}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${y1};${y2};${y1}" keyTimes="0;0.5;1" calcMode="linear" begin="0s" dur="${
      duration / 2
    }s" repeatCount="indefinite"/>`
  }

  return `
    <circle cx="${r / 2}" cy="${r / 2}" r="${radius}" fill="${color}">
      ${animations}
    </circle>
    `
}

export function getSVG(canvasWidth: number) {
  const halfCanvasWidth = canvasWidth / 2

  const repetitions = Math.round(randomRange(3, 20))
  const r = 200
  const angleInterval = 360 / repetitions
  const angle = (((180 - angleInterval) / 2) * Math.PI) / 180
  const x = Math.cos(angle) * r
  const y = Math.sin(angle) * r

  const numInsideArtifacts = Math.floor(randomRange(3, 10))
  const numOutsideArtifacts = Math.floor(randomRange(1, 4))
  const hasGradient = Math.random() > 0.9

  console.log("numOutsideArtifacts", numOutsideArtifacts)

  const hasSecondaryColor = Math.random() > 0.85

  const mainHue = Math.floor(Math.random() * 360)
  const secondaryHue = hasSecondaryColor ? (mainHue + 240) % 360 : mainHue
  const [firstPrimaryColorHsl, ...primaryColorsHsl] = generateColors(mainHue, numInsideArtifacts + 1)
  const [firstSecondaryColorHsl, ...secondaryColorsHsl] = generateColors(secondaryHue, numInsideArtifacts + 1)
  const mainColorHsl = `hsl(${mainHue}, 100%, 30%)`
  const darkerSecondaryHsl = `hsl(${(mainHue + 10) % 360}, 100%, 10%)`
  const secondaryColorHsl = `hsl(${secondaryHue}, 100%, 70%)`
  const backgroundColorHsl = `hsl(${mainHue}, 100%, 10%)`

  console.log("mainHue", getHueName(mainHue))
  console.log("hasGradient", hasGradient)
  console.log("hasSecondaryColor", hasSecondaryColor)

  const gradientDef = `
    <linearGradient id="gradient">
      <stop offset="0%" stop-color="${mainColorHsl}"/>
      <stop offset="100%" stop-color="${darkerSecondaryHsl}"/>
    </linearGradient>
  `

  const path = `M0,0L${x},${y}L${x * 2},0A${r},${r},0,0,0,0,0Z`
  const paths = new Array(repetitions)
    .fill(0)
    .map((_, i) => {
      return `<use href="#tile" transform="rotate(${angleInterval * i},${x},${y})" />`
    })
    .join("")

  const bigShapes = new Array(numOutsideArtifacts)
    .fill(0)
    .map((_, i) => {
      const color = i % 2 === 0 ? firstPrimaryColorHsl : firstSecondaryColorHsl
      return Math.random() > 0.5 ? randomTriangle(x, y, r, color) : randomRect(x, y, r, color)
    })
    .join("")

  const circles = new Array(numInsideArtifacts)
    .fill(0)
    .map((_, i) => {
      const color = i % 2 === 0 ? primaryColorsHsl[i] : secondaryColorsHsl[i]
      return randomCircle(x, y, r, color)
    })
    .join("")

  return `
    <svg width="${canvasWidth}" height="${canvasWidth}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${gradientDef}
        <clipPath id="clip">
          <path d="${path}" />
        </clipPath>
        <g id="tile" clip-path="url(#clip)">
          <rect x="0" y="-${r}" width="${r * 2}" height="${r * 2}" fill="${
    hasGradient ? "url(#gradient)" : mainColorHsl
  }">
          </rect>
          ${bigShapes}  
          ${circles}                
        </g>
    </defs>
    <rect width="${canvasWidth}" height="${canvasWidth}" fill="${backgroundColorHsl}"></rect>
        <g id="kaleidoscopeTile" transform="translate(${canvasWidth / 2 - x}, ${canvasWidth / 2 - y})">
          <circle cx="${x}" cy="${y}" r="${r}" fill="${mainColorHsl}" />
          ${paths}
        </g>
    </svg>
    `
}
