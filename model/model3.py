import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    roc_curve,
    auc
)
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    GridSearchCV,
    cross_val_score
)
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib

# --------------------
# 1. Load dataset
# --------------------
data = pd.read_csv(
    r"C:\Users\kokki\OneDrive\Documents\major_project\handwriting-sld-app\backend\dataset.csv"
)

# Convert labels to numeric
data["label"] = data["label"].map({"non_dyslexic": 0, "dyslexic": 1})

# Select features
features = ["spacing_norm", "irregular_letter_ratio", "baseline_norm",
            "height_inconsistency_norm", "skew_angle"]
X = data[features]
y = data["label"]

# --------------------
# 2. Train/Test split
# --------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --------------------
# 3. Define pipeline with scaler + RF
# --------------------
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("rf", RandomForestClassifier(class_weight="balanced", random_state=42))
])

param_grid = {
    "rf__n_estimators": [200, 300, 500],
    "rf__max_depth": [4, 6, 8, None],
    "rf__max_features": ["sqrt", "log2"],
    "rf__min_samples_split": [2, 5, 10],
    "rf__min_samples_leaf": [1, 2, 4],
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

grid_search = GridSearchCV(
    pipeline, param_grid, cv=cv, scoring="accuracy", n_jobs=-1, verbose=1
)

grid_search.fit(X_train, y_train)

print("✅ Best Params:", grid_search.best_params_)
best_pipeline = grid_search.best_estimator_

# --------------------
# 4. Cross-validation with best model
# --------------------
scores = cross_val_score(best_pipeline, X, y, cv=cv, scoring="accuracy")
print("Cross-validation scores:", scores)
print("Mean CV Accuracy:", scores.mean())

# --------------------
# 5. Test Evaluation
# --------------------
y_pred = best_pipeline.predict(X_test)

print("\n=== Test Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["non_dyslexic", "dyslexic"]))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["non_dyslexic", "dyslexic"])
disp.plot(cmap="Greens", values_format="d")
plt.title("Confusion Matrix - Random Forest (Tuned)")
plt.show()

# ROC Curve
fpr, tpr, thresholds = roc_curve(y_test, best_pipeline.predict_proba(X_test)[:, 1])
roc_auc = auc(fpr, tpr)

plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.2f}", color="green")
plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve - Random Forest (Tuned)")
plt.legend()
plt.show()

# --------------------
# 6. Save best pipeline (scaler + RF together)
# --------------------
joblib.dump(best_pipeline, "dyslexia_pipeline.pkl")
print("✅ Best Pipeline saved as dyslexia_pipeline.pkl")
