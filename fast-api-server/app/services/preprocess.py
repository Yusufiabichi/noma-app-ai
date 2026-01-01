import requests
from PIL import Image
import numpy as np
from io import BytesIO

def preprocess_image(image_url: str, target_size=(224, 224)):
    try:
        response = requests.get(image_url, timeout=5)
        response.raise_for_status()
    except Exception:
        raise ValueError("Unable to fetch image from provided URL")

    try:
        image = Image.open(BytesIO(response.content)).convert("RGB")
    except Exception:
        raise ValueError("Invalid image format")

    image = image.resize(target_size)

    image_array = np.array(image).astype("float32")
    image_array = image_array / 255.0

    image_array = np.expand_dims(image_array, axis=0)

    return image_array
