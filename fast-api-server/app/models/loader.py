import logging
import os
from app.models.registry import MODEL_REGISTRY

LOADED_MODELS = {}


def _load_tf_model(path: str):
    import tensorflow as tf
    return tf.keras.models.load_model(path)


def _load_torch_model(path: str):
    import torch
    model = torch.load(path, map_location=torch.device('cpu'))
    try:
        model.eval()
    except Exception:
        pass
    return model


def load_models():
    base_dir = os.path.dirname(__file__)
    for crop, config in MODEL_REGISTRY.items():
        model_path = config.get("path")
        logging.info(f"Loading model for crop {crop} from {model_path}")

        abs_path = os.path.join(base_dir, model_path) if not os.path.isabs(model_path) else model_path

        model = None
        if not os.path.exists(abs_path):
            logging.warning(f"Model file not found for {crop}: {abs_path}")
        else:
            lower = model_path.lower()
            try:
                if lower.endswith(('.h5', '.keras')):
                    model = _load_tf_model(abs_path)
                elif lower.endswith('.pt') or lower.endswith('.pth'):
                    try:
                        model = _load_torch_model(abs_path)
                    except Exception:
                        logging.exception("Failed to load PyTorch model for %s", crop)
                        model = None
                else:
                    logging.warning(f"Unknown model format for {crop}: {model_path}")
            except Exception:
                logging.exception("Failed to load model for %s", crop)
                model = None

        LOADED_MODELS[crop] = {
            "model": model,
            "version": config.get("version"),
            "path": abs_path
        }

    logging.info("Model loading complete")


def get_model(crop_type: str):
    model_entry = LOADED_MODELS.get(crop_type)
    if not model_entry:
        raise ValueError(f"No model registered for crop type {crop_type}")
    if model_entry.get("model") is None:
        raise ValueError(f"Model for crop type {crop_type} is not loaded")
    return model_entry
