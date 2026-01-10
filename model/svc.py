import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
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
    X, y, test_size=0.2, stratify=y, random_state=42
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
from sklearn.svm import SVC

pipeline_svm = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(
        kernel="rbf",
        probability=True,
        class_weight="balanced",
        random_state=42
    ))
])

param_grid_svm = {
    "svm__C": [0.1, 1, 10],
    "svm__gamma": ["scale", 0.01, 0.1]
}

grid_svm = GridSearchCV(
    pipeline_svm,
    param_grid_svm,
    cv=cv,
    scoring="accuracy",
    n_jobs=-1,
    verbose=1
)

grid_svm.fit(X_train, y_train)

print("✅ Best SVM Params:", grid_svm.best_params_)
best_svm = grid_svm.best_estimator_

# Cross-validation
scores_svm = cross_val_score(best_svm, X, y, cv=cv, scoring="accuracy")
print("Mean CV Accuracy (SVM):", scores_svm.mean())

# Test evaluation
y_pred_svm = best_svm.predict(X_test)
print("SVM Classification Report:")
print(classification_report(y_test, y_pred_svm, target_names=["non_dyslexic", "dyslexic"]))
