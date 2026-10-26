import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import simdWasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_module_internal.js?url'
import simdWasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_module_internal.wasm?url'
import nonSimdWasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.js?url'
import nonSimdWasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_nosimd_internal.wasm?url'

type WorkerRequest =
    | { type: 'initialize'; modelPath: string }
    | { type: 'analyze'; frame: ImageBitmap }

let landmarker: FaceLandmarker | undefined

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
    const request = event.data

    if (request.type === 'initialize') {
        void (async () => {
            try {
                const supportsSimd = await FilesetResolver.isSimdSupported(true)
                const vision = await FilesetResolver.forVisionTasks('', true)
                vision.wasmLoaderPath = supportsSimd ? simdWasmLoaderUrl : nonSimdWasmLoaderUrl
                vision.wasmBinaryPath = supportsSimd ? simdWasmBinaryUrl : nonSimdWasmBinaryUrl
                landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: request.modelPath, delegate: 'CPU' },
                    runningMode: 'VIDEO',
                    numFaces: 2,
                    outputFaceBlendshapes: true,
                })
                self.postMessage({ type: 'ready' })
            } catch (error) {
                self.postMessage({ type: 'error', message: String(error) })
            }
        })()
        return
    }

    try {
        if (!landmarker) {
            throw new Error('Face landmarker is not initialized')
        }

        const result = landmarker.detectForVideo(request.frame, performance.now())
        self.postMessage({
            type: 'result',
            faceLandmarks: result.faceLandmarks,
            faceBlendshapes: result.faceBlendshapes,
        })
    } catch (error) {
        self.postMessage({ type: 'error', message: String(error) })
    } finally {
        request.frame.close()
    }
})
