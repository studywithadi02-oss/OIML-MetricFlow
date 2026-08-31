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

type EccentricityResultDetail = {
  position: number;
  indicated: number;
  error: number;
  status: string;
};

type EccentricityResult = {
  test_load: number;
  max_difference: number;
  allowed_tolerance: number;
  status: string;
  details: EccentricityResultDetail[];
};

export default function Home() {
  const [step, setStep] = useState(1);

  // Step 1
  const [instrumentName, setInstrumentName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  // Step 2
  const [accuracyClass, setAccuracyClass] = useState("CLASS III");
  const [capacity, setCapacity] = useState("150");
  const [scaleE, setScaleE] = useState("0.05");

  // Step 3
  const [testPoints, setTestPoints] = useState<TestPoint[]>([
    { load: "", indicated: "" },
  ]);

  const [result, setResult] = useState<{
    overall_status: string;
    details: ResultItem[];
  } | null>(null);

  // Step 4
  const [eccentricityLoad, setEccentricityLoad] = useState("");
  const [eccentricityReadings, setEccentricityReadings] = useState<
    string[]
  >(["", "", "", ""]);

  const [eccentricityResult, setEccentricityResult] =
    useState<EccentricityResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [eccentricityLoading, setEccentricityLoading] = useState(false);

  const nextStep = () => {
    if (step < 7) {
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Step 2 calculations
  const divisions =
    Number(capacity) > 0 && Number(scaleE) > 0
      ? Number(capacity) / Number(scaleE)
      : 0;

  const getMpeMultiplier = () => {
    if (divisions <= 0) return 0;

    if (accuracyClass === "CLASS I") {
      if (divisions <= 50000) return 0.5;
      if (divisions <= 200000) return 1.0;
      return 1.5;
    }

    if (accuracyClass === "CLASS II") {
      if (divisions <= 5000) return 0.5;
      if (divisions <= 20000) return 1.0;
      return 1.5;
    }

    if (accuracyClass === "CLASS III") {
      if (divisions <= 500) return 0.5;
      if (divisions <= 2000) return 1.0;
      return 1.5;
    }

    if (divisions <= 50) return 0.5;
    if (divisions <= 200) return 1.0;

    return 1.5;
  };

  const mpeMultiplier = getMpeMultiplier();
  const allowedMpe = Number(scaleE) * mpeMultiplier;

  // Step 3 functions
  const addTestPoint = () => {
    setTestPoints([
      ...testPoints,
      {
        load: "",
        indicated: "",
      },
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

  const evaluateWeighingTest = async () => {
    const validPoints = testPoints.filter(
      (point) => point.load !== "" && point.indicated !== ""
    );

    if (validPoints.length === 0) {
      alert("Please enter at least one test point.");
      return;
    }

    setLoading(true);
    setResult(null);

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
        throw new Error("Backend evaluation failed");
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

  // Step 4 functions
  const updateEccentricityReading = (
    index: number,
    value: string
  ) => {
    const updated = [...eccentricityReadings];
    updated[index] = value;
    setEccentricityReadings(updated);
  };

  const evaluateEccentricity = async () => {
    if (eccentricityLoad === "") {
      alert("Please enter the test load.");
      return;
    }

    const validReadings = eccentricityReadings.filter(
      (reading) => reading !== ""
    );

    if (validReadings.length < 2) {
      alert("Please enter at least 2 position readings.");
      return;
    }

    if (Number(scaleE) <= 0) {
      alert("Scale interval (e) must be greater than zero.");
      return;
    }

    setEccentricityLoading(true);
    setEccentricityResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/evaluate/eccentricity",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            test_load: Number(eccentricityLoad),
            scale_e: Number(scaleE),
            readings: validReadings.map((reading) => Number(reading)),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Eccentricity evaluation failed");
      }

      const data = await response.json();

      setEccentricityResult(data);
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend.");
    } finally {
      setEccentricityLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            OIML-MetricFlow
          </h1>

          <p className="mt-2 text-slate-600">
            OIML R-76 Weighing Instrument Test System
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between text-sm">

            <div className="font-semibold text-blue-600">
              Step {step} of 7
            </div>

            <div className="text-slate-500">
              {step === 1 && "Instrument Information"}
              {step === 2 && "Accuracy & Capacity"}
              {step === 3 && "Weighing Test"}
              {step === 4 && "Eccentricity Test"}
              {step === 5 && "Repeatability Test"}
              {step === 6 && "Tare / Zero Test"}
              {step === 7 && "Final Review"}
            </div>

          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-slate-200">

            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{
                width: `${(step / 7) * 100}%`,
              }}
            />

          </div>

        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Instrument Information
              </h2>

              <p className="mt-2 text-slate-600">
                Enter the basic details of the weighing instrument.
              </p>

            </div>

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="font-medium text-slate-800">
                  Instrument Name
                </label>

                <input
                  type="text"
                  value={instrumentName}
                  onChange={(e) => setInstrumentName(e.target.value)}
                  placeholder="e.g. Platform Weighing Scale"
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-800">
                  Manufacturer
                </label>

                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. ABC Weighing Systems"
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-800">
                  Model
                </label>

                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. AWS-150"
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-800">
                  Serial Number
                </label>

                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-2026-001"
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="mt-8 flex justify-end">

              <button
                onClick={nextStep}
                className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continue →
              </button>

            </div>

          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Accuracy & Capacity
              </h2>

              <p className="mt-2 text-slate-600">
                Configure the weighing instrument parameters.
              </p>

            </div>

            <div className="grid gap-6 md:grid-cols-3">

              <div>
                <label className="font-medium text-slate-800">
                  Accuracy Class
                </label>

                <select
                  value={accuracyClass}
                  onChange={(e) => setAccuracyClass(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
                >
                  <option>CLASS I</option>
                  <option>CLASS II</option>
                  <option>CLASS III</option>
                  <option>CLASS IIII</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-800">
                  Maximum Capacity (Max)
                </label>

                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="font-medium text-slate-800">
                  Scale Interval (e)
                </label>

                <input
                  type="number"
                  value={scaleE}
                  onChange={(e) => setScaleE(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                  step="0.001"
                />
              </div>

            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-6">

              <h3 className="text-lg font-semibold text-slate-900">
                Calculated Verification Parameters
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-3">

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Verification Scale Divisions
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {divisions > 0
                      ? `${divisions.toLocaleString()}e`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">
                    MPE Multiplier
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {mpeMultiplier > 0
                      ? `±${mpeMultiplier}e`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Allowed Error
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {allowedMpe > 0
                      ? `±${allowedMpe.toFixed(6)}`
                      : "—"}
                  </p>
                </div>

              </div>

            </div>

            <div className="mt-8 flex justify-between">

              <button
                onClick={previousStep}
                className="rounded-xl border border-slate-300 px-7 py-3 font-semibold hover:bg-slate-100"
              >
                ← Back
              </button>

              <button
                onClick={nextStep}
                className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continue →
              </button>

            </div>

          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Weighing Test
              </h2>

              <p className="mt-2 text-slate-600">
                Enter the applied load and indicated value for each test
                point.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full border-collapse">

                <thead>
                  <tr className="bg-slate-100">

                    <th className="border p-3 text-left">
                      #
                    </th>

                    <th className="border p-3 text-left">
                      Load
                    </th>

                    <th className="border p-3 text-left">
                      Indicated Value
                    </th>

                    <th className="border p-3 text-center">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {testPoints.map((point, index) => (

                    <tr key={index}>

                      <td className="border p-3 font-semibold">
                        {index + 1}
                      </td>

                      <td className="border p-3">

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
                          className="w-full rounded-lg border border-slate-300 p-3"
                          step="0.001"
                        />

                      </td>

                      <td className="border p-3">

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
                          className="w-full rounded-lg border border-slate-300 p-3"
                          step="0.001"
                        />

                      </td>

                      <td className="border p-3 text-center">

                        <button
                          onClick={() => removeTestPoint(index)}
                          disabled={testPoints.length === 1}
                          className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Remove
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <button
              onClick={addTestPoint}
              className="mt-5 rounded-xl border border-blue-300 px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50"
            >
              + Add Test Point
            </button>

            <div className="mt-8">

              <button
                onClick={evaluateWeighingTest}
                disabled={loading}
                className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Evaluating..."
                  : "Evaluate Weighing Test"}
              </button>

            </div>

            {result && (
              <div className="mt-8">

                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-500">
                    Overall Status
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {result.overall_status}
                  </p>

                </div>

                <div className="mt-5 overflow-x-auto">

                  <table className="w-full border-collapse">

                    <thead>

                      <tr className="bg-slate-100">

                        <th className="border p-3">
                          Load
                        </th>

                        <th className="border p-3">
                          Indicated
                        </th>

                        <th className="border p-3">
                          Error
                        </th>

                        <th className="border p-3">
                          Allowed MPE
                        </th>

                        <th className="border p-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {result.details.map(
                        (item, index) => (

                          <tr key={index}>

                            <td className="border p-3 text-center">
                              {item.load}
                            </td>

                            <td className="border p-3 text-center">
                              {item.indicated}
                            </td>

                            <td className="border p-3 text-center">
                              {item.error}
                            </td>

                            <td className="border p-3 text-center">
                              {item.allowed_mpe}
                            </td>

                            <td className="border p-3 text-center font-bold">
                              {item.status}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

            <div className="mt-8 flex justify-between">

              <button
                onClick={previousStep}
                className="rounded-xl border border-slate-300 px-7 py-3 font-semibold hover:bg-slate-100"
              >
                ← Back
              </button>

              <button
                onClick={nextStep}
                className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continue →
              </button>

            </div>

          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Eccentricity Test
              </h2>

              <p className="mt-2 text-slate-600">
                Apply a test load and enter the indicated value at each
                measurement position.
              </p>

            </div>

            {/* Test Load */}
            <div className="mb-8">

              <label className="font-medium text-slate-800">
                Test Load
              </label>

              <input
                type="number"
                value={eccentricityLoad}
                onChange={(e) =>
                  setEccentricityLoad(e.target.value)
                }
                placeholder="e.g. 100"
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 md:max-w-md"
                step="0.001"
              />

            </div>

            {/* Position Readings */}
            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Position Readings
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Position 1 is used as the center/reference reading.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                {eccentricityReadings.map((reading, index) => (

                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >

                    <label className="font-semibold text-slate-800">
                      Position {index + 1}
                      {index === 0 && " (Center / Reference)"}
                    </label>

                    <input
                      type="number"
                      value={reading}
                      onChange={(e) =>
                        updateEccentricityReading(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Indicated value"
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3"
                      step="0.001"
                    />

                  </div>

                ))}

              </div>

            </div>

            {/* Evaluate */}
            <div className="mt-8">

              <button
                onClick={evaluateEccentricity}
                disabled={eccentricityLoading}
                className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {eccentricityLoading
                  ? "Evaluating..."
                  : "Evaluate Eccentricity"}
              </button>

            </div>

            {/* Results */}
            {eccentricityResult && (
              <div className="mt-8">

                <div className="grid gap-4 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Test Load
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {eccentricityResult.test_load}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Maximum Difference
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {eccentricityResult.max_difference}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Allowed Tolerance
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {eccentricityResult.allowed_tolerance}
                    </p>
                  </div>

                </div>

                <div className="mt-5 rounded-xl border border-slate-200 p-5">

                  <p className="text-sm text-slate-500">
                    Overall Status
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold ${
                      eccentricityResult.status === "PASS"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {eccentricityResult.status}
                  </p>

                </div>

                <div className="mt-5 overflow-x-auto">

                  <table className="w-full border-collapse">

                    <thead>

                      <tr className="bg-slate-100">

                        <th className="border p-3">
                          Position
                        </th>

                        <th className="border p-3">
                          Indicated
                        </th>

                        <th className="border p-3">
                          Difference from Center
                        </th>

                        <th className="border p-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {eccentricityResult.details.map(
                        (item) => (

                          <tr key={item.position}>

                            <td className="border p-3 text-center font-semibold">
                              Position {item.position}
                            </td>

                            <td className="border p-3 text-center">
                              {item.indicated}
                            </td>

                            <td className="border p-3 text-center">
                              {item.error}
                            </td>

                            <td className="border p-3 text-center font-bold">
                              {item.status}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">

              <button
                onClick={previousStep}
                className="rounded-xl border border-slate-300 px-7 py-3 font-semibold hover:bg-slate-100"
              >
                ← Back
              </button>

              <button
                onClick={nextStep}
                className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continue →
              </button>

            </div>

          </div>
        )}

        {/* TEMPORARY STEPS 5-7 */}
        {step > 4 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900">
              {step === 5 && "Repeatability Test"}
              {step === 6 && "Tare / Zero Test"}
              {step === 7 && "Final Review"}
            </h2>

            <p className="mt-3 text-slate-600">
              This module will be built next.
            </p>

            <div className="mt-6 flex justify-center gap-3">

              <button
                onClick={previousStep}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100"
              >
                ← Back
              </button>

              {step < 7 && (
                <button
                  onClick={nextStep}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Continue →
                </button>
              )}

            </div>

          </div>
        )}

      </div>
    </main>
  );
}