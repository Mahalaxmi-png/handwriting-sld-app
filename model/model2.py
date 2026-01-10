import pandas as pd
import matplotlib.pyplot as plt  # type: ignore
import seaborn as sns  # type: ignore
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    roc_curve,
    auc
)
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
import joblib

# --------------------
# 1. Load dataset
# --------------------
data = pd.read_csv(r"C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend\dataset_sld.csv")

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

# Scale features (important for SVM!)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --------------------
# 3. Train SVM model
# --------------------
model = SVC(
    kernel="rbf",            # radial basis kernel (good for non-linear data)
    probability=True,        # so we can plot ROC
    class_weight="balanced", # handle imbalance
    random_state=42
)

model.fit(X_train_scaled, y_train)

# --------------------
# 4. Cross-validation
# --------------------
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
print("Cross-validation scores:", scores)
print("Mean CV Accuracy:", scores.mean())

# --------------------
# 5. Test Evaluation
# --------------------
y_pred = model.predict(X_test_scaled)

print("\n=== Test Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["non_dyslexic", "dyslexic"]))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["non_dyslexic", "dyslexic"])
disp.plot(cmap="Blues", values_format="d")
plt.title("Confusion Matrix - SVM")
plt.show()

# ROC Curve
fpr, tpr, thresholds = roc_curve(y_test, model.decision_function(X_test_scaled))
roc_auc = auc(fpr, tpr)

plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.2f}", color="blue")
plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve - SVM")
plt.legend()
plt.show()

# --------------------
# 6. Save model
# --------------------
joblib.dump({"model": model, "scaler": scaler}, "dyslexia_model2.pkl")
print("✅ SVM Model + Scaler saved as dyslexia_model2.pkl")
