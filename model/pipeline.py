from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import pandas as pd

# Load dataset
data = pd.read_csv(r"C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend\dataset_sld.csv")
X = data[["spacing_norm", "irregular_letter_ratio", "baseline_norm", "height_inconsistency_norm", "skew_angle"]]
y = data["label"]

# Pipeline with scaler + model
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight="balanced",
        random_state=42
    ))
])

pipe.fit(X, y)

# Save whole pipeline (not separate scaler + model)
joblib.dump(pipe, "dyslexia_model.pkl")
