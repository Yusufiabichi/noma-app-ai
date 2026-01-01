def postprocess_result(label: str, confidence: float):
    disease_mapping = {
        "Maize_Blight": {
            "name": "Maize Leaf Blight",
            "recommendation": "Apply recommended fungicide early and remove infected leaves"
        },
        "Maize_Common_Rust": {
            "name": "Maize Common Rust",
            "recommendation": "Apply fungicide and ensure good crop sanitation"
        },
        "Maize_Gray_Leaf_Spot": {
            "name": "Maize Gray Leaf Spot",
            "recommendation": "Rotate crops and apply fungicide if necessary"
        },
        "Maize_Healthy": {
            "name": "Maize Healthy",
            "recommendation": "No disease detected. Continue regular crop management"
        },
        "Rice_Bacterial_leaf_blight": {
            "name": "Rice Bacterial Leaf Blight",
            "recommendation": "Use disease-resistant varieties and apply copper-based bactericide"
        },
        "Rice_Brown_spot": {
            "name": "Rice Brown Spot",
            "recommendation": "Improve field drainage and apply fungicide"
        },
        "Rice_Leaf_smut": {
            "name": "Rice Leaf Smut",
            "recommendation": "Use certified seeds and apply fungicide at early stages"
        },
        "bean_angular_leaf_spot": {
            "name": "Bean Angular Leaf Spot",
            "recommendation": "Remove affected leaves and apply copper fungicide"
        },
        "bean_healthy": {
            "name": "Bean Healthy",
            "recommendation": "No disease detected. Continue regular crop management"
        },
        "bean_rust": {
            "name": "Bean Rust",
            "recommendation": "Apply sulfur-based fungicide and improve air circulation"
        },
        "unknown": {
            "name": "Unknown Condition",
            "recommendation": "Image quality may be insufficient. Retake image and try again"
        }
    }

    if confidence >= 0.75:
        severity = "high"
    elif confidence >= 0.5:
        severity = "medium"
    else:
        severity = "low"

    disease_info = disease_mapping.get(label, disease_mapping["unknown"])

    return {
        "disease": disease_info["name"],
        "severity": severity,
        "recommendation": disease_info["recommendation"]
    }
