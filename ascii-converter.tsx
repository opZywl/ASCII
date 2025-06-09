"use client"

import type React from "react"
import { useState, useEffect, useRef, type ChangeEvent, useCallback } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GripVertical,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Settings,
  ImageIcon,
  FileText,
  Save,
  Trash2,
  Sparkles,
  Filter,
  Type,
  ExternalLink,
  User,
  X,
} from "lucide-react"

type ColoredChar = {
  char: string
  color: string
}

type Theme = {
  name: string
  background: string
  primary: string
  secondary: string
  accent: string
}

type Preset = {
  name: string
  resolution: number
  charSet: string
  grayscale: boolean
  inverted: boolean
  contrast: number
  brightness: number
  blur: number
  edgeDetection: boolean
  dithering: boolean
}

type ImageFilter = {
  contrast: number
  brightness: number
  blur: number
  sharpen: number
}

const themes: Record<string, Theme> = {
  default: {
    name: "Default",
    background: "#000000",
    primary: "#ffffff",
    secondary: "#888888",
    accent: "#666666",
  },
  dark: {
    name: "Dark",
    background: "#0a0a0a",
    primary: "#ffffff",
    secondary: "#a0a0a0",
    accent: "#333333",
  },
  white: {
    name: "White",
    background: "#ffffff",
    primary: "#000000",
    secondary: "#666666",
    accent: "#cccccc",
  },
  matrix: {
    name: "Matrix",
    background: "#000000",
    primary: "#00ff00",
    secondary: "#008800",
    accent: "#004400",
  },
  retro: {
    name: "Retro",
    background: "#000000",
    primary: "#ffb000",
    secondary: "#cc8800",
    accent: "#996600",
  },
  neon: {
    name: "Neon",
    background: "#0a0a0a",
    primary: "#ff00ff",
    secondary: "#00ffff",
    accent: "#8800ff",
  },
  cyberpunk: {
    name: "Cyberpunk",
    background: "#0d1117",
    primary: "#ff0080",
    secondary: "#00ff80",
    accent: "#8000ff",
  },
}

const defaultPresets: Preset[] = [
  {
    name: "Photo Portrait",
    resolution: 0.15,
    charSet: "detailed",
    grayscale: false,
    inverted: false,
    contrast: 1.2,
    brightness: 1.0,
    blur: 0,
    edgeDetection: false,
    dithering: true,
  },
  {
    name: "Logo",
    resolution: 0.08,
    charSet: "minimal",
    grayscale: true,
    inverted: false,
    contrast: 1.5,
    brightness: 1.1,
    blur: 0,
    edgeDetection: true,
    dithering: false,
  },
  {
    name: "Pixel Art",
    resolution: 0.05,
    charSet: "blocks",
    grayscale: false,
    inverted: false,
    contrast: 1.0,
    brightness: 1.0,
    blur: 0,
    edgeDetection: false,
    dithering: true,
  },
  {
    name: "Sketch",
    resolution: 0.12,
    charSet: "standard",
    grayscale: true,
    inverted: false,
    contrast: 1.3,
    brightness: 0.9,
    blur: 0.5,
    edgeDetection: true,
    dithering: false,
  },
]

