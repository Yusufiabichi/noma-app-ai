

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 

MODEL = tf.keras.models.load_model("NomaApp_v1.h5")

CLASS_NAMES = ['Maize_Blight', 'Maize_Common_Rust', 'Maize_Gray_Leaf_Spot',
                'Maize_Healthy', 'Rice_Bacterial_leaf_blight',
                  'Rice_Brown_spot', 'Rice_Leaf_smut',
                    'bean_angular_leaf_spot', 
                    'bean_healthy', 'bean_rust']

@app.get("/ping")
async def ping():
    return "Hello, I am alive"

def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    # read uploaded file bytes and open as PIL image
    file_bytes = await file.read()
    pil_image = Image.open(BytesIO(file_bytes)).convert("RGB")

    tf.keras.backend.clear_session()

    # preprocess: resize to model input size and normalize to [0,1]
    pil_image = pil_image.resize((224, 224))
    image = np.array(pil_image).astype(np.float32) / 255.0
    img_batch = np.expand_dims(image, 0)
    
    predictions = MODEL.predict(img_batch)

    predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
    confidence = np.max(predictions[0])
    return {
        'class': predicted_class,
        'confidence': float(confidence)
    }

if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)
