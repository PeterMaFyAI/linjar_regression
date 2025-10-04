const csvData = `index,Area (kvm),Pris (miljoner kr)
0,111.0,3.57
1,135.0,3.99
2,73.0,2.35
3,99.0,2.65
4,88.0,3.18
5,119.0,3.44
6,23.0,0.71
7,143.0,4.66
8,86.0,2.71
9,124.0,4.53
10,86.0,2.54
11,99.0,3.4
12,83.0,2.83
13,45.0,1.35
14,53.0,2.1
15,74.0,2.52
16,77.0,2.89
17,117.0,4.11
18,36.0,2.08
19,98.0,3.69
20,112.0,3.6
21,75.0,2.53
22,40.0,1.88
23,132.0,4.51
24,113.0,3.93
25,51.0,1.39
26,77.0,2.65
27,79.0,2.5
28,37.0,1.54
29,95.0,3.17
30,102.0,3.68
31,61.0,2.28
32,79.0,2.96
33,122.0,3.87
34,64.0,1.99
35,43.0,1.52
36,54.0,1.96
37,54.0,2.08
38,122.0,4.69
39,74.0,2.56
40,42.0,1.32
41,51.0,1.78
42,101.0,3.24
43,63.0,2.38
44,41.0,1.12
45,40.0,1.57
46,105.0,3.55
47,98.0,3.36
48,45.0,1.52
49,81.0,2.71`;

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const data = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(",");
    data.push({
      index: Number(parts[0]),
      area: Number(parts[1]),
      price: Number(parts[2])
    });
  }
  return data;
}

const dataPoints = parseCSV(csvData);

