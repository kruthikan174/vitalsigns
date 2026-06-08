import numpy as np
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgboost_model.pkl")

CLASS_MAP = {0: "Normal", 1: "Stress", 2: "Irregular"}

try:
    import joblib
    model = joblib.load(MODEL_PATH)
    MOCK = False
    print("✅ XGBoost model loaded")
except Exception as e:
    print(f"⚠️  Model not found, using mock predictor ({e})")
    model = None
    MOCK = True


def build_features(batch: list[dict]):
    import pandas as pd

    raw_cols = [
        "ECG_HR_mean", "ECG_HR_std", "HRV", "RMSSD",
        "RR_mean", "RR_std", "RR_count", "Radar_HR_mean", "HR_fused"
    ]

    df = pd.DataFrame(batch)

    # make sure all columns exist
    for col in raw_cols:
        if col not in df.columns:
            df[col] = 0.0

    feature_dict = {}
    for col in raw_cols:
        feature_dict[f"{col}_mean"]  = df[col].mean()
        feature_dict[f"{col}_std"]   = df[col].std(ddof=0)   # match training
        feature_dict[f"{col}_min"]   = df[col].min()
        feature_dict[f"{col}_max"]   = df[col].max()
        feature_dict[f"{col}_range"] = df[col].max() - df[col].min()

    X = pd.DataFrame([feature_dict])

    # reindex to exact training column order
    if not MOCK:
        X = X.reindex(columns=model.feature_names_in_, fill_value=0)

    return X


def predict_batch(batch: list[dict]) -> dict:
    if MOCK or model is None:
        avg_hr = np.mean([r.get("HR_fused", 75) for r in batch])
        import random
        if avg_hr > 110:
            label, probs = "Irregular", [0.10, 0.25, 0.65]
        elif avg_hr > 90:
            label, probs = "Stress",    [0.15, 0.70, 0.15]
        else:
            label, probs = "Normal",    [0.75, 0.15, 0.10]
        probs = [max(0, p + random.uniform(-0.05, 0.05)) for p in probs]
        total = sum(probs)
        probs = [p / total for p in probs]
    else:
        X     = build_features(batch)
        pred  = model.predict(X)[0]
        label = CLASS_MAP.get(int(pred), "Normal")
        try:
            probs = model.predict_proba(X)[0].tolist()
        except Exception:
            probs = [1.0 if label == v else 0.0 for v in CLASS_MAP.values()]

    return {
        "label": label,
        "confidence": {
            "Normal":    round(probs[0], 4),
            "Stress":    round(probs[1], 4),
            "Irregular": round(probs[2], 4),
        }
    }