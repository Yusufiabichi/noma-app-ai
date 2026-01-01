from fastapi import UploadFile
from PIL import Image
import numpy as np
from io import BytesIO

async def preprocess_image(image_file: UploadFile, target_size=(224, 224)):
    try:
        file_bytes = await image_file.read()
    except Exception:
        raise ValueError("Unable to read uploaded file")

    try:
        image = Image.open(BytesIO(file_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Invalid image format")

    image = image.resize(target_size)

    image_array = np.array(image).astype("float32")
    image_array = image_array / 255.0

    image_array = np.expand_dims(image_array, axis=0)

    return image_array
