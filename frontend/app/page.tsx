"use client";

import { useState } from "react";

type TestPoint = {
  load: string;
  indicated: string;
};

type ResultItem = {
  load: number;
  indicated: number;
  error: number;
  allowed_mpe: number;
  status: string;
};

type Result = {
  overall_status: string;
  details: ResultItem[];
};

export default function Home() {
  const [accuracyClass, setAccuracyClass] = useState("CLASS III");
  const [scaleE, setScaleE] = useState("0.05");

  const [testPoints, setTestPoints] = useState<TestPoint[]>([
    { load: "", indicated: "" },
  ]);

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const addTestPoint = () => {
    setTestPoints([
      ...testPoints,
      { load: "", indicated: "" },
    ]);
  };

  const removeTestPoint = (index: number) => {
    if (testPoints.length === 1) return;

    setTestPoints(testPoints.filter((_, i) => i !== index));
  };

  const updateTestPoint = (
    index: number,
    field: "load" | "indicated",
    value: string
  ) => {
    const updated = [...testPoints];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setTestPoints(updated);
  };

  const evaluateTest = async () => {
    const validPoints = testPoints.filter(
      (point) => point.load !== "" && point.indicated !== ""
    );

    if (validPoints.length === 0) {
      alert("Please enter at least one test point.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/evaluate/weighing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scale_e: Number(scaleE),
            accuracy_class: accuracyClass,
            test_points: validPoints.map((point) => ({
              load: Number(point.load),
              indicated: Number(point.indicated),
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Backend returned an error");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            OIML-MetricFlow
          </h1>

          <p className="mt-2 text-lg text-gray-600">
            OIML R-76 Weighing Instrument Test System
          </p>
        </div>

        {/* CONFIGURATION */}
        <section className="rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-gray-900">
            Test Configuration
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Accuracy Class
              </label>

              <select
                value={accuracyClass}
                onChange={(e) =>
                  setAccuracyClass(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-black"
              >
                <option>CLASS I</option>
                <option>CLASS II</option>
                <option>CLASS III</option>
                <option>CLASS IIII</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Scale Interval (e)
              </label>

              <input
                type="number"
                value={scaleE}
                onChange={(e) => setScaleE(e.target.value)}
                step="0.001"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-black"
              />
            </div>

          </div>

          {/* TEST POINTS */}
          <div className="mt-10">

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Test Points
              </h2>

              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                {testPoints.length} point
                {testPoints.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-6 space-y-4">

              {testPoints.map((point, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <h3 className="font-bold text-gray-900">
                      Test Point {index + 1}
                    </h3>

                    {testPoints.length > 1 && (
                      <button
                        onClick={() => removeTestPoint(index)}
                        className="text-sm font-semibold text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Load
                      </label>

                      <input
                        type="number"
                        value={point.load}
                        onChange={(e) =>
                          updateTestPoint(
                            index,
                            "load",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 100"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Indicated Value
                      </label>

                      <input
                        type="number"
                        value={point.indicated}
                        onChange={(e) =>
                          updateTestPoint(
                            index,
                            "indicated",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 100.040"
                        step="0.001"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
                      />
                    </div>

                  </div>
                </div>
              ))}

            </div>

            {/* ADD POINT */}
            <button
              onClick={addTestPoint}
              className="mt-5 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              + Add Test Point
            </button>

          </div>

          {/* EVALUATE */}
          <button
            onClick={evaluateTest}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-black px-6 py-4 text-lg font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Evaluating..." : "Evaluate Test"}
          </button>

        </section>

        {/* RESULT */}
        {result && (
          <section className="mt-8 rounded-2xl bg-white p-8 shadow-sm">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <h2 className="text-2xl font-bold text-gray-900">
                Test Result
              </h2>

              <div
                className={`rounded-full px-5 py-2 text-lg font-bold ${
                  result.overall_status === "PASS"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {result.overall_status}
              </div>

            </div>

            {/* RESULT TABLE */}
            <div className="mt-6 overflow-x-auto">

              <table className="w-full border-collapse">

                <thead>
                  <tr className="bg-gray-100 text-left">

                    <th className="border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                      #
                    </th>

                    <th className="border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                      Load
                    </th>

                    <th className="border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                      Indicated
                    </th>

                    <th className="border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                      Error
                    </th>

                    <th className="border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                      Allowed MPE
                    </th>

                    <th className="border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {result.details.map((item, index) => (

                    <tr key={index}>

                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {index + 1}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                        {item.load}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {item.indicated}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {item.error}
                      </td>

                      <td className="border border-gray-200 px-4 py-3 text-gray-800">
                        {item.allowed_mpe}
                      </td>

                      <td
                        className={`border border-gray-200 px-4 py-3 font-bold ${
                          item.status === "PASS"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.status}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

      </div>
    </main>
  );
}