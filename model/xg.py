import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay, roc_curve, auc
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier, plot_importance
import joblib
import numpy as np
from xgboost import XGBClassifier
# Load dataset
data = pd.read_csv(r"C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend\dataset_sld.csv")

# Encode labels
data["label"] = data["label"].map({"non_dyslexic": 0, "dyslexic": 1})

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

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --------------------
# 3. Handle class imbalance
# --------------------
neg, pos = np.bincount(y_train)  # count classes
scale_pos_weight = neg / pos
print(f"scale_pos_weight = {scale_pos_weight:.2f}")

# --------------------
# 4. Train model
# --------------------
model = XGBClassifier(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric="logloss",
    use_label_encoder=False,
    scale_pos_weight=scale_pos_weight  # ✅ imbalance handling
)

model.fit(X_train_scaled, y_train)

# --------------------
# 5. Evaluation
# --------------------
y_pred = model.predict(X_test_scaled)

print("\n=== Test Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["Non-Dyslexic", "Dyslexic"]))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Non-Dyslexic", "Dyslexic"])
disp.plot(cmap="Blues", values_format="d")
plt.title("Confusion Matrix")
plt.show()

# ROC Curve
fpr, tpr, thresholds = roc_curve(y_test, model.predict_proba(X_test_scaled)[:, 1])
roc_auc = auc(fpr, tpr)

plt.figure()
plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.2f}", color="blue")
plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve")
plt.legend()
plt.show()

# Feature Importance
plot_importance(model, importance_type="gain")
plt.title("XGBoost Feature Importance (by gain)")
plt.show()

# --------------------
# 6. Save model + scaler
# --------------------
joblib.dump({"model": model, "scaler": scaler}, "dyslexia_model.pkl")
print("✅ Model + Scaler saved as dyslexia_model.pkl")
