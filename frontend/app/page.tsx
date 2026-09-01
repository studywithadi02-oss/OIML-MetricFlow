"use client";

import { useEffect, useState } from "react";

type TestPoint = {
  load: string;
  indicated: string;
};

type WeighingResultItem = {
  load: number;
  indicated: number;
  error: number;
  allowed_mpe: number;
  status: string;
};

type WeighingResult = {
  overall_status: string;
  details: WeighingResultItem[];
};

type EccentricityDetail = {
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
  details: EccentricityDetail[];
};

type RepeatabilityDetail = {
  reading_number: number;
  indicated: number;
  error: number;
  status: string;
};

type RepeatabilityResult = {
  test_load: number;
  accuracy_class: string;
  required_readings: number;
  actual_readings: number;
  mpe_multiplier: number;
  allowed_mpe: number;
  minimum_reading: number;
  maximum_reading: number;
  repeatability_difference: number;
  repeatability_status: string;
  individual_status: string;
  overall_status: string;
  details: RepeatabilityDetail[];
};

export default function Home() {
  const [step, setStep] = useState(1);

  // =========================
  // STEP 1
  // =========================

  const [instrumentName, setInstrumentName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  // =========================
  // STEP 2
  // =========================

  const [accuracyClass, setAccuracyClass] = useState("CLASS III");
  const [capacity, setCapacity] = useState("150");
  const [scaleE, setScaleE] = useState("0.05");

  // =========================
  // STEP 3
  // =========================

  const [testPoints, setTestPoints] = useState<TestPoint[]>([
    {
      load: "",
      indicated: "",
    },
  ]);

  const [weighingResult, setWeighingResult] =
    useState<WeighingResult | null>(null);

  const [weighingLoading, setWeighingLoading] = useState(false);

  // =========================
  // STEP 4
  // =========================

  const [eccentricityLoad, setEccentricityLoad] = useState("");

  const [eccentricityReadings, setEccentricityReadings] =
    useState<string[]>([
      "",
      "",
      "",
      "",
    ]);

  const [eccentricityResult, setEccentricityResult] =
    useState<EccentricityResult | null>(null);

  const [eccentricityLoading, setEccentricityLoading] =
    useState(false);

  // =========================
  // STEP 5
  // =========================

  const [repeatabilityLoad, setRepeatabilityLoad] = useState("");

  const [repeatabilityReadings, setRepeatabilityReadings] =
    useState<string[]>([]);

  const [repeatabilityResult, setRepeatabilityResult] =
    useState<RepeatabilityResult | null>(null);

  const [repeatabilityLoading, setRepeatabilityLoading] =
    useState(false);
      // =========================
  // STEP 6
  // =========================

  const [zeroErrors, setZeroErrors] = useState<string[]>([
    "",
    "",
    "",
  ]);

  const [tareErrors, setTareErrors] = useState<string[]>([
    "",
    "",
  ]);

  const [tareZeroResult, setTareZeroResult] =
    useState<any>(null);

  const [tareZeroLoading, setTareZeroLoading] =
    useState(false);

  // =========================
  // NAVIGATION
  // =========================

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

  // =========================
  // STEP 2 CALCULATIONS
  // =========================

  const divisions =
    Number(capacity) > 0 && Number(scaleE) > 0
      ? Number(capacity) / Number(scaleE)
      : 0;

  const getMpeMultiplier = () => {
    if (divisions <= 0) {
      return 0;
    }

    if (accuracyClass === "CLASS I") {
      if (divisions <= 50000) {
        return 0.5;
      }

      if (divisions <= 200000) {
        return 1.0;
      }

      return 1.5;
    }

    if (accuracyClass === "CLASS II") {
      if (divisions <= 5000) {
        return 0.5;
      }

      if (divisions <= 20000) {
        return 1.0;
      }

      return 1.5;
    }

    if (accuracyClass === "CLASS III") {
      if (divisions <= 500) {
        return 0.5;
      }

      if (divisions <= 2000) {
        return 1.0;
      }

      return 1.5;
    }

    if (divisions <= 50) {
      return 0.5;
    }

    if (divisions <= 200) {
      return 1.0;
    }

    return 1.5;
  };

  const mpeMultiplier = getMpeMultiplier();

  const allowedMpe =
    Number(scaleE) * mpeMultiplier;

  // =========================
  // STEP 3 FUNCTIONS
  // =========================

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
    if (testPoints.length === 1) {
      return;
    }

    setTestPoints(
      testPoints.filter((_, i) => i !== index)
    );
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
      (point) =>
        point.load !== "" &&
        point.indicated !== ""
    );

    if (validPoints.length === 0) {
      alert("Please enter at least one test point.");
      return;
    }

    setWeighingLoading(true);
    setWeighingResult(null);

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
            test_points: validPoints.map(
              (point) => ({
                load: Number(point.load),
                indicated: Number(point.indicated),
              })
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Backend evaluation failed"
        );
      }

      const data =
        await response.json();

      setWeighingResult(data);
    } catch (error) {
      console.error(error);
      alert(
        "Could not connect to backend."
      );
    } finally {
      setWeighingLoading(false);
    }
  };

  // =========================
  // STEP 4 FUNCTIONS
  // =========================

  const updateEccentricityReading = (
    index: number,
    value: string
  ) => {
    const updated = [
      ...eccentricityReadings,
    ];

    updated[index] = value;

    setEccentricityReadings(
      updated
    );
  };

  const evaluateEccentricity = async () => {
    if (eccentricityLoad === "") {
      alert(
        "Please enter the eccentricity test load."
      );
      return;
    }

    const validReadings =
      eccentricityReadings.filter(
        (reading) => reading !== ""
      );

    if (validReadings.length === 0) {
      alert(
        "Please enter eccentricity readings."
      );
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
            test_load:
              Number(eccentricityLoad),

            scale_e:
              Number(scaleE),

            readings:
              validReadings.map(Number),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Eccentricity evaluation failed"
        );
      }

      const data =
        await response.json();

      setEccentricityResult(data);
    } catch (error) {
      console.error(error);
      alert(
        "Could not connect to backend."
      );
    } finally {
      setEccentricityLoading(false);
    }
  };

  // =========================
  // STEP 5 FUNCTIONS
  // =========================

  const requiredRepeatabilityReadings =
    accuracyClass === "CLASS I" ||
    accuracyClass === "CLASS II"
      ? 6
      : 3;

  useEffect(() => {
    setRepeatabilityReadings(
      Array(requiredRepeatabilityReadings).fill("")
    );

    setRepeatabilityResult(null);
  }, [
    accuracyClass,
    requiredRepeatabilityReadings,
  ]);

  const updateRepeatabilityReading = (
    index: number,
    value: string
  ) => {
    const updated = [
      ...repeatabilityReadings,
    ];

    updated[index] = value;

    setRepeatabilityReadings(
      updated
    );
  };

  const evaluateRepeatability = async () => {
    if (repeatabilityLoad === "") {
      alert(
        "Please enter the repeatability test load."
      );
      return;
    }

    const validReadings =
      repeatabilityReadings.filter(
        (reading) => reading !== ""
      );

    if (
      validReadings.length !==
      requiredRepeatabilityReadings
    ) {
      alert(
        `Please enter all ${requiredRepeatabilityReadings} required readings.`
      );
      return;
    }

    setRepeatabilityLoading(true);
    setRepeatabilityResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/evaluate/repeatability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            test_load:
              Number(repeatabilityLoad),

            scale_e:
              Number(scaleE),

            accuracy_class:
              accuracyClass,

            readings:
              validReadings.map(Number),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Repeatability evaluation failed"
        );
      }

      const data =
        await response.json();

      setRepeatabilityResult(data);
    } catch (error) {
      console.error(error);
      alert(
        "Could not connect to backend."
      );
    } finally {
      setRepeatabilityLoading(false);
    }
  };
    // =========================
  // STEP 6 FUNCTIONS
  // =========================

  const updateZeroError = (
    index: number,
    value: string
  ) => {
    const updated = [...zeroErrors];

    updated[index] = value;

    setZeroErrors(updated);
  };

  const updateTareError = (
    index: number,
    value: string
  ) => {
    const updated = [...tareErrors];

    updated[index] = value;

    setTareErrors(updated);
  };

  const evaluateTareZero = async () => {
    const validZeroErrors = zeroErrors
      .filter((error) => error !== "")
      .map(Number);

    const validTareErrors = tareErrors
      .filter((error) => error !== "")
      .map(Number);

    if (
      validZeroErrors.length === 0 &&
      validTareErrors.length === 0
    ) {
      alert(
        "Please enter at least one zero or tare error."
      );
      return;
    }

    setTareZeroLoading(true);
    setTareZeroResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/evaluate/tare-zero",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scale_e: Number(scaleE),
            zero_errors: validZeroErrors,
            tare_errors: validTareErrors,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Tare / Zero evaluation failed"
        );
      }

      const data = await response.json();

      setTareZeroResult(data);
    } catch (error) {
      console.error(error);
      alert(
        "Could not connect to backend."
      );
    } finally {
      setTareZeroLoading(false);
    }
  };
    // =========================
  // STEP 7 HELPERS
  // =========================

  const getTestStatus = (
    status: string | undefined
  ) => {
    if (!status) {
      return "NOT EVALUATED";
    }

    return status;
  };

  const finalStatuses = [
    weighingResult?.overall_status,
    eccentricityResult?.status,
    repeatabilityResult?.overall_status,
    tareZeroResult?.overall_status,
  ];

  const completedTests = finalStatuses.filter(
    (status) => status !== undefined
  ).length;

  const hasFailedTest = finalStatuses.some(
    (status) => status === "FAIL"
  );

  const finalVerificationStatus =
    completedTests < 4
      ? "INCOMPLETE"
      : hasFailedTest
      ? "FAIL"
      : "PASS";


  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-slate-900">
            OIML-MetricFlow
          </h1>

          <p className="mt-2 text-slate-600">
            OIML R-76 Weighing Instrument Test System
          </p>

        </div>

        {/* ========================= */}
        {/* PROGRESS */}
        {/* ========================= */}

        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between text-sm">

            <div className="font-semibold text-blue-600">
              Step {step} of 7
            </div>

            <div className="text-slate-500">

              {step === 1 &&
                "Instrument Information"}

              {step === 2 &&
                "Accuracy & Capacity"}

              {step === 3 &&
                "Weighing Test"}

              {step === 4 &&
                "Eccentricity Test"}

              {step === 5 &&
                "Repeatability Test"}

              {step === 6 &&
                "Tare / Zero Test"}

              {step === 7 &&
                "Final Review"}

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

        {/* ========================= */}
        {/* STEP 1 */}
        {/* ========================= */}

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
                  onChange={(e) =>
                    setInstrumentName(
                      e.target.value
                    )
                  }
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
                  onChange={(e) =>
                    setManufacturer(
                      e.target.value
                    )
                  }
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
                  onChange={(e) =>
                    setModel(e.target.value)
                  }
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
                  onChange={(e) =>
                    setSerialNumber(
                      e.target.value
                    )
                  }
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

        {/* ========================= */}
        {/* STEP 2 */}
        {/* ========================= */}

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
                  onChange={(e) =>
                    setAccuracyClass(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
                >

                  <option>
                    CLASS I
                  </option>

                  <option>
                    CLASS II
                  </option>

                  <option>
                    CLASS III
                  </option>

                  <option>
                    CLASS IIII
                  </option>

                </select>

              </div>

              <div>

                <label className="font-medium text-slate-800">
                  Maximum Capacity (Max)
                </label>

                <input
                  type="number"
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(
                      e.target.value
                    )
                  }
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
                  onChange={(e) =>
                    setScaleE(
                      e.target.value
                    )
                  }
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
                      ? `±${allowedMpe.toFixed(
                          6
                        )}`
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

        {/* ========================= */}
        {/* STEP 3 */}
        {/* ========================= */}

        {step === 3 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Weighing Test
              </h2>

              <p className="mt-2 text-slate-600">
                Enter the applied load and indicated value for each test point.
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

                  {testPoints.map(
                    (point, index) => (

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
                            onClick={() =>
                              removeTestPoint(
                                index
                              )
                            }
                            disabled={
                              testPoints.length ===
                              1
                            }
                            className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            Remove
                          </button>

                        </td>

                      </tr>

                    )
                  )}

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
                disabled={weighingLoading}
                className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {weighingLoading
                  ? "Evaluating..."
                  : "Evaluate Weighing Test"}
              </button>

            </div>

            {weighingResult && (
              <div className="mt-8">

                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-500">
                    Overall Status
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      weighingResult.overall_status ===
                      "PASS"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {weighingResult.overall_status}
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

                      {weighingResult.details.map(
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

                              <span
                                className={
                                  item.status ===
                                  "PASS"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {item.status}
                              </span>

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

        {/* ========================= */}
        {/* STEP 4 */}
        {/* ========================= */}

        {step === 4 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Eccentricity Test
              </h2>

              <p className="mt-2 text-slate-600">
                Enter the test load and indicated values for each position.
              </p>

            </div>

            <div>

              <label className="font-medium text-slate-800">
                Test Load
              </label>

              <input
                type="number"
                value={eccentricityLoad}
                onChange={(e) =>
                  setEccentricityLoad(
                    e.target.value
                  )
                }
                placeholder="e.g. 120"
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                step="0.001"
              />

            </div>

            <div className="mt-8 overflow-x-auto">

              <table className="w-full border-collapse">

                <thead>

                  <tr className="bg-slate-100">

                    <th className="border p-3">
                      Position
                    </th>

                    <th className="border p-3">
                      Indicated Value
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {eccentricityReadings.map(
                    (reading, index) => (

                      <tr key={index}>

                        <td className="border p-3 text-center font-semibold">
                          Position {index + 1}
                        </td>

                        <td className="border p-3">

                          <input
                            type="number"
                            value={reading}
                            onChange={(e) =>
                              updateEccentricityReading(
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Enter indicated value"
                            className="w-full rounded-lg border border-slate-300 p-3"
                            step="0.001"
                          />

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="mt-8">

              <button
                onClick={
                  evaluateEccentricity
                }
                disabled={
                  eccentricityLoading
                }
                className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {eccentricityLoading
                  ? "Evaluating..."
                  : "Evaluate Eccentricity"}
              </button>

            </div>

            {eccentricityResult && (
              <div className="mt-8">

                <div className="grid gap-4 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Test Load
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        eccentricityResult.test_load
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Maximum Difference
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        eccentricityResult.max_difference
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Allowed Tolerance
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        eccentricityResult.allowed_tolerance
                      }
                    </p>

                  </div>

                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-500">
                    Overall Status
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      eccentricityResult.status ===
                      "PASS"
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
                          Error
                        </th>

                        <th className="border p-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {eccentricityResult.details.map(
                        (item, index) => (

                          <tr key={index}>

                            <td className="border p-3 text-center">
                              {item.position}
                            </td>

                            <td className="border p-3 text-center">
                              {item.indicated}
                            </td>

                            <td className="border p-3 text-center">
                              {item.error}
                            </td>

                            <td className="border p-3 text-center font-bold">

                              <span
                                className={
                                  item.status ===
                                  "PASS"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {item.status}
                              </span>

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

        {/* ========================= */}
        {/* STEP 5 */}
        {/* ========================= */}

        {step === 5 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Repeatability Test
              </h2>

              <p className="mt-2 text-slate-600">
                Enter repeated readings for the same test load.
              </p>

            </div>

            {/* Test Load */}

            <div>

              <label className="font-medium text-slate-800">
                Test Load
              </label>

              <input
                type="number"
                value={repeatabilityLoad}
                onChange={(e) =>
                  setRepeatabilityLoad(
                    e.target.value
                  )
                }
                placeholder="e.g. 120"
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                step="0.001"
              />

            </div>

            {/* Reading Information */}

            <div className="mt-6 rounded-xl bg-blue-50 p-5">

              <p className="text-sm text-slate-600">
                Accuracy Class
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {accuracyClass}
              </p>

              <p className="mt-3 text-sm text-slate-600">
                Required Readings
              </p>

              <p className="mt-1 text-lg font-bold text-blue-600">
                {requiredRepeatabilityReadings}
              </p>

            </div>

            {/* Readings */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold text-slate-900">
                Repeated Readings
              </h3>

              <div className="mt-4 overflow-x-auto">

                <table className="w-full border-collapse">

                  <thead>

                    <tr className="bg-slate-100">

                      <th className="border p-3">
                        Reading
                      </th>

                      <th className="border p-3">
                        Indicated Value
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {repeatabilityReadings.map(
                      (reading, index) => (

                        <tr key={index}>

                          <td className="border p-3 text-center font-semibold">
                            Reading {index + 1}
                          </td>

                          <td className="border p-3">

                            <input
                              type="number"
                              value={reading}
                              onChange={(e) =>
                                updateRepeatabilityReading(
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="e.g. 120.020"
                              className="w-full rounded-lg border border-slate-300 p-3"
                              step="0.001"
                            />

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* Evaluate */}

            <div className="mt-8">

              <button
                onClick={
                  evaluateRepeatability
                }
                disabled={
                  repeatabilityLoading
                }
                className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {repeatabilityLoading
                  ? "Evaluating..."
                  : "Evaluate Repeatability"}
              </button>

            </div>

            {/* Results */}

            {repeatabilityResult && (
              <div className="mt-8">

                <h3 className="text-xl font-bold text-slate-900">
                  Repeatability Results
                </h3>

                {/* Summary */}

                <div className="mt-5 grid gap-4 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Test Load
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        repeatabilityResult.test_load
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Allowed MPE
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        repeatabilityResult.allowed_mpe
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Repeatability Difference
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        repeatabilityResult.repeatability_difference
                      }
                    </p>

                  </div>

                </div>

                {/* Overall Status */}

                <div className="mt-5 rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-500">
                    Overall Status
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold ${
                      repeatabilityResult.overall_status ===
                      "PASS"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {
                      repeatabilityResult.overall_status
                    }
                  </p>

                </div>

                {/* Status Summary */}

                <div className="mt-5 grid gap-4 md:grid-cols-2">

                  <div className="rounded-xl border p-5">

                    <p className="text-sm text-slate-500">
                      Individual Reading Status
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        repeatabilityResult.individual_status ===
                        "PASS"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {
                        repeatabilityResult.individual_status
                      }
                    </p>

                  </div>

                  <div className="rounded-xl border p-5">

                    <p className="text-sm text-slate-500">
                      Repeatability Status
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        repeatabilityResult.repeatability_status ===
                        "PASS"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {
                        repeatabilityResult.repeatability_status
                      }
                    </p>

                  </div>

                </div>

                {/* Reading Details */}

                <div className="mt-6">

                  <h4 className="mb-3 text-lg font-semibold text-slate-900">
                    Reading Details
                  </h4>

                  <div className="overflow-x-auto">

                    <table className="w-full border-collapse">

                      <thead>

                        <tr className="bg-slate-100">

                          <th className="border p-3">
                            Reading
                          </th>

                          <th className="border p-3">
                            Indicated
                          </th>

                          <th className="border p-3">
                            Error
                          </th>

                          <th className="border p-3">
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {repeatabilityResult.details.map(
                          (item) => (

                            <tr
                              key={
                                item.reading_number
                              }
                            >

                              <td className="border p-3 text-center">
                                {
                                  item.reading_number
                                }
                              </td>

                              <td className="border p-3 text-center">
                                {
                                  item.indicated
                                }
                              </td>

                              <td className="border p-3 text-center">
                                {item.error}
                              </td>

                              <td className="border p-3 text-center font-bold">

                                <span
                                  className={
                                    item.status ===
                                    "PASS"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {item.status}
                                </span>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

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

              {/* ========================= */}
        {/* STEP 6 */}
        {/* ========================= */}

        {step === 6 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Tare / Zero Test
              </h2>

              <p className="mt-2 text-slate-600">
                Enter the measured errors obtained during the
                zero-setting and tare-setting tests.
              </p>

            </div>

            {/* Scale Information */}

            <div className="rounded-xl bg-slate-50 p-5">

              <p className="text-sm text-slate-500">
                Scale Interval (e)
              </p>

              <p className="mt-1 text-xl font-bold">
                {scaleE}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Current Scale Class
              </p>

              <p className="mt-1 text-xl font-bold">
                {accuracyClass}
              </p>

            </div>

            {/* ZERO SETTING */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold text-slate-900">
                Zero-Setting Test
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter measured zero-setting error values.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-3">

                {zeroErrors.map((error, index) => (

                  <div key={index}>

                    <label className="font-medium text-slate-800">
                      Zero Test {index + 1}
                    </label>

                    <input
                      type="number"
                      value={error}
                      onChange={(e) =>
                        updateZeroError(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="e.g. 0.005"
                      className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                      step="0.001"
                    />

                  </div>

                ))}

              </div>

            </div>

            {/* TARE SETTING */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold text-slate-900">
                Tare-Setting Test
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter measured tare-setting error values.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                {tareErrors.map((error, index) => (

                  <div key={index}>

                    <label className="font-medium text-slate-800">
                      Tare Test {index + 1}
                    </label>

                    <input
                      type="number"
                      value={error}
                      onChange={(e) =>
                        updateTareError(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="e.g. 0.006"
                      className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                      step="0.001"
                    />

                  </div>

                ))}

              </div>

            </div>

            {/* EVALUATE */}

            <div className="mt-8">

              <button
                onClick={evaluateTareZero}
                disabled={tareZeroLoading}
                className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tareZeroLoading
                  ? "Evaluating..."
                  : "Evaluate Tare / Zero Test"}
              </button>

            </div>

            {/* RESULTS */}

            {tareZeroResult && (
              <div className="mt-8">

                <h3 className="text-xl font-bold text-slate-900">
                  Tare / Zero Results
                </h3>

                {/* SUMMARY */}

                <div className="mt-5 grid gap-4 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Allowed Tolerance
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {tareZeroResult.allowed_tolerance}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Zero Setting
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        tareZeroResult.zero_setting_status ===
                        "PASS"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tareZeroResult.zero_setting_status}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm text-slate-500">
                      Tare Setting
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        tareZeroResult.tare_setting_status ===
                        "PASS"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tareZeroResult.tare_setting_status}
                    </p>

                  </div>

                </div>

                {/* OVERALL STATUS */}

                <div className="mt-5 rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-500">
                    Overall Status
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold ${
                      tareZeroResult.overall_status ===
                      "PASS"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tareZeroResult.overall_status}
                  </p>

                </div>

                {/* DETAILS */}

                <div className="mt-6 overflow-x-auto">

                  <h4 className="mb-3 text-lg font-semibold text-slate-900">
                    Test Details
                  </h4>

                  <table className="w-full border-collapse">

                    <thead>

                      <tr className="bg-slate-100">

                        <th className="border p-3">
                          Test Type
                        </th>

                        <th className="border p-3">
                          Test Number
                        </th>

                        <th className="border p-3">
                          Measured Error
                        </th>

                        <th className="border p-3">
                          Allowed Tolerance
                        </th>

                        <th className="border p-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {tareZeroResult.details.map(
                        (item: any, index: number) => (

                          <tr key={index}>

                            <td className="border p-3 text-center">
                              {item.test_type}
                            </td>

                            <td className="border p-3 text-center">
                              {item.test_number}
                            </td>

                            <td className="border p-3 text-center">
                              {item.measured_error}
                            </td>

                            <td className="border p-3 text-center">
                              {item.allowed_tolerance}
                            </td>

                            <td className="border p-3 text-center font-bold">

                              <span
                                className={
                                  item.status === "PASS"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {item.status}
                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

            {/* NAVIGATION */}

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

        {/* ========================= */}
        {/* STEP 7 */}
        {/* ========================= */}

                {/* ========================= */}
        {/* STEP 7 */}
        {/* ========================= */}

        {step === 7 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Final Review
              </h2>

              <p className="mt-2 text-slate-600">
                Review the instrument information and all completed
                verification tests.
              </p>

            </div>

            {/* INSTRUMENT INFORMATION */}

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Instrument Information
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Instrument Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {instrumentName || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Manufacturer
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {manufacturer || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Model
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {model || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Serial Number
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {serialNumber || "Not provided"}
                  </p>
                </div>

              </div>

            </div>

            {/* VERIFICATION PARAMETERS */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold text-slate-900">
                Verification Parameters
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Accuracy Class
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {accuracyClass}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Maximum Capacity (Max)
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {capacity}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Scale Interval (e)
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {scaleE}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Verification Scale Divisions
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {divisions > 0
                      ? `${divisions.toLocaleString()}e`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    MPE Multiplier
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {mpeMultiplier > 0
                      ? `±${mpeMultiplier}e`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Allowed Error
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {allowedMpe > 0
                      ? `±${allowedMpe.toFixed(6)}`
                      : "—"}
                  </p>
                </div>

              </div>

            </div>

            {/* TEST RESULTS */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold text-slate-900">
                Verification Test Results
              </h3>

              <div className="mt-4 overflow-x-auto">

                <table className="w-full border-collapse">

                  <thead>

                    <tr className="bg-slate-100">

                      <th className="border p-3 text-left">
                        Test
                      </th>

                      <th className="border p-3 text-left">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    <tr>
                      <td className="border p-3 font-medium">
                        Weighing Test
                      </td>

                      <td
                        className={`border p-3 font-bold ${
                          getTestStatus(
                            weighingResult?.overall_status
                          ) === "PASS"
                            ? "text-green-600"
                            : getTestStatus(
                                weighingResult?.overall_status
                              ) === "FAIL"
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {getTestStatus(
                          weighingResult?.overall_status
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="border p-3 font-medium">
                        Eccentricity Test
                      </td>

                      <td
                        className={`border p-3 font-bold ${
                          getTestStatus(
                            eccentricityResult?.status
                          ) === "PASS"
                            ? "text-green-600"
                            : getTestStatus(
                                eccentricityResult?.status
                              ) === "FAIL"
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {getTestStatus(
                          eccentricityResult?.status
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="border p-3 font-medium">
                        Repeatability Test
                      </td>

                      <td
                        className={`border p-3 font-bold ${
                          getTestStatus(
                            repeatabilityResult?.overall_status
                          ) === "PASS"
                            ? "text-green-600"
                            : getTestStatus(
                                repeatabilityResult?.overall_status
                              ) === "FAIL"
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {getTestStatus(
                          repeatabilityResult?.overall_status
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="border p-3 font-medium">
                        Tare / Zero Test
                      </td>

                      <td
                        className={`border p-3 font-bold ${
                          getTestStatus(
                            tareZeroResult?.overall_status
                          ) === "PASS"
                            ? "text-green-600"
                            : getTestStatus(
                                tareZeroResult?.overall_status
                              ) === "FAIL"
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {getTestStatus(
                          tareZeroResult?.overall_status
                        )}
                      </td>
                    </tr>

                  </tbody>

                </table>

              </div>

            </div>

            {/* FINAL STATUS */}

            <div className="mt-8 rounded-2xl bg-slate-50 p-6">

              <p className="text-sm text-slate-500">
                Final Verification Status
              </p>

              <p
                className={`mt-2 text-4xl font-bold ${
                  finalVerificationStatus === "PASS"
                    ? "text-green-600"
                    : finalVerificationStatus === "FAIL"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {finalVerificationStatus}
              </p>

              <p className="mt-3 text-sm text-slate-600">
                {completedTests} of 4 verification tests completed.
              </p>

              {finalVerificationStatus === "INCOMPLETE" && (
                <p className="mt-2 text-sm text-slate-500">
                  Complete all four verification tests before issuing
                  the final result.
                </p>
              )}

            </div>

            {/* NAVIGATION */}

            <div className="mt-8 flex justify-between">

              <button
                onClick={previousStep}
                className="rounded-xl border border-slate-300 px-7 py-3 font-semibold hover:bg-slate-100"
              >
                ← Back
              </button>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}