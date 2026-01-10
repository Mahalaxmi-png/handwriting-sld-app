from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import shap
import warnings
import re

from sklearn.pipeline import Pipeline
from textblob import TextBlob
import language_tool_python
import jellyfish

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

# ---------------- LOAD MODEL ----------------
model: Pipeline = joblib.load("dyslexia_pipeline.pkl")
assert isinstance(model, Pipeline)

scaler = model.named_steps["scaler"]
classifier = model.named_steps["rf"]

# SHAP explainer (tree-based)
explainer = shap.TreeExplainer(classifier)

# LanguageTool (loaded ONCE) with graceful fallback if the local JAR download fails
try:
    tool = language_tool_python.LanguageTool("en-US")
except Exception as e:
    print(f"[WARN] LanguageTool local init failed ({e}); falling back to public API.")
    try:
        tool = language_tool_python.LanguageToolPublicAPI("en-US")
    except Exception:
        print("[WARN] LanguageTool public API unavailable; using no-op grammar checker.")

        class _DummyTool:
            def correct(self, text):  # passthrough
                return text

            def check(self, text):  # no detected issues
                return []

        tool = _DummyTool()

# 🔑 EXACT FEATURE ORDER (MUST MATCH TRAINING)
FEATURE_ORDER = [
    "spacing_norm",
    "irregular_letter_ratio",
    "baseline_norm",
    "height_inconsistency_norm",
    "skew_angle",
    "spelling_accuracy",
    "gramatical_accuracy",
    "percentage_of_corrections",
    "phonetic_accuracy",
]

# ---------------- SAFETY CONVERSION ----------------
def to_float(v):
    try:
        if v is None:
            return 0.0
        if isinstance(v, (list, tuple)):
            return float(v[0]) if len(v) else 0.0
        if hasattr(v, "item"):  # numpy scalar
            return float(v.item())
        return float(v)
    except Exception:
        return 0.0

# ---------------- TEXT HELPERS ----------------
def normalize_text(s):
    return re.sub(r"\s+", " ", s or "").strip()

def levenshtein(a, b):
    if not a or not b:
        return abs(len(a) - len(b))
    dp = list(range(len(b) + 1))
    for i, c1 in enumerate(a):
        prev = dp[:]
        dp[0] = i + 1
        for j, c2 in enumerate(b):
            dp[j + 1] = min(
                prev[j + 1] + 1,
                dp[j] + 1,
                prev[j] + (c1 != c2),
            )
    return dp[-1]

def calculate_spelling_accuracy(text):
    t = normalize_text(text)
    if not t:
        return 0.0
    corr = str(TextBlob(t).correct())
    return max(0.0, 100 * (1 - levenshtein(t, corr) / (len(t) + 1)))

def calculate_grammar_accuracy(text):
    t = normalize_text(text)
    if not t:
        return 0.0
    corr = tool.correct(t)
    diff = abs(len(t.split()) - len(corr.split()))
    return max(0.0, 100 * (1 - diff / (len(t.split()) + 1)))

def calculate_percentage_corrections(text):
    t = normalize_text(text)
    if not t:
        return 0.0
    return (len(tool.check(t)) / max(1, len(t.split()))) * 100

def calculate_phonetic_accuracy(text):
    t = normalize_text(text)
    if not t:
        return 0.0
    corr = str(TextBlob(t).correct())
    s1 = " ".join(jellyfish.soundex(w) for w in t.split())
    s2 = " ".join(jellyfish.soundex(w) for w in corr.split())
    return max(0.0, 100 * (1 - levenshtein(s1, s2) / (len(s1) + 1)))

# ---------------- API ----------------
@app.route("/extract", methods=["POST"])
def extract():
    try:
        data = request.json or {}

        handwriting = data.get("features", {})
        text = data.get("extracted_text", "")

        # ✅ COMPUTE TEXT FEATURES
        text_features = {
            "spelling_accuracy": calculate_spelling_accuracy(text),
            "gramatical_accuracy": calculate_grammar_accuracy(text),
            "percentage_of_corrections": calculate_percentage_corrections(text),
            "phonetic_accuracy": calculate_phonetic_accuracy(text),
        }

        # ✅ MERGE FEATURES
        all_features = {**handwriting, **text_features}

        # ✅ ORDER + SANITIZE
        X = np.array([[
            to_float(all_features.get(f, 0.0))
            for f in FEATURE_ORDER
        ]], dtype=float)

        # ✅ PREDICTION
        proba = model.predict_proba(X)[0]
        pred = int(np.argmax(proba))
        confidence = float(proba[pred]) * 100

        # ✅ SHAP (Dyslexic class = 1)
        # ✅ SCALE INPUT BEFORE SHAP
        X_scaled = scaler.transform(X)

        shap_values = explainer.shap_values(X_scaled)

        # Binary classifier → take Dyslexic class (1)
        if isinstance(shap_values, list):
            shap_values = shap_values[1][0]
        else:
            shap_values = shap_values[0]

        shap_dict = {
            FEATURE_ORDER[i]: float(shap_values[i])
            for i in range(len(FEATURE_ORDER))
        }

        return jsonify({
            "features": {
                f: to_float(all_features.get(f, 0.0))
                for f in FEATURE_ORDER
            },
            "prediction": "Dyslexic" if pred == 1 else "Non-Dyslexic",
            "probability": round(confidence, 2),
            "shap": shap_dict,
            "error": None
        })

    except Exception as e:
        return jsonify({
            "features": {},
            "prediction": None,
            "shap": {},
            "error": str(e)
        }), 200

if __name__ == "__main__":
    app.run(port=6000, debug=False)
