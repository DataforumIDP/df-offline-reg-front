# Camera analysis model

`face_landmarker.task` is the MediaPipe Face Landmarker model, float16 version 1:

https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

The model and MediaPipe WASM runtime are bundled with the application. Video frames are analyzed locally in the camera window and are not uploaded by this feature.

The WASM runtime is from `@mediapipe/tasks-vision` 1.1.0 (Apache-2.0).
