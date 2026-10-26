import { useEffect, useState, type RefObject } from 'react'

const DETECTION_INTERVAL_MS = 350
export const CAMERA_PREVIEW_ZOOM = 1.15
const MODEL_PATH = `${import.meta.env.BASE_URL}models/face_landmarker.task`

type FaceLandmarks = Array<{ x: number; y: number }>
type FaceBlendshapes = Array<{
    categories: Array<{ categoryName: string; score: number }>
}>
type WorkerResponse =
    | { type: 'ready' }
    | { type: 'error'; message: string }
    | {
          type: 'result'
          faceLandmarks: FaceLandmarks[]
          faceBlendshapes: FaceBlendshapes
      }
type GuidanceKey =
    | 'no-face'
    | 'multiple-faces'
    | 'too-far'
    | 'too-close'
    | 'off-center'
    | 'head-cropped'
    | 'look-forward'
    | 'eyes-closed'
    | 'poor-light'
    | 'blurred'
    | 'ready'

const GUIDANCE: Record<GuidanceKey, string> = {
    'no-face': 'Не удаётся обнаружить лицо',
    'multiple-faces': 'В кадре должно быть только одно лицо',
    'too-far': 'Подойдите ближе',
    'too-close': 'Отодвиньтесь немного дальше',
    'off-center': 'Расположите лицо по центру',
    'head-cropped': 'Полностью поместите голову и подбородок в кадр',
    'look-forward': 'Смотрите прямо в камеру и выровняйте голову',
    'eyes-closed': 'Откройте глаза',
    'poor-light': 'Измените освещение лица',
    blurred: 'Не двигайтесь, изображение размыто',
    ready: 'Готово к снимку',
}

function getFaceGuidance(
    landmarks: FaceLandmarks[],
    blendshapes: FaceBlendshapes,
    video: HTMLVideoElement,
    faceCanvas: HTMLCanvasElement,
): GuidanceKey[] {
    if (landmarks.length === 0) {
        return ['no-face']
    }
    if (landmarks.length > 1) {
        return ['multiple-faces']
    }

    const face = landmarks[0]
    const sourceXs = face.map((point) => point.x)
    const sourceYs = face.map((point) => point.y)
    const xs = face.map((point) => 0.5 - (point.x - 0.5) * CAMERA_PREVIEW_ZOOM)
    const ys = face.map((point) => 0.5 + (point.y - 0.5) * CAMERA_PREVIEW_ZOOM)
    const sourceMinX = Math.min(...sourceXs)
    const sourceMaxX = Math.max(...sourceXs)
    const sourceMinY = Math.min(...sourceYs)
    const sourceMaxY = Math.max(...sourceYs)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const faceHeight = maxY - minY
    const centerX = (minX + maxX) / 2
    const recommendations: GuidanceKey[] = []

    if (faceHeight < 0.27) {
        recommendations.push('too-far')
    } else if (faceHeight > 0.72) {
        recommendations.push('too-close')
    }
    if (centerX < 0.38 || centerX > 0.62) {
        recommendations.push('off-center')
    }
    if (minY < 0.035 || maxY > 0.97 || minX < 0.015 || maxX > 0.985) {
        recommendations.push('head-cropped')
    }

    const leftEyeOuter = face[33]
    const rightEyeOuter = face[263]
    const nose = face[1]
    if (leftEyeOuter && rightEyeOuter && nose) {
        const leftEyeX = 0.5 - (leftEyeOuter.x - 0.5) * CAMERA_PREVIEW_ZOOM
        const rightEyeX = 0.5 - (rightEyeOuter.x - 0.5) * CAMERA_PREVIEW_ZOOM
        const eyeCenterX = (leftEyeX + rightEyeX) / 2
        const eyeWidth = Math.abs(rightEyeX - leftEyeX)
        const eyeSlope = Math.abs(rightEyeOuter.y - leftEyeOuter.y)
        const noseX = 0.5 - (nose.x - 0.5) * CAMERA_PREVIEW_ZOOM
        if (eyeWidth === 0 || Math.abs(noseX - eyeCenterX) / eyeWidth > 0.16 || eyeSlope > 0.045) {
            recommendations.push('look-forward')
        }
    }

    const eyeScores = blendshapes[0]?.categories
        .filter(
            (category) =>
                category.categoryName === 'eyeBlinkLeft' ||
                category.categoryName === 'eyeBlinkRight',
        )
        .map((category) => category.score)
    if (eyeScores?.length === 2 && eyeScores.some((score) => score > 0.6)) {
        recommendations.push('eyes-closed')
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
        const context = faceCanvas.getContext('2d', { willReadFrequently: true })
        if (context) {
            const sourceFaceWidth = sourceMaxX - sourceMinX
            const sourceFaceHeight = sourceMaxY - sourceMinY
            const sourceCenterX = (sourceMinX + sourceMaxX) / 2
            const cropX = Math.max(
                0,
                Math.floor((sourceCenterX - sourceFaceWidth * 0.55) * video.videoWidth),
            )
            const cropY = Math.max(
                0,
                Math.floor((sourceMinY - sourceFaceHeight * 0.08) * video.videoHeight),
            )
            const cropWidth = Math.min(
                video.videoWidth - cropX,
                Math.ceil(sourceFaceWidth * 1.1 * video.videoWidth),
            )
            const cropHeight = Math.min(
                video.videoHeight - cropY,
                Math.ceil(sourceFaceHeight * 1.15 * video.videoHeight),
            )
            context.drawImage(
                video,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0,
                0,
                faceCanvas.width,
                faceCanvas.height,
            )
            const { data } = context.getImageData(0, 0, faceCanvas.width, faceCanvas.height)
            let totalBrightness = 0
            let edgeEnergy = 0
            let samples = 0

            for (let y = 1; y < faceCanvas.height - 1; y += 2) {
                for (let x = 1; x < faceCanvas.width - 1; x += 2) {
                    const index = (y * faceCanvas.width + x) * 4
                    const brightness =
                        data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
                    totalBrightness += brightness
                    const leftBrightness =
                        data[index - 4] * 0.299 + data[index - 3] * 0.587 + data[index - 2] * 0.114
                    edgeEnergy += Math.abs(brightness - leftBrightness)
                    samples += 1
                }
            }

            if (samples > 0) {
                const averageBrightness = totalBrightness / samples
                if (averageBrightness < 45 || averageBrightness > 220) {
                    recommendations.push('poor-light')
                }
                if (edgeEnergy / samples < 5) {
                    recommendations.push('blurred')
                }
            }
        }
    }

    return recommendations.length ? recommendations : ['ready']
}

