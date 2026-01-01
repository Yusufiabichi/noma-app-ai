import logging
from app.models.registry import MODEL_REGISTRY

LOADED_MODELS = {}

def load_models():
    for crop, config in MODEL_REGISTRY.items():
        model_path = config["path"]
        logging.info(f"Loading model for crop {crop} from {model_path}")

        # Replace this mocked object with a real model loader later
        model = f"mock_model_object_for_{crop}"
        LOADED_MODELS[crop] = {
            "model": model,
            "version": config["version"]
        }

    logging.info("All models loaded into memory")

def get_model(crop_type: str):
    model_entry = LOADED_MODELS.get(crop_type)
    if not model_entry:
        raise ValueError(f"No model registered for crop type {crop_type}")
    return model_entry
