import { useState } from "react";
import ShapBarChart from "./ShapBarChart";

export default function UploadAndFeatures() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [features, setFeatures] = useState({});
  const [prediction, setPrediction] = useState("");
  const [probability, setProbability] = useState(null);
  const [shap, setShap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      
      // Reset previous results
      setFeatures({});
      setShap({});
      setPrediction("");
      setProbability(null);
      setError("");
    }
  }

  async function handleAnalyse() {
    if (!file || loading) return;

    setLoading(true);
    setError("");

    try {
      // Convert file to base64 more reliably
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const res = await fetch("http://localhost:5000/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("API RESPONSE:", data);
      console.log("SHAP data:", data.shap);
      console.log("Features data:", data.features);

      // Check if there's an error in the response
      if (data.error) {
        setError(`Error: ${data.error}`);
        setFeatures({});
        setPrediction("");
        setProbability(null);
        setShap({});
      } else {
        setFeatures(data.features || {});
        setPrediction(data.prediction || "Unknown");
        setProbability(data.probability ?? null);
        setShap(data.shap || {});
        setError(""); // Clear any previous errors
      }

    } catch (err) {
      console.error("Error:", err);
      setError(`Server not reachable. Make sure both backend servers are running. Error: ${err.message}`);
      setFeatures({});
      setPrediction("");
      setProbability(null);
      setShap({});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Handwriting Dyslexia Analyzer
          </h1>
          <p className="text-gray-600 text-lg">AI-Powered Analysis for Early Detection</p>
        </div>

        {/* Instructions Section */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Instructions for Handwriting Analysis</h2>
          <div className="space-y-4 text-sm text-slate-800">
            <div>
              <p className="font-semibold text-base mb-2">Before You Begin:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supervision Required:</strong> This test must be conducted under the supervision of a parent, instructor, or qualified professional.</li>
                <li><strong>Time Duration:</strong> The handwriting sample collection takes 5-10 minutes. Analysis is instant after upload.</li>
                <li><strong>Setup:</strong> Ensure good lighting and a clear, flat surface for writing.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-base mb-2">How to Submit a Handwriting Sample:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Option 1 - Take a Photo:</strong> Write a sample on a blank piece of paper, then take a clear photo using your phone or camera. Make sure the handwriting is visible and the image is well-lit.</li>
                <li><strong>Option 2 - Upload Existing File:</strong> If you already have a saved handwriting sample image (JPG, PNG, or other image format), you can upload it directly.</li>
                <li><strong>Image Requirements:</strong> The image should be clear, in focus, and show the handwriting sample completely. Supported formats: JPG, PNG, GIF, WebP.</li>
                <li>Click the <strong>"Choose File"</strong> button below to select your image, then click <strong>"Analyse Handwriting"</strong> to begin the analysis.</li>
              </ol>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-xs text-amber-900"><strong>Note:</strong> The system analyzes handwriting features such as spacing, letter consistency, baseline alignment, and text accuracy to provide insights into potential dyslexia indicators.</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Handwriting Sample
              </label>
              <input 
                type="file" 
                onChange={handleFileChange}
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-indigo-500 file:text-white hover:file:from-purple-600 hover:file:to-indigo-600 file:cursor-pointer file:transition-all"
              />
            </div>

            <button
              onClick={handleAnalyse}
              disabled={loading || !file}
              style={{
                background: loading || !file 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: loading || !file 
                  ? 'none' 
                  : '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              className="px-8 py-3 text-white rounded-xl font-semibold text-lg disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analysing...
                </span>
              ) : (
                "Analyse Handwriting"
              )}
            </button>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Image Preview</h3>
              <div className="relative inline-block rounded-lg overflow-hidden shadow-lg border-4 border-white">
                <img 
                  src={imagePreview} 
                  alt="Handwriting sample preview" 
                  className="max-w-full h-auto max-h-96 object-contain bg-gray-50"
                />
              </div>
            </div>
          )}
        </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* ✅ RESULT */}
      {prediction && (
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                AI Prediction Result
              </div>
              <div className="text-3xl font-bold mb-2">
                Prediction:{" "}
                <span
                  className={
                    prediction === "Dyslexic"
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {prediction}
                </span>
              </div>
              {probability !== null && (
                <div className="text-lg text-gray-700">
                  Confidence: <span className="font-bold text-indigo-600">{probability.toFixed(2)}%</span>
                </div>
              )}
            </div>
            <div className={`text-6xl ${prediction === "Dyslexic" ? "text-red-500" : "text-green-500"}`}>
              {prediction === "Dyslexic" ? "⚠️" : "✅"}
            </div>
          </div>
        </div>
      )}

      {/* ✅ FEATURES + SHAP */}
      {(Object.keys(features).length > 0 ||
        Object.keys(shap).length > 0) && (
        <div className="mt-8 space-y-6">
          {/* SHAP Explanation Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6 shadow-md">
            <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
              <span className="text-2xl">📊</span> Understanding SHAP Values
            </h3>
            <div className="text-sm text-blue-900 space-y-2">
              <p className="font-medium"><strong>SHAP (SHapley Additive exPlanations)</strong> values show how each feature contributes to the prediction.</p>
              <div className="mt-3 space-y-2 bg-white rounded-lg p-3">
                <p className="flex items-start gap-2">
                  <span className="inline-block w-5 h-5 bg-red-500 rounded-full mt-0.5 flex-shrink-0"></span>
                  <span><strong className="text-red-600">Red bars (Positive values):</strong> Push the prediction toward <strong>"Dyslexic"</strong> - these features indicate potential dyslexia indicators.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="inline-block w-5 h-5 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></span>
                  <span><strong className="text-green-600">Green bars (Negative values):</strong> Push the prediction toward <strong>"Non-Dyslexic"</strong> - these features suggest normal handwriting patterns.</span>
                </p>
                <p className="mt-2 pl-7"><strong>Bar length:</strong> Longer bars = stronger influence on the prediction. Values closer to 0 have less impact.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* FEATURES */}
            {Object.keys(features).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                  <span>📈</span> Extracted Features
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(features).map(([k, v]) => (
                    <div
                      key={k}
                      className="border-2 border-gray-200 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 hover:border-indigo-300 transition-all transform hover:scale-105 cursor-default"
                    >
                      <div className="text-xs text-gray-600 capitalize mb-2 font-medium">
                        {k.replace(/_/g, " ")}
                      </div>
                      <div className="font-bold text-gray-900 text-xl">
                        {typeof v === "number"
                          ? v.toFixed(2)
                          : String(v || "N/A")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHAP CHART */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <h2 className="text-2xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                <span>🔍</span> SHAP Explainability
              </h2>

              <ShapBarChart shap={shap} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
