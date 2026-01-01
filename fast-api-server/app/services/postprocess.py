def postprocess_result(label: str, confidence: float):
    disease_mapping = {
        "maize_leaf_blight": {
            "name": "Maize Leaf Blight",
            "recommendation": "Apply recommended fungicide early and remove infected leaves"
        },
        "needs_expert_review": {
            "name": "Needs Expert Review",
            "recommendation": "Consult an agricultural extension officer for further diagnosis"
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
