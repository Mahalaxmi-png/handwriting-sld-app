export default function Features({ features }) {
  if (!features) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        Extracted Features
      </h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <tbody>
            {Object.entries(features).map(([k, v], idx) => (
              <tr
                key={k}
                className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <td className="px-6 py-3 font-medium text-gray-700 capitalize">
                  {k.replaceAll("_", " ")}
                </td>
                <td className="px-6 py-3 text-right font-mono text-gray-900">
                  {typeof v === "number" ? v.toFixed(3) : String(v)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