export function useFacePhotoGuidance(
    videoRef: RefObject<HTMLVideoElement>,
    enabled: boolean,
): string[] {
    const [recommendations, setRecommendations] = useState<string[]>([])

    useEffect(() => {
        const video = videoRef.current
        if (!enabled || !video) {
            setRecommendations([])
            return
        }

        let active = true
        let workerReady = false
        let analysisInProgress = false
        const faceCanvas = document.createElement('canvas')
        faceCanvas.width = 96
        faceCanvas.height = 96
        const worker = new Worker(
            new URL('../workers/facePhotoAnalysis.worker.ts', import.meta.url),
            {
                type: 'module',
            },
        )

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const message = event.data
            if (message.type === 'ready') {
                workerReady = true
                return
            }
            if (message.type === 'error') {
                analysisInProgress = false
                console.error('Не удалось запустить анализ кадра', message.message)
                return
            }
            if (message.type === 'result') {
                analysisInProgress = false
                setRecommendations(
                    getFaceGuidance(
                        message.faceLandmarks,
                        message.faceBlendshapes,
                        video,
                        faceCanvas,
                    ).map((key) => GUIDANCE[key]),
                )
            }
        }
        worker.onerror = (error) => {
            analysisInProgress = false
            console.error('Ошибка фонового анализа кадра', error)
        }
        worker.postMessage({ type: 'initialize', modelPath: MODEL_PATH })

        const analyzeFrame = () => {
            if (
                !workerReady ||
                analysisInProgress ||
                video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
                return
            }

            analysisInProgress = true
            void createImageBitmap(video)
                .then((frame) => {
                    if (!active) {
                        frame.close()
                        analysisInProgress = false
                        return
                    }
                    worker.postMessage({ type: 'analyze', frame }, [frame])
                })
                .catch((error: unknown) => {
                    analysisInProgress = false
                    console.error('Не удалось подготовить кадр к анализу', error)
                })
        }

        const frameTimer = window.setInterval(analyzeFrame, DETECTION_INTERVAL_MS)

        return () => {
            active = false
            window.clearInterval(frameTimer)
            worker.terminate()
        }
    }, [enabled, videoRef])

    return recommendations
}
