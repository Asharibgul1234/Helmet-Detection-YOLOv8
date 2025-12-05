🪖 Helmet Detection Using YOLOv8

This project implements a Helmet Detection System using YOLOv8, trained to classify whether a person on a bike/motorcycle is With Helmet or Without Helmet.
The dataset consists of annotated images in Pascal VOC format, which are converted to YOLO format and used to train a high-accuracy object detection model.

🚀 Overview

The aim of this project is to detect helmets in real-world images using a deep learning model. The system identifies:

With Helmet

Without Helmet

This model can be used for traffic safety, surveillance, and automatic rule-violation detection.

📦 Features

Detects helmets with bounding boxes

Works for both images and videos

High accuracy YOLOv8 model

Automatically converts XML annotations → YOLO labels

Custom dataset split for train/validation

Easy training and testing scripts

🧠 Model Architecture

Model Type: YOLOv8 (You trained yolov8s.pt)

Backbone: CSPDarknet-based deep CNN

Heads:

Object classification

Bounding box regression

Post-processing: Non-Maximum Suppression (NMS)

📂 Dataset

Total images: 764

Format: Pascal VOC XML annotations

Classes:

With Helmet

Without Helmet

Converted to YOLO format using a custom script.

📝 Technologies Used

Python

YOLOv8 (Ultralytics)

OpenCV

NumPy

Scikit-learn

XML Parser (lxml / ElementTree)

Google Colab

⚙️ Installation

Clone the repository:

git clone https://github.com/yourusername/Helmet-Detection-YOLOv8.git
cd Helmet-Detection-YOLOv8


Install dependencies:

pip install -r requirements.txt

🏋️ Training

To train the YOLOv8 model:

yolo train model=yolov8s.pt data=data.yaml epochs=50 imgsz=640 batch=16


or using Python:

from ultralytics import YOLO

model = YOLO("yolov8s.pt")
model.train(data="data.yaml", epochs=50, imgsz=640, batch=16)

🔍 Inference (Testing Your Model)
from ultralytics import YOLO

model = YOLO("weights/best.pt")
results = model.predict("image.jpg")
results.save("outputs/predictions/")

📊 Model Performance

(Replace with your real results from training output)

Precision: 0.850  
Recall: 0.900  
mAP50: 0.92  
mAP50-95: 0.75  


Model performs well at detecting helmets in real-world images.

🔮 Future Improvements

Deploy as a real-time webcam application

Integrate into CCTV-based monitoring systems

Add more classes (e.g., bike, number plate)

Improve accuracy with larger datasets

Convert to ONNX/TFLite

🤝 Contributing

Pull requests are welcome.
If you find any bugs or want new features, feel free to open an issue.
