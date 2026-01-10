# model.py (only the key parts shown)
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay, roc_curve, auc
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib

# Load dataset (path as you had it)
data = pd.read_csv(r"C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend\dataset_sld.csv")

# Convert labels to numeric
data["label"] = data["label"].map({"non_dyslexic": 0, "dyslexic": 1})

# Ensure dataset includes these columns. If your CSV uses slightly different names, adapt them.
features = [
    "spacing_norm",
    "irregular_letter_ratio",
    "baseline_norm",
    "height_inconsistency_norm",
    "skew_angle",
    "spelling_accuracy",
    "gramatical_accuracy",
    "percentage_of_corrections",
    "phonetic_accuracy"
]

# Check missing values and handle them (simple fill here)
X = data[features].fillna(0)
y = data["label"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("rf", RandomForestClassifier(class_weight="balanced", random_state=42))
])

param_grid = {
    "rf__n_estimators": [200, 300],
    "rf__max_depth": [4, 6, None],
    "rf__max_features": ["sqrt", "log2"],
    "rf__min_samples_split": [2, 5],
    "rf__min_samples_leaf": [1, 2],
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

grid_search = GridSearchCV(pipeline, param_grid, cv=cv, scoring="accuracy", n_jobs=-1, verbose=1)
grid_search.fit(X_train, y_train)

print("✅ Best Params:", grid_search.best_params_)
best_pipeline = grid_search.best_estimator_

# cross val and test eval as before...
scores = cross_val_score(best_pipeline, X, y, cv=cv, scoring="accuracy")
print("Mean CV Accuracy:", scores.mean())

y_pred = best_pipeline.predict(X_test)
print(classification_report(y_test, y_pred, target_names=["non_dyslexic", "dyslexic"]))

# Save best pipeline (scaler + RF together)
joblib.dump(best_pipeline, "dyslexia_pipeline.pkl")
print("✅ Best Pipeline saved as dyslexia_pipeline.pkl")
