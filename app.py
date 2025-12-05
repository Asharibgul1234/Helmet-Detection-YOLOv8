import os
import threading
import time
from pathlib import Path
from flask import Flask, request, send_file, Response, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO

# ---------- CONFIG ----------
MODEL_PATH = r"C:\Users\Gul Sher\Desktop\Helmet_Detection With Yolo8\HelmetDetection\best.pt"
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
YOLO_DEVICE = "cpu"
# ----------------------------

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # enable full cross-origin

# Load YOLO model
model = YOLO(MODEL_PATH)

# Live stream control
_live_thread = None
_live_stop_flag = threading.Event()
_live_frame_lock = threading.Lock()
_live_frame = None  # latest processed frame (BGR)

def process_frame(frame):
    """Run detection on single BGR frame and return annotated BGR frame"""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = model.predict(source=[rgb], device=YOLO_DEVICE, verbose=False, imgsz=640)
    try:
        annotated_rgb = results[0].plot()
        annotated_bgr = cv2.cvtColor(annotated_rgb, cv2.COLOR_RGB2BGR)
        return annotated_bgr
    except Exception as e:
        print("Annotation failed:", e)
        return frame

# ---------- IMAGE UPLOAD ----------
@app.route("/upload_image", methods=["POST"])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "no file part"}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({"error": "no selected file"}), 400
    save_path = UPLOAD_DIR / f.filename
    f.save(str(save_path))

    img = cv2.imdecode(np.fromfile(str(save_path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        save_path.unlink(missing_ok=True)
        return jsonify({"error": "could not read image"}), 400

    annotated = process_frame(img)
    is_success, buffer = cv2.imencode(".png", annotated)
    save_path.unlink(missing_ok=True)
    if not is_success:
        return jsonify({"error": "encoding failed"}), 500
    return Response(buffer.tobytes(), mimetype="image/png")

# ---------- VIDEO UPLOAD ----------
@app.route("/upload_video", methods=["POST"])
def upload_video():
    if 'file' not in request.files:
        return jsonify({"error": "no file part"}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({"error": "no selected file"}), 400
    save_path = UPLOAD_DIR / f.filename
    f.save(str(save_path))

    cap = cv2.VideoCapture(str(save_path))
    if not cap.isOpened():
        save_path.unlink(missing_ok=True)
        return jsonify({"error": "could not open video"}), 400

    fps = cap.get(cv2.CAP_PROP_FPS) or 20.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out_name = OUTPUT_DIR / f"processed_{int(time.time())}.mp4"
    out = cv2.VideoWriter(str(out_name), fourcc, fps, (width, height))

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        annotated = process_frame(frame)
        out.write(annotated)

    cap.release()
    out.release()
    save_path.unlink(missing_ok=True)
    return send_file(str(out_name), as_attachment=True, download_name=out_name.name)

# ---------- LIVE STREAM ----------
def live_capture_loop(device_index=0):
    global _live_frame
    cap = cv2.VideoCapture(device_index)
    if not cap.isOpened():
        print("Cannot open camera", device_index)
        _live_stop_flag.set()
        return
    while not _live_stop_flag.is_set():
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue
        annotated = process_frame(frame)
        with _live_frame_lock:
            _live_frame = annotated
        time.sleep(0.03)
    cap.release()
    print("Live capture stopped")

@app.route("/start_live", methods=["POST"])
def start_live():
    global _live_thread, _live_stop_flag
    if _live_thread and _live_thread.is_alive():
        return jsonify({"status": "already_running"}), 200
    data = request.get_json(silent=True) or {}
    device = int(data.get("device", 0))
    _live_stop_flag.clear()
    _live_thread = threading.Thread(target=live_capture_loop, args=(device,), daemon=True)
    _live_thread.start()
    return jsonify({"status": "started", "device": device})

@app.route("/stop_live", methods=["POST"])
def stop_live():
    global _live_stop_flag
    _live_stop_flag.set()
    return jsonify({"status": "stop_requested"})

def generate_mjpeg():
    global _live_frame
    while not _live_stop_flag.is_set():
        with _live_frame_lock:
            frame = None if _live_frame is None else _live_frame.copy()
        if frame is None:
            time.sleep(0.05)
            continue
        ret, jpeg = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = jpeg.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)

@app.route("/video_feed")
def video_feed():
    return Response(generate_mjpeg(), mimetype='multipart/x-mixed-replace; boundary=frame')

# ---------- DELETE ALL ----------
@app.route("/delete_all", methods=["POST"])
def delete_all():
    print("DELETE ALL called!")  # debug
    for d in (UPLOAD_DIR, OUTPUT_DIR):
        for f in d.iterdir():
            try:
                f.unlink()
            except Exception as e:
                print(f"Failed to delete {f}: {e}")
    return jsonify({"status": "deleted"})

# ---------- RUN ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
