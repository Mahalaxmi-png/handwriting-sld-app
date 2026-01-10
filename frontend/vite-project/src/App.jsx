import { useState } from "react";
import UploadAndFeatures from "./components/UploadAndFeatures";
import ReadingModule from "./components/ReadingModule";

export default function App() {
  const [activeTab, setActiveTab] = useState("writing");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Dyslexia Screening Workspace
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl">
            Switch between the <span className="font-semibold">Writing</span> module (handwriting analysis)
            and the <span className="font-semibold">Reading</span> module (pronunciation and dictation tests).
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("writing")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "writing"
                ? "bg-white text-slate-900 shadow-sm border border-slate-300"
                : "bg-transparent text-slate-700 hover:bg-slate-100"
            }`}
          >
            Writing module
          </button>
          <button
            onClick={() => setActiveTab("reading")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "reading"
                ? "bg-white text-slate-900 shadow-sm border border-slate-300"
                : "bg-transparent text-slate-700 hover:bg-slate-100"
            }`}
          >
            Reading module
          </button>
        </div>

        {activeTab === "writing" ? <UploadAndFeatures /> : <ReadingModule />}
      </div>
    </div>
  );
}