export default function AsciiConverter() {
  const [currentTheme, setCurrentTheme] = useState("default")
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [textOverlay, setTextOverlay] = useState("")
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 })
  const [showPortfolioPopup, setShowPortfolioPopup] = useState(false)
  const [watermark, setWatermark] = useState("")
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 90, y: 95 })
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5)

  const [resolution, setResolution] = useState(0.11)
  const [inverted, setInverted] = useState(false)
  const [grayscale, setGrayscale] = useState(false)
  const [charSet, setCharSet] = useState("standard")
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [asciiArt, setAsciiArt] = useState<string>("")
  const [coloredAsciiArt, setColoredAsciiArt] = useState<ColoredChar[][]>([])
  const [leftPanelWidth, setLeftPanelWidth] = useState(25)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [sidebarNarrow, setSidebarNarrow] = useState(false)

  const [imageFilters, setImageFilters] = useState<ImageFilter>({
    contrast: 1,
    brightness: 1,
    blur: 0,
    sharpen: 0,
  })
  const [edgeDetection, setEdgeDetection] = useState(false)
  const [dithering, setDithering] = useState(false)
  const [presets, setPresets] = useState<Preset[]>(defaultPresets)
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [customPresetName, setCustomPresetName] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)
  const filteredCanvasRef = useRef<HTMLCanvasElement>(null)

  const charSets = {
    standard: " .:-=+*#%@",
    detailed: " .,:;i1tfLCG08@",
    blocks: " ░▒▓█",
    minimal: " .:█",
    custom: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPortfolioPopup(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const theme = themes[currentTheme]
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--theme-bg", theme.background)
      document.documentElement.style.setProperty("--theme-primary", theme.primary)
      document.documentElement.style.setProperty("--theme-secondary", theme.secondary)
      document.documentElement.style.setProperty("--theme-accent", theme.accent)
      document.documentElement.style.backgroundColor = theme.background
      document.body.style.backgroundColor = theme.background
    }

    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.backgroundColor = ""
        document.body.style.backgroundColor = ""
      }
    }
  }, [currentTheme])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    setIsDesktop(window.innerWidth >= 768)

    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 768
      setIsDesktop(newIsDesktop)
      if (newIsDesktop !== isDesktop) {
        setLeftPanelWidth(25)
      }
    }

    window.addEventListener("resize", handleResize)
    loadDefaultImage()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isDesktop, isHydrated])

  useEffect(() => {
    if (!isHydrated || !isDesktop) return

    const checkSidebarWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const sidebarWidth = (leftPanelWidth / 100) * containerWidth
        setSidebarNarrow(sidebarWidth < 350)
      }
    }

    checkSidebarWidth()
    window.addEventListener("resize", checkSidebarWidth)

    return () => {
      window.removeEventListener("resize", checkSidebarWidth)
    }
  }, [leftPanelWidth, isHydrated, isDesktop])

  useEffect(() => {
    if (imageLoaded && imageRef.current && imageRef.current.complete) {
      setTimeout(() => convertToAscii(), 0)
    }
  }, [
    resolution,
    inverted,
    grayscale,
    charSet,
    imageLoaded,
    imageFilters.contrast,
    imageFilters.brightness,
    imageFilters.blur,
    imageFilters.sharpen,
    edgeDetection,
    dithering,
  ])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
        if (newLeftWidth >= 20 && newLeftWidth <= 80) {
          setLeftPanelWidth(newLeftWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const startDragging = () => {
    setIsDragging(true)
  }

  const loadDefaultImage = () => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions")
        setLoading(false)
        return
      }

      imageRef.current = img
      setImageLoaded(true)
      setLoading(false)

      setTimeout(() => {
        convertToAscii()
      }, 50)
    }

    img.onerror = () => {
      setError("Failed to load image")
      setLoading(false)
    }

    img.src = "/images/ascii.png"
  }

  const loadImage = (src: string) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions")
        setLoading(false)
        return
      }

      imageRef.current = img
      setImageLoaded(true)
      setLoading(false)

      setTimeout(() => {
        convertToAscii()
      }, 50)
    }

    img.onerror = () => {
      setError("Failed to load image")
      setLoading(false)
    }

    img.src = src
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        loadImage(e.target.result as string)
      }
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(true)
  }

  const handleDragLeave = () => {
    setIsDraggingFile(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const applyImageFilters = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let data = imageData.data

    if (imageFilters.brightness !== 1 || imageFilters.contrast !== 1) {
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        r *= imageFilters.brightness
        g *= imageFilters.brightness
        b *= imageFilters.brightness

        r = (r - 128) * imageFilters.contrast + 128
        g = (g - 128) * imageFilters.contrast + 128
        b = (b - 128) * imageFilters.contrast + 128

        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }
      ctx.putImageData(imageData, 0, 0)
    }

    if (imageFilters.sharpen > 0) {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      data = imageData.data
      const newData = new Uint8ClampedArray(data)

      const sharpenKernel = [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
      ]

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c
                sum += data[idx] * sharpenKernel[ky + 1][kx + 1]
              }
            }
            const idx = (y * canvas.width + x) * 4 + c
            const original = data[idx]
            newData[idx] = Math.max(0, Math.min(255, original + (sum - original) * imageFilters.sharpen))
          }
        }
      }
      ctx.putImageData(new ImageData(newData, canvas.width, canvas.height), 0, 0)
    }

    if (imageFilters.blur > 0) {
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx) {
        tempCtx.filter = `blur(${imageFilters.blur}px)`
        tempCtx.drawImage(canvas, 0, 0)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }

    if (edgeDetection) {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const edgeData = applyEdgeDetection(imageData)
      ctx.putImageData(edgeData, 0, 0)
    }
  }

  const applyEdgeDetection = (imageData: ImageData): ImageData => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const newData = new Uint8ClampedArray(data.length)

    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ]
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0,
            gy = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
            gx += gray * sobelX[ky + 1][kx + 1]
            gy += gray * sobelY[ky + 1][kx + 1]
          }
        }

        const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy))
        const idx = (y * width + x) * 4
        newData[idx] = magnitude
        newData[idx + 1] = magnitude
        newData[idx + 2] = magnitude
        newData[idx + 3] = 255
      }
    }

    for (let x = 0; x < width; x++) {
      for (const y of [0, height - 1]) {
        const idx = (y * width + x) * 4
        newData[idx] = newData[idx + 1] = newData[idx + 2] = 0
        newData[idx + 3] = 255
      }
    }
    for (let y = 0; y < height; y++) {
      for (const x of [0, width - 1]) {
        const idx = (y * width + x) * 4
        newData[idx] = newData[idx + 1] = newData[idx + 2] = 0
        newData[idx + 3] = 255
      }
    }

    return new ImageData(newData, width, height)
  }

  const applyDithering = (brightness: number, x: number, y: number): number => {
    if (!dithering) return brightness

    const bayer = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ]

    const threshold = bayer[y % 4][x % 4] / 16.0
    const ditherAmount = 0.2

    return Math.max(0, Math.min(1, brightness + (threshold - 0.5) * ditherAmount))
  }

  const adjustColorBrightness = (r: number, g: number, b: number, factor: number): string => {
    if (grayscale) {
      const gray = Math.round((r * 0.299 + g * 0.587 + b * 0.114) * factor)
      return `rgb(${gray}, ${gray}, ${gray})`
    }

    const minBrightness = 40
    r = Math.max(Math.min(Math.round(r * factor), 255), minBrightness)
    g = Math.max(Math.min(Math.round(g * factor), 255), minBrightness)
    b = Math.max(Math.min(Math.round(b * factor), 255), minBrightness)

    return `rgb(${r}, ${g}, ${b})`
  }

  const renderToCanvas = () => {
    if (!outputCanvasRef.current || !asciiArt || coloredAsciiArt.length === 0) return

    const canvas = outputCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const fontSize = 8
    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = "top"

    const lineHeight = fontSize
    const charWidth = fontSize * 0.6

    if (grayscale) {
      const lines = asciiArt.split("\n")
      const maxLineLength = Math.max(...lines.map((line) => line.length))
      canvas.width = maxLineLength * charWidth
      canvas.height = lines.length * lineHeight
    } else {
      canvas.width = coloredAsciiArt[0].length * charWidth
      canvas.height = coloredAsciiArt.length * lineHeight
    }

    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = "top"

    const theme = themes[currentTheme]
    const asciiBackground = theme.background
    const asciiPrimary = theme.primary

    ctx.fillStyle = asciiBackground
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (grayscale) {
      ctx.fillStyle = asciiPrimary
      asciiArt.split("\n").forEach((line, lineIndex) => {
        ctx.fillText(line, 0, lineIndex * lineHeight)
      })
    } else {
      coloredAsciiArt.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
          ctx.fillStyle = col.color
          ctx.fillText(col.char, colIndex * charWidth, rowIndex * lineHeight)
        })
      })
    }

    if (textOverlay) {
      ctx.font = `${fontSize * 2}px monospace`
      const overlayColor = theme.secondary
      ctx.fillStyle = overlayColor
      ctx.strokeStyle = asciiBackground
      ctx.lineWidth = 2
      const x = (canvas.width * overlayPosition.x) / 100
      const y = (canvas.height * overlayPosition.y) / 100
      ctx.strokeText(textOverlay, x, y)
      ctx.fillText(textOverlay, x, y)
    }

    if (watermark) {
      ctx.font = `${fontSize}px monospace`
      ctx.globalAlpha = watermarkOpacity
      ctx.fillStyle = theme.secondary
      ctx.strokeStyle = asciiBackground
      ctx.lineWidth = 1
      const x = (canvas.width * watermarkPosition.x) / 100
      const y = (canvas.height * watermarkPosition.y) / 100
      ctx.strokeText(watermark, x, y)
      ctx.fillText(watermark, x, y)
      ctx.globalAlpha = 1
    }
  }

  useEffect(() => {
    if (imageLoaded && !loading && !error) {
      renderToCanvas()
    }
  }, [
    asciiArt,
    coloredAsciiArt,
    grayscale,
    loading,
    error,
    imageLoaded,
    currentTheme,
    textOverlay,
    overlayPosition,
    watermark,
    watermarkPosition,
    watermarkOpacity,
  ])

  const convertToAscii = () => {
    try {
      if (!canvasRef.current || !imageRef.current || !imageLoaded) {
        return
      }

      const img = imageRef.current

      if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        return
      }

      if (img.width === 0 || img.height === 0) {
        throw new Error("Invalid image dimensions")
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      canvas.width = img.width
      canvas.height = img.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, img.width, img.height)

      applyImageFilters(canvas, ctx)

      let imageData
      try {
        imageData = ctx.getImageData(0, 0, img.width, img.height)
      } catch (e) {
        throw new Error("Failed to get image data. This might be a CORS issue.")
      }

      const data = imageData.data
      const chars = charSets[charSet as keyof typeof charSets]

      const width = Math.floor(img.width * resolution)
      const height = Math.floor(img.height * resolution)
      const fontAspect = 0.5
      const widthStep = Math.ceil(img.width / width)
      const heightStep = Math.ceil(img.height / height / fontAspect)

      let result = ""
      const coloredResult: ColoredChar[][] = []

      for (let y = 0; y < img.height; y += heightStep) {
        const coloredRow: ColoredChar[] = []

        for (let x = 0; x < img.width; x += widthStep) {
          const pos = (y * img.width + x) * 4

          const r = data[pos]
          const g = data[pos + 1]
          const b = data[pos + 2]

          let brightness
          if (grayscale) {
            brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255
          } else {
            brightness = Math.sqrt(
                0.299 * (r / 255) * (r / 255) + 0.587 * (g / 255) * (g / 255) + 0.114 * (b / 255) * (b / 255),
            )
          }

          brightness = applyDithering(brightness, x, y)

          if (inverted) brightness = 1 - brightness

          const charIndex = Math.floor(brightness * (chars.length - 1))
          const char = chars[charIndex]

          result += char

          if (!grayscale) {
            const brightnessFactor = (charIndex / (chars.length - 1)) * 1.5 + 0.5
            const color = adjustColorBrightness(r, g, b, brightnessFactor)
            coloredRow.push({ char, color })
          } else {
            coloredRow.push({ char, color: themes[currentTheme].primary })
          }
        }

        result += "\n"
        coloredResult.push(coloredRow)
      }

      setAsciiArt(result)
      setColoredAsciiArt(coloredResult)
      setError(null)
    } catch (err) {
      console.error("Error converting to ASCII:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setAsciiArt("")
      setColoredAsciiArt([])
    }
  }

  const applyPreset = (preset: Preset) => {
    setResolution(preset.resolution)
    setCharSet(preset.charSet)
    setGrayscale(preset.grayscale)
    setInverted(preset.inverted)
    setImageFilters({
      contrast: preset.contrast,
      brightness: preset.brightness,
      blur: preset.blur,
      sharpen: 0,
    })
    setEdgeDetection(preset.edgeDetection)
    setDithering(preset.dithering)
  }

  const savePreset = () => {
    if (!customPresetName.trim()) return

    const newPreset: Preset = {
      name: customPresetName,
      resolution,
      charSet,
      grayscale,
      inverted,
      contrast: imageFilters.contrast,
      brightness: imageFilters.brightness,
      blur: imageFilters.blur,
      edgeDetection,
      dithering,
    }

    setPresets([...presets, newPreset])
    setCustomPresetName("")
  }

  const deletePreset = (index: number) => {
    if (index < defaultPresets.length) return
    setPresets(presets.filter((_, i) => i !== index))
  }

  const resetAllSettings = () => {
    setResolution(0.11)
    setInverted(false)
    setGrayscale(false)
    setCharSet("standard")
    setCurrentTheme("default")
    setImageFilters({
      contrast: 1,
      brightness: 1,
      blur: 0,
      sharpen: 0,
    })
    setEdgeDetection(false)
    setDithering(false)
    setTextOverlay("")
    setOverlayPosition({ x: 50, y: 50 })
    setWatermark("")
    setWatermarkPosition({ x: 90, y: 95 })
    setWatermarkOpacity(0.5)
    setZoom(1)
    setPanX(0)
    setPanY(0)
    setSelectedPreset("")
  }

  const resetPresets = () => {
    setPresets(defaultPresets)
    setSelectedPreset("")
    setCustomPresetName("")
  }

  const downloadAsciiArt = () => {
    if (!asciiArt) {
      setError("No ASCII art to download")
      return
    }

    const element = document.createElement("a")
    const file = new Blob([asciiArt], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "ascii-art.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const exportAsHTML = () => {
    if (!coloredAsciiArt.length) return

    const theme = themes[currentTheme]
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ASCII Art</title>
    <style>
        body { 
            background: ${theme.background}; 
            color: ${theme.primary}; 
            font-family: monospace; 
            white-space: pre; 
            margin: 20px;
            font-size: 8px;
            line-height: 8px;
        }
    </style>
</head>
<body>`

    if (grayscale) {
      html += asciiArt
    } else {
      coloredAsciiArt.forEach((row) => {
        row.forEach((col) => {
          html += `<span style="color: ${col.color}">${col.char}</span>`
        })
        html += "\n"
      })
    }

    html += "</body></html>"

    const element = document.createElement("a")
    const file = new Blob([html], { type: "text/html" })
    element.href = URL.createObjectURL(file)
    element.download = "ascii-art.html"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const exportAsSVG = () => {
    if (!coloredAsciiArt.length) return

    const theme = themes[currentTheme]
    const fontSize = 8
    const charWidth = fontSize * 0.6
    const lineHeight = fontSize

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${coloredAsciiArt[0].length * charWidth}" height="${coloredAsciiArt.length * lineHeight}" style="background: ${theme.background}">
<style>
    .ascii-char { font-family: monospace; font-size: ${fontSize}px; }
</style>`

    coloredAsciiArt.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        svg += `<text x="${colIndex * charWidth}" y="${(rowIndex + 1) * lineHeight}" class="ascii-char" fill="${col.color}">${col.char}</text>`
      })
    })

    svg += "</svg>"

    const element = document.createElement("a")
    const file = new Blob([svg], { type: "image/svg+xml" })
    element.href = URL.createObjectURL(file)
    element.download = "ascii-art.svg"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const exportAsPNG = () => {
    if (!outputCanvasRef.current) return

    outputCanvasRef.current.toBlob((blob) => {
      if (blob) {
        const element = document.createElement("a")
        element.href = URL.createObjectURL(blob)
        element.download = "ascii-art.png"
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      }
    })
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 5))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.1))

  const resetZoom = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true)
  }

  const handlePanMove = useCallback(
      (e: MouseEvent) => {
        if (isPanning) {
          setPanX((prev) => prev + e.movementX)
          setPanY((prev) => prev + e.movementY)
        }
      },
      [isPanning],
  )

  const handlePanEnd = () => {
    setIsPanning(false)
  }

  useEffect(() => {
    if (isPanning) {
      document.addEventListener("mousemove", handlePanMove)
      document.addEventListener("mouseup", handlePanEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handlePanMove)
      document.removeEventListener("mouseup", handlePanEnd)
    }
  }, [isPanning, handlePanMove])

  return (
      <div
          className="min-h-screen w-full transition-all duration-300"
          style={{ backgroundColor: themes[currentTheme].background, color: themes[currentTheme].primary }}
      >
        <div
            ref={containerRef}
            className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden select-none"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
          <div
              ref={previewRef}
              className={`order-1 md:order-2 flex-1 overflow-hidden flex items-center justify-center ${
                  isDraggingFile ? "bg-opacity-50" : ""
              } relative transition-all duration-300`}
              style={{
                backgroundColor: themes[currentTheme].background,
                ...(isHydrated && isDesktop
                    ? {
                      width: `${100 - leftPanelWidth}%`,
                      marginLeft: `${leftPanelWidth}%`,
                    }
                    : {}),
              }}
          >
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <Button onClick={handleZoomIn} size="sm" className="bg-stone-800/80 hover:bg-stone-700/80 backdrop-blur-sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                  onClick={handleZoomOut}
                  size="sm"
                  className="bg-stone-800/80 hover:bg-stone-700/80 backdrop-blur-sm"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button onClick={resetZoom} size="sm" className="bg-stone-800/80 hover:bg-stone-700/80 backdrop-blur-sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {isDraggingFile && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10 select-none">
                  <div className="text-white text-xl font-mono">Drop image here</div>
                </div>
            )}

            {loading ? (
                <div className="font-mono select-none flex items-center gap-2">
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Loading image...
                </div>
            ) : error ? (
                <div className="text-red-400 font-mono p-4 text-center select-none">
                  {error}
                  <div className="mt-2 text-sm">Try uploading a different image or refreshing the page.</div>
                </div>
            ) : (
                <div
                    className="overflow-auto w-full h-full flex items-center justify-center cursor-move"
                    onMouseDown={handlePanStart}
                    style={{
                      transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                      transformOrigin: "center center",
                    }}
                >
                  <canvas
                      ref={outputCanvasRef}
                      className="max-w-none select-text transition-transform duration-200"
                      style={{
                        fontSize: "0.4rem",
                        lineHeight: "0.4rem",
                        fontFamily: "monospace",
                      }}
                  />
                </div>
            )}
          </div>

          {showPortfolioPopup && (
              <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
                <div
                    className="relative p-4 rounded-lg shadow-2xl max-w-sm border backdrop-blur-sm"
                    style={{
                      backgroundColor: themes[currentTheme].background,
                      borderColor: themes[currentTheme].accent,
                      color: themes[currentTheme].primary,
                    }}
                >
                  <Button
                      onClick={() => setShowPortfolioPopup(false)}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-stone-700"
                      style={{ color: themes[currentTheme].secondary }}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center border"
                        style={{
                          backgroundColor: themes[currentTheme].accent,
                          borderColor: themes[currentTheme].primary,
                        }}
                    >
                      <User className="h-5 w-5" style={{ color: themes[currentTheme].primary }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: themes[currentTheme].primary }}>
                        Lucas Lima
                      </h3>
                      <p className="text-xs" style={{ color: themes[currentTheme].secondary }}>
                        Full Stack Developer
                      </p>
                    </div>
                  </div>

                  <p className="text-xs mb-3 leading-relaxed" style={{ color: themes[currentTheme].secondary }}>
                    Check my portfolio!
                  </p>

                  <Button
                      onClick={() => window.open("https://lucas-lima.vercel.app", "_blank")}
                      className="w-full text-xs h-8 bg-stone-700 hover:bg-stone-600 border-stone-600"
                      style={{
                        backgroundColor: themes[currentTheme].accent,
                        color: themes[currentTheme].primary,
                        borderColor: themes[currentTheme].primary,
                      }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Ver Portfólio
                  </Button>
                </div>

                <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
          )}

          {!showPortfolioPopup && (
              <div className="fixed bottom-6 right-6 z-50 cursor-pointer" onClick={() => setShowPortfolioPopup(true)}>
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg hover:scale-110 transition-transform duration-200"
                    style={{
                      backgroundColor: themes[currentTheme].background,
                      borderColor: themes[currentTheme].accent,
                      color: themes[currentTheme].primary,
                    }}
                >
                  <User className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
              </div>
          )}

          {isHydrated && isDesktop && (
              <div
                  className="order-3 w-2 hover:bg-stone-600 cursor-col-resize items-center justify-center z-10 transition-all duration-300"
                  onMouseDown={startDragging}
                  style={{
                    position: "absolute",
                    left: `${leftPanelWidth}%`,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    backgroundColor: themes[currentTheme].accent,
                  }}
              >
                <GripVertical className="h-6 w-6" style={{ color: themes[currentTheme].secondary }} />
              </div>
          )}

          <div
              className={`order-2 md:order-1 w-full md:h-auto p-2 md:p-4 font-mono transition-all duration-300 ${
                  !isHydrated ? "opacity-0" : "opacity-100"
              }`}
              style={{
                backgroundColor: themes[currentTheme].background,
                borderColor: themes[currentTheme].accent,
                color: themes[currentTheme].secondary,
                width: "100%",
                height: "auto",
                flex: "0 0 auto",
                ...(isHydrated && isDesktop
                    ? {
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${leftPanelWidth}%`,
                      overflowY: "auto",
                    }
                    : {}),
              }}
          >
            <div className="space-y-4 p-2 md:p-4 border rounded-md" style={{ borderColor: themes[currentTheme].accent }}>
              <div className="space-y-1">
                <h1
                    className="text-2xl font-bold flex items-center justify-center gap-2"
                    style={{ color: themes[currentTheme].primary }}
                >
                  <Sparkles className="h-6 w-6" />
                  ASCII
                </h1>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-stone-800">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="filters">Filters</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <Label className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Theme
                    </Label>
                    <Select value={currentTheme} onValueChange={setCurrentTheme}>
                      <SelectTrigger className="bg-stone-800 border-stone-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-800 border-stone-700">
                        {Object.entries(themes).map(([key, theme]) => (
                            <SelectItem key={key} value={key} className="focus:bg-stone-700">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                                {theme.name}
                              </div>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <Label htmlFor="resolution">Resolution: {resolution.toFixed(2)}</Label>
                    <Slider
                        id="resolution"
                        min={0.05}
                        max={0.3}
                        step={0.01}
                        value={[resolution]}
                        onValueChange={(value) => setResolution(value[0])}
                        className="[&>span]:border-none [&_.bg-primary]:bg-stone-800 [&>.bg-background]:bg-stone-500/30"
                    />
                  </div>

                  <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <Label htmlFor="charset">Character Set</Label>
                    <Select value={charSet} onValueChange={setCharSet}>
                      <SelectTrigger id="charset" className="bg-stone-800 border-stone-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-800 border-stone-700">
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="blocks">Block Characters</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="custom">Extended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="invert">Invert Colors</Label>
                      <Switch id="invert" checked={inverted} onCheckedChange={setInverted} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="grayscale">Grayscale Mode</Label>
                      <Switch id="grayscale" checked={grayscale} onCheckedChange={setGrayscale} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="dithering">Dithering</Label>
                      <Switch id="dithering" checked={dithering} onCheckedChange={setDithering} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="edge">Edge Detection</Label>
                      <Switch id="edge" checked={edgeDetection} onCheckedChange={setEdgeDetection} />
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <Label className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Text Overlay
                    </Label>
                    <Input
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        placeholder="Enter text to overlay..."
                        className="bg-stone-800 border-stone-700"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X Position (%)</Label>
                        <Slider
                            min={0}
                            max={100}
                            value={[overlayPosition.x]}
                            onValueChange={(value) => setOverlayPosition((prev) => ({ ...prev, x: value[0] }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position (%)</Label>
                        <Slider
                            min={0}
                            max={100}
                            value={[overlayPosition.y]}
                            onValueChange={(value) => setOverlayPosition((prev) => ({ ...prev, y: value[0] }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <Label className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Watermark
                    </Label>
                    <Input
                        value={watermark}
                        onChange={(e) => setWatermark(e.target.value)}
                        placeholder="Enter watermark text..."
                        className="bg-stone-800 border-stone-700"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">X Position (%)</Label>
                        <Slider
                            min={0}
                            max={100}
                            value={[watermarkPosition.x]}
                            onValueChange={(value) => setWatermarkPosition((prev) => ({ ...prev, x: value[0] }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position (%)</Label>
                        <Slider
                            min={0}
                            max={100}
                            value={[watermarkPosition.y]}
                            onValueChange={(value) => setWatermarkPosition((prev) => ({ ...prev, y: value[0] }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Opacity</Label>
                        <Slider
                            min={0.1}
                            max={1}
                            step={0.1}
                            value={[watermarkOpacity]}
                            onValueChange={(value) => setWatermarkOpacity(value[0])}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                    <Button
                        onClick={resetAllSettings}
                        variant="outline"
                        className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Settings
                    </Button>
                  </div>

                  <div className="hidden">
                    <canvas ref={canvasRef} width="300" height="300"></canvas>
                    <canvas ref={filteredCanvasRef} width="300" height="300"></canvas>
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4" />
                      <span className="font-semibold">Image Filters</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Contrast: {imageFilters.contrast.toFixed(1)}</Label>
                        <Slider
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[imageFilters.contrast]}
                            onValueChange={(value) => setImageFilters((prev) => ({ ...prev, contrast: value[0] }))}
                        />
                      </div>

                      <div>
                        <Label>Brightness: {imageFilters.brightness.toFixed(1)}</Label>
                        <Slider
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[imageFilters.brightness]}
                            onValueChange={(value) => setImageFilters((prev) => ({ ...prev, brightness: value[0] }))}
                        />
                      </div>

                      <div>
                        <Label>Blur: {imageFilters.blur.toFixed(1)}px</Label>
                        <Slider
                            min={0}
                            max={5}
                            step={0.1}
                            value={[imageFilters.blur]}
                            onValueChange={(value) => setImageFilters((prev) => ({ ...prev, blur: value[0] }))}
                        />
                      </div>

                      <div>
                        <Label>Sharpen: {imageFilters.sharpen.toFixed(1)}</Label>
                        <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[imageFilters.sharpen]}
                            onValueChange={(value) => setImageFilters((prev) => ({ ...prev, sharpen: value[0] }))}
                        />
                      </div>
                    </div>

                    <Button
                        onClick={() => setImageFilters({ contrast: 1, brightness: 1, blur: 0, sharpen: 0 })}
                        variant="outline"
                        className="w-full"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="presets" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="font-semibold">Presets</span>
                      </div>
                      <Button
                          onClick={resetPresets}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset Presets
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      {presets.map((preset, index) => (
                          <Card key={index} className="bg-stone-800 border-stone-700">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{preset.name}</h4>
                                  <div className="flex gap-1 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {preset.charSet}
                                    </Badge>
                                    {preset.grayscale && (
                                        <Badge variant="outline" className="text-xs">
                                          Grayscale
                                        </Badge>
                                    )}
                                    {preset.edgeDetection && (
                                        <Badge variant="outline" className="text-xs">
                                          Edge
                                        </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                      size="sm"
                                      onClick={() => applyPreset(preset)}
                                      className="bg-stone-700 hover:bg-stone-600"
                                  >
                                    Apply
                                  </Button>
                                  {index >= defaultPresets.length && (
                                      <Button size="sm" variant="destructive" onClick={() => deletePreset(index)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      ))}
                    </div>

                    <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                      <Label>Save Current Settings</Label>
                      <div className="flex gap-2">
                        <Input
                            value={customPresetName}
                            onChange={(e) => setCustomPresetName(e.target.value)}
                            placeholder="Preset name..."
                            className="bg-stone-800 border-stone-700"
                        />
                        <Button
                            onClick={savePreset}
                            disabled={!customPresetName.trim()}
                            className="bg-stone-700 hover:bg-stone-600"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="export" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Download className="h-4 w-4" />
                      <span className="font-semibold">Export Options</span>
                    </div>

                    <div className="grid gap-2">
                      <Button
                          onClick={downloadAsciiArt}
                          disabled={loading || !imageLoaded || !asciiArt}
                          className="bg-stone-700 hover:bg-stone-600 justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download as TXT
                      </Button>

                      <Button
                          onClick={exportAsHTML}
                          disabled={loading || !imageLoaded || !coloredAsciiArt.length}
                          className="bg-stone-700 hover:bg-stone-600 justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export as HTML
                      </Button>

                      <Button
                          onClick={exportAsSVG}
                          disabled={loading || !imageLoaded || !coloredAsciiArt.length}
                          className="bg-stone-700 hover:bg-stone-600 justify-start"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Export as SVG
                      </Button>

                      <Button
                          onClick={exportAsPNG}
                          disabled={loading || !imageLoaded}
                          className="bg-stone-700 hover:bg-stone-600 justify-start"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Export as PNG
                      </Button>
                    </div>

                    <div className="space-y-2 border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                      <Button
                          onClick={() => {
                            if (!asciiArt) {
                              setError("No ASCII art to copy")
                              return
                            }
                            navigator.clipboard
                                .writeText(asciiArt)
                                .then(() => {
                                  const originalError = error
                                  setError("✓ Copied to clipboard!")
                                  setTimeout(() => setError(originalError), 2000)
                                })
                                .catch(() => {
                                  setError("Failed to copy to clipboard")
                                })
                          }}
                          disabled={loading || !imageLoaded}
                          className="w-full bg-stone-700 hover:bg-stone-600"
                      >
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="border-t pt-4" style={{ borderColor: themes[currentTheme].accent }}>
                <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-stone-700 hover:bg-stone-600">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Image
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
              </div>

              <div className="hidden">
                <canvas ref={canvasRef} width="300" height="300"></canvas>
                <canvas ref={filteredCanvasRef} width="300" height="300"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