function populateTable() {
  const tbody = document.getElementById("dataBody");
  dataPoints.forEach((point) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${point.index}</td>` +
      `<td>${point.area.toFixed(0)}</td>` +
      `<td>${point.price.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

const canvas = document.getElementById("plotCanvas");
const ctx = canvas.getContext("2d");
const margin = { left: 60, right: 20, top: 20, bottom: 60 };
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const plotWidth = canvasWidth - margin.left - margin.right;
const plotHeight = canvasHeight - margin.top - margin.bottom;

const showLineCheckbox = document.getElementById("showLineCheckbox");
const kSlider = document.getElementById("kSlider");
const mSlider = document.getElementById("mSlider");
const lineEquationElem = document.getElementById("lineEquation");
const showErrorCheckbox = document.getElementById("showErrorCheckbox");
const lineErrorElem = document.getElementById("lineError");
const showOptimalCheckbox = document.getElementById("showOptimalCheckbox");
const optimalEquationElem = document.getElementById("optimalEquation");
const doPredictionCheckbox = document.getElementById("doPredictionCheckbox");
const predictionGroup = document.getElementById("predictionGroup");
const predictionInput = document.getElementById("predictionInput");
const predictedPriceElem = document.getElementById("predictedPrice");

const xValues = dataPoints.map((p) => p.area);
const yValues = dataPoints.map((p) => p.price);
const xMinData = Math.min(...xValues);
const xMaxData = Math.max(...xValues);
const yMinData = Math.min(...yValues);
const yMaxData = Math.max(...yValues);
const xPadding = (xMaxData - xMinData) * 0.1;
const yPadding = (yMaxData - yMinData) * 0.1;
const xMinPlot = xMinData - xPadding;
const xMaxPlot = xMaxData + xPadding;
const yMinPlot = yMinData - yPadding;
const yMaxPlot = yMaxData + yPadding;

function dataToCanvasX(x) {
  return margin.left + ((x - xMinPlot) / (xMaxPlot - xMinPlot)) * plotWidth;
}

function dataToCanvasY(y) {
  return canvasHeight - margin.bottom - ((y - yMinPlot) / (yMaxPlot - yMinPlot)) * plotHeight;
}

function drawPlot() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, canvasHeight - margin.bottom);
  ctx.lineTo(canvasWidth - margin.right, canvasHeight - margin.bottom);
  ctx.moveTo(margin.left, canvasHeight - margin.bottom);
  ctx.lineTo(margin.left, margin.top);
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Area (kvm)", margin.left + plotWidth / 2, canvasHeight - 20);
  ctx.save();
  ctx.translate(20, margin.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Pris (miljoner kr)", 0, 0);
  ctx.restore();

  ctx.fillStyle = "black";
  dataPoints.forEach((p) => {
    const cx = dataToCanvasX(p.area);
    const cy = dataToCanvasY(p.price);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const k = parseFloat(kSlider.value);
  const m = parseFloat(mSlider.value);

  if (showLineCheckbox.checked) {
    lineEquationElem.textContent = `y = ${k.toFixed(3)}x + ${m.toFixed(2)}`;
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(dataToCanvasX(xMinPlot), dataToCanvasY(k * xMinPlot + m));
    ctx.lineTo(dataToCanvasX(xMaxPlot), dataToCanvasY(k * xMaxPlot + m));
    ctx.stroke();

    if (showErrorCheckbox.checked) {
      let totalError = 0;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      dataPoints.forEach((p) => {
        const predY = k * p.area + m;
        totalError += (predY - p.price) ** 2;
        const xPixel = dataToCanvasX(p.area);
        const yActual = dataToCanvasY(p.price);
        const yPred = dataToCanvasY(predY);
        ctx.beginPath();
        ctx.moveTo(xPixel, yActual);
        ctx.lineTo(xPixel, yPred);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      lineErrorElem.textContent = `Fel(k, m) = ${totalError.toFixed(3)}`;
    } else {
      lineErrorElem.textContent = "Fel(k, m) = -";
    }
  } else {
    lineEquationElem.textContent = "";
    lineErrorElem.textContent = "";
  }

  if (showOptimalCheckbox.checked) {
    const n = dataPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    dataPoints.forEach((p) => {
      sumX += p.area;
      sumY += p.price;
      sumXY += p.area * p.price;
      sumXX += p.area * p.area;
    });

    const kOpt = (n * sumXY - sumX * sumY) / (n * sumXX - sumX ** 2);
    const mOpt = (sumY - kOpt * sumX) / n;

    let totalErrorOpt = 0;
    dataPoints.forEach((p) => {
      const predY = kOpt * p.area + mOpt;
      totalErrorOpt += (predY - p.price) ** 2;
    });
    optimalEquationElem.innerHTML = `Optimal linje: y = ${kOpt.toFixed(3)}x + ${mOpt.toFixed(2)} <span class="error red">Fel(k, m) = ${totalErrorOpt.toFixed(3)}</span>`;

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(dataToCanvasX(xMinPlot), dataToCanvasY(kOpt * xMinPlot + mOpt));
    ctx.lineTo(dataToCanvasX(xMaxPlot), dataToCanvasY(kOpt * xMaxPlot + mOpt));
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    optimalEquationElem.innerHTML = "";
  }
}

function updatePrediction() {
  if (!doPredictionCheckbox.checked) {
    predictionGroup.style.display = "none";
    predictedPriceElem.textContent = "";
    return;
  }

  predictionGroup.style.display = "flex";
  const areaVal = parseFloat(predictionInput.value);
  if (!Number.isNaN(areaVal)) {
    const k = parseFloat(kSlider.value);
    const m = parseFloat(mSlider.value);
    const pricePred = k * areaVal + m;
    predictedPriceElem.textContent = `Pris ≈ ${pricePred.toFixed(2)} miljoner kr`;
  } else {
    predictedPriceElem.textContent = "";
  }
}

function addEventListeners() {
  [showLineCheckbox, kSlider, mSlider, showErrorCheckbox, showOptimalCheckbox].forEach((elem) => {
    elem.addEventListener("input", drawPlot);
    elem.addEventListener("change", drawPlot);
  });

  doPredictionCheckbox.addEventListener("change", () => {
    updatePrediction();
  });

  predictionInput.addEventListener("input", updatePrediction);
}

document.addEventListener("DOMContentLoaded", () => {
  populateTable();
  addEventListeners();
  updatePrediction();
  drawPlot();
});
