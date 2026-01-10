import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score
)
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
    r"C:\Users\kokki\OneDrive\Documents\major_project\handwriting-sld-app\backend\dataset_sld.csv"
)

# Encode labels
data["label"] = data["label"].map({
    "non_dyslexic": 0,
    "dyslexic": 1
})

y = data["label"]

# --------------------------------------------------
# 2. Feature Groups (EXACT NAMES)
# --------------------------------------------------

handwriting_features = [
    "spacing_norm",
    "irregular_letter_ratio",
    "baseline_norm",
    "height_inconsistency_norm",
    "skew_angle"
]

linguistic_features = [
    "spelling_accuracy",
    "gramatical_accuracy",
    "percentage_of_corrections",
    "phonetic_accuracy"
]

combined_features = handwriting_features + linguistic_features

# --------------------------------------------------
# 3. Helper: Train + Evaluate Model
# --------------------------------------------------
def train_and_evaluate(X, y, title):
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(
            n_estimators=200,
            max_depth=4,
            max_features="sqrt",
            min_samples_split=2,
            min_samples_leaf=1,
            class_weight="balanced",
            random_state=42
        ))
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    print(f"\n==============================")
    print(f" {title}")
    print(f"==============================")
    print(classification_report(
        y_test,
        y_pred,
        target_names=["Non-Dyslexic", "Dyslexic"]
    ))

    # Cross-validated F1
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    f1_scores = cross_val_score(
        pipeline,
        X,
        y,
        cv=cv,
        scoring="f1"
    )

    return {
        "Accuracy": np.mean(y_pred == y_test),
        "F1 (CV)": f1_scores.mean()
    }

# --------------------------------------------------
# 4. Run Experiments
# --------------------------------------------------
results = {}

# 1️⃣ Linguistic-only model
X_ling = data[linguistic_features].fillna(0)
results["Linguistic Only"] = train_and_evaluate(
    X_ling, y, "MODEL 1: LINGUISTIC FEATURES ONLY"
)

# 2️⃣ Combined model
X_comb = data[combined_features].fillna(0)
results["Handwriting + Linguistic"] = train_and_evaluate(
    X_comb, y, "MODEL 2: HANDWRITING + LINGUISTIC FEATURES"
)

# --------------------------------------------------
# 5. Comparison Table (IEEE Ready)
# --------------------------------------------------
results_df = pd.DataFrame(results).T
print("\n==============================")
print(" FEATURE COMPARISON SUMMARY ")
print("==============================")
print(results_df)

# --------------------------------------------------
# 6. Plot Comparison (Figure for Paper)
# --------------------------------------------------
results_df.plot(
    kind="bar",
    figsize=(7, 5),
    ylim=(0, 1),
    title="Performance Comparison: Linguistic vs Combined Features"
)

plt.ylabel("Score")
plt.xticks(rotation=0)
plt.grid(axis="y", linestyle="--", alpha=0.6)
plt.tight_layout()
plt.show()

# --------------------------------------------------
# 7. Train Final Combined Model & Save
# --------------------------------------------------
final_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("rf", RandomForestClassifier(
        n_estimators=200,
        max_depth=4,
        max_features="sqrt",
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=42
    ))
])

final_pipeline.fit(X_comb, y)
joblib.dump(final_pipeline, "dyslexia_pipeline.pkl")

print("\n✅ Final combined model saved as dyslexia_pipeline.pkl")
