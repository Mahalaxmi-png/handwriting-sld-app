// src/components/ShapBarChart.jsx
export default function ShapBarChart({ shap }) {
    if (!shap || Object.keys(shap).length === 0) {
      return (
        <div className="text-sm text-gray-500 p-4 border border-gray-300 rounded bg-gray-50">
          No SHAP data available
        </div>
      );
    }
  
    // Handle different data formats
    const entries = Object.entries(shap)
      .map(([key, value]) => {
        let numValue = 0;
        if (Array.isArray(value)) {
          numValue = value.length > 1 ? value[1] : value[0];
        } else if (typeof value === 'number') {
          numValue = value;
        } else if (typeof value === 'string') {
          numValue = parseFloat(value) || 0;
        }
        return {
          key,
          value: numValue,
        };
      })
      .filter(entry => !isNaN(entry.value))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
    if (entries.length === 0) {
      return (
        <div className="text-sm text-gray-500 p-4 border border-gray-300 rounded bg-gray-50">
          Invalid SHAP data format
        </div>
      );
    }
  
    const maxAbs = Math.max(...entries.map(e => Math.abs(e.value)), 1);
  
    return (
      <div className="space-y-3">
        {entries.map(({ key, value }) => {
          const width = Math.min((Math.abs(value) / maxAbs) * 100, 100);
          const isPositive = value > 0;

          return (
            <div key={key} className="mb-3">
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {isPositive ? "→ Dyslexic" : "→ Non-Dyslexic"}
                  </span>
                  <span
                    className={`font-semibold text-sm ${
                      isPositive ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {value.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-300 ${
                    isPositive ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  