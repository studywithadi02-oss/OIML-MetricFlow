from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from rules.weighing import evaluate_weighing_test


app = FastAPI(
    title="OIML-MetricFlow API",
    description="OIML R-76 Test Report System",
    version="1.0.0"
)


class TestPoint(BaseModel):
    load: float
    indicated: float


class WeighingTestRequest(BaseModel):
    scale_e: float
    accuracy_class: str
    test_points: List[TestPoint]


@app.get("/")
def root():
    return {
        "message": "OIML-MetricFlow API is running",
        "status": "success"
    }


@app.post("/evaluate/weighing")
def evaluate_weighing(request: WeighingTestRequest):

    test_points = [
        {
            "load": point.load,
            "indicated": point.indicated
        }
        for point in request.test_points
    ]

    result = evaluate_weighing_test(
        scale_e=request.scale_e,
        accuracy_class=request.accuracy_class,
        test_points=test_points
    )

    return result