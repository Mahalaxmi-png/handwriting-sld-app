import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)

# --------------------------------------------------
# 1. Load Dataset
# --------------------------------------------------
data = pd.read_csv(
    r"C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend\dataset_sld.csv"
)

# Encode labels
data["label"] = data["label"].map({
    "non_dyslexic": 0,
    "dyslexic": 1
})

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

X = data[features].fillna(0)
y = data["label"]

# --------------------------------------------------
# 2. Train-Test Split
# --------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

# --------------------------------------------------
# 3. Random Forest Pipeline + GridSearch
# --------------------------------------------------
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("rf", RandomForestClassifier(
        class_weight="balanced",
        random_state=42
    ))
])

param_grid = {
    "rf__n_estimators": [200],
    "rf__max_depth": [4],
    "rf__max_features": ["sqrt"],
    "rf__min_samples_split": [2],
    "rf__min_samples_leaf": [1],
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv=cv,
    scoring="accuracy",
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_

# --------------------------------------------------
# 4. Evaluation
# --------------------------------------------------
y_pred = best_model.predict(X_test)

print("\n=== Classification Report ===")
print(classification_report(
    y_test,
    y_pred,
    target_names=["Non-Dyslexic", "Dyslexic"]
))

# --------------------------------------------------
# 5. Confusion Matrix (Figure 2)
# --------------------------------------------------
cm = confusion_matrix(y_test, y_pred)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Non-Dyslexic", "Dyslexic"]
)

plt.figure(figsize=(6, 5))
disp.plot(cmap="Blues", values_format="d")
plt.title("Confusion Matrix - Random Forest")
plt.tight_layout()
plt.show()

# --------------------------------------------------
# 6. Performance Metrics by Class (Figure 1)
# --------------------------------------------------
report = classification_report(
    y_test,
    y_pred,
    target_names=["Non-Dyslexic", "Dyslexic"],
    output_dict=True
)

classes = ["Non-Dyslexic", "Dyslexic"]

precision = [
    report["Non-Dyslexic"]["precision"],
    report["Dyslexic"]["precision"]
]

recall = [
    report["Non-Dyslexic"]["recall"],
    report["Dyslexic"]["recall"]
]

f1_score = [
    report["Non-Dyslexic"]["f1-score"],
    report["Dyslexic"]["f1-score"]
]

x = np.arange(len(classes))
width = 0.25

plt.figure(figsize=(8, 5))
plt.bar(x - width, precision, width, label="Precision")
plt.bar(x, recall, width, label="Recall")
plt.bar(x + width, f1_score, width, label="F1-Score")

plt.xticks(x, classes)
plt.ylim(0, 1.05)
plt.ylabel("Score")
plt.xlabel("Class")
plt.title("Performance Metrics by Class - Random Forest")
plt.legend()
plt.grid(axis="y", linestyle="--", alpha=0.6)
plt.tight_layout()
plt.show()

# --------------------------------------------------
# 7. Save Model
# --------------------------------------------------
joblib.dump(best_model, "dyslexia_pipeline.pkl")
print("✅ Best Pipeline saved as dyslexia_pipeline.pkl")
