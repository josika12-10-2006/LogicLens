const $ = (id) => document.getElementById(id);

const barsContainer = $("bars");
const arrayInput = $("arrayInput");
const sizeRange = $("sizeRange");
const speedRange = $("speedRange");
const startBtn = $("startBtn");
const pauseBtn = $("pauseBtn");
const resetBtn = $("resetBtn");
const randomBtn = $("randomBtn");
const applyArrayBtn = $("applyArray");

let values = [42, 18, 35, 9, 27, 14, 31];
let timer = null;
let steps = [];
let stepIndex = 0;
let comparisons = 0;
let swaps = 0;
let running = false;
let paused = false;
let finished = false;
let toastTimer = null;

function makeStep(type, arr, i = -1, j = -1, message = "") {
  return { type, arr: [...arr], i, j, message };
}

function buildSortingSteps(input, algorithm) {
  const arr = [...input];
  const result = [];
  const add = (type, a, i = -1, j = -1, message = "", meta = {}) =>
    result.push({ type, arr: [...a], i, j, message, ...meta });

  add("ready", arr, -1, -1, `${algorithmNames[algorithm]} is ready. Press Start sorting to step through the algorithm.`);
  if (algorithm === "bubble") {
    for (let end = arr.length - 1; end > 0; end--) {
      let changed = false;
      for (let j = 0; j < end; j++) {
        add("compare", arr, j, j + 1,
          `Compare ${arr[j]} and ${arr[j + 1]}. ${arr[j] <= arr[j + 1] ? "They are already in ascending order; no swap is needed." : "The left value is larger, so swap the pair."}`);
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          changed = true;
          add("swap", arr, j, j + 1, `Swapped the pair. ${arr[j]} is now left of ${arr[j + 1]}.`);
        }
      }
      add("pass", arr, -1, end, `Pass complete. ${arr[end]} is in its final sorted position.`, { sortedFrom: end });
      if (!changed) break;
    }
  } else if (algorithm === "selection") {
    for (let i = 0; i < arr.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < arr.length; j++) {
        add("compare", arr, min, j, `Compare current minimum ${arr[min]} with ${arr[j]}.`);
        if (arr[j] < arr[min]) {
          min = j;
          add("minimum", arr, i, min, `${arr[min]} is the new minimum for the unsorted portion.`);
        }
      }
      if (min !== i) {
        const left = arr[i], right = arr[min];
        [arr[i], arr[min]] = [arr[min], arr[i]];
        add("swap", arr, i, min, `Place the minimum value ${left} at position ${i}; swap it with ${right}.`);
      } else {
        add("pass", arr, -1, i, `${arr[i]} is already the smallest remaining value.`, { sortedFrom: i + 1 });
      }
      add("pass", arr, -1, i, `Position ${i} is now sorted.`, { sortedFrom: i + 1 });
    }
  } else if (algorithm === "insertion") {
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      add("key", arr, i, -1, `Take ${key} as the key and insert it into the sorted left portion.`);
      while (j >= 0) {
        add("compare", arr, j, j + 1, `Compare ${arr[j]} with key ${key}.`);
        if (arr[j] > key) {
          arr[j + 1] = arr[j];
          add("shift", arr, j, j + 1, `Shift ${arr[j]} one position to the right.`);
          j--;
        } else break;
      }
      arr[j + 1] = key;
      add("insert", arr, j + 1, i, `Insert key ${key} at position ${j + 1}.`, { sortedFrom: i + 1 });
    }
  } else if (algorithm === "merge") {
    function mergeSort(left, right) {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      add("split", arr, left, right, `Split the current range into [${left}…${mid}] and [${mid + 1}…${right}].`);
      mergeSort(left, mid);
      mergeSort(mid + 1, right);
      const leftPart = arr.slice(left, mid + 1);
      const rightPart = arr.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      while (i < leftPart.length && j < rightPart.length) {
        add("compare", arr, left + i, mid + 1 + j, `Compare ${leftPart[i]} and ${rightPart[j]} before merging.`);
        if (leftPart[i] <= rightPart[j]) arr[k++] = leftPart[i++];
        else arr[k++] = rightPart[j++];
        add("write", arr, k - 1, -1, `Write ${arr[k - 1]} into merged position ${k - 1}.`);
      }
      while (i < leftPart.length) {
        arr[k++] = leftPart[i++];
        add("write", arr, k - 1, -1, `Copy remaining value ${arr[k - 1]} into the merged range.`);
      }
      while (j < rightPart.length) {
        arr[k++] = rightPart[j++];
        add("write", arr, k - 1, -1, `Copy remaining value ${arr[k - 1]} into the merged range.`);
      }
      add("merge", arr, left, right, `Merged range ${left}…${right} into sorted order.`);
    }
    mergeSort(0, arr.length - 1);
  } else if (algorithm === "quick") {
    function quickSort(low, high) {
      if (low >= high) return;
      const pivot = arr[high];
      add("pivot", arr, high, -1, `Choose ${pivot} as the pivot for this range.`);
      let i = low;
      for (let j = low; j < high; j++) {
        add("compare", arr, j, high, `Compare ${arr[j]} with pivot ${pivot}.`);
        if (arr[j] <= pivot) {
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            add("swap", arr, i, j, `Move ${arr[i]} into the partition on the left of the pivot.`);
          }
          i++;
        }
      }
      [arr[i], arr[high]] = [arr[high], arr[i]];
      add("pivotPlaced", arr, i, -1, `Pivot ${arr[i]} is now in its final position.`);
      quickSort(low, i - 1);
      quickSort(i + 1, high);
    }
    quickSort(0, arr.length - 1);
  }
  add("done", arr, -1, -1, `${algorithmNames[algorithm]} complete! The array is sorted.`);
  return result;
}

const algorithmNames = {
  bubble: "Bubble Sort",
  selection: "Selection Sort",
  insertion: "Insertion Sort",
  merge: "Merge Sort",
  quick: "Quick Sort"
};

const complexity = {
  bubble: ["O(n²)", "O(1)"],
  selection: ["O(n²)", "O(1)"],
  insertion: ["O(n²)", "O(1)"],
  merge: ["O(n log n)", "O(n)"],
  quick: ["O(n log n) avg.", "O(log n) avg."]
};

const javaSnippets = {
  bubble: `for (int i = 0; i < a.length - 1; i++) {
  for (int j = 0; j < a.length - 1 - i; j++) {
    if (a[j] > a[j + 1]) {
      int temp = a[j];
      a[j] = a[j + 1];
      a[j + 1] = temp;
    }
  }
}`,
  selection: `for (int i = 0; i < a.length - 1; i++) {
  int min = i;
  for (int j = i + 1; j < a.length; j++) {
    if (a[j] < a[min]) min = j;
  }
  int temp = a[i];
  a[i] = a[min];
  a[min] = temp;
}`,
  insertion: `for (int i = 1; i < a.length; i++) {
  int key = a[i];
  int j = i - 1;
  while (j >= 0 && a[j] > key) {
    a[j + 1] = a[j];
    j--;
  }
  a[j + 1] = key;
}`,
  merge: `// Merge sort uses divide and conquer.
void mergeSort(int[] a, int left, int right) {
  if (left >= right) return;
  int mid = left + (right - left) / 2;
  mergeSort(a, left, mid);
  mergeSort(a, mid + 1, right);
  merge(a, left, mid, right);
}`,
  quick: `void quickSort(int[] a, int low, int high) {
  if (low >= high) return;
  int pivotIndex = partition(a, low, high);
  quickSort(a, low, pivotIndex - 1);
  quickSort(a, pivotIndex + 1, high);
}`
};

function renderBars(highlight = [], sortedFrom = values.length, allSorted = false, pivotIndex = -1) {
  barsContainer.innerHTML = "";
  const max = Math.max(...values.map(v => Math.abs(v)), 1);
  values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    const normalized = Math.max(7, (Math.abs(value) / max) * 84);
    bar.style.setProperty("--bar-height", `${normalized}%`);
    if (allSorted || index >= sortedFrom) bar.classList.add("sorted");
    if (highlight.includes(index)) {
      bar.classList.remove("sorted");
      bar.classList.add("comparing");
    }
    if (pivotIndex === index) {
      bar.classList.remove("sorted");
      bar.classList.add("pivot");
    }
    const valueLabel = document.createElement("span");
    valueLabel.className = "bar-value";
    valueLabel.textContent = value;
    const indexLabel = document.createElement("span");
    indexLabel.className = "bar-index";
    indexLabel.textContent = index;
    bar.append(valueLabel, indexLabel);
    barsContainer.appendChild(bar);
  });
  barsContainer.setAttribute("aria-label", `Array values: ${values.join(", ")}`);
}

function updateMetrics() {
  $("comparisonCount").textContent = comparisons;
  $("swapCount").textContent = swaps;
  $("stepCount").textContent = String(stepIndex).padStart(2, "0");
  const usableSteps = Math.max(1, steps.length - 1);
  $("progressBar").style.width = `${Math.min(100, (stepIndex / usableSteps) * 100)}%`;
}

function showStep(step) {
  if (!step) return;
  values = [...step.arr];
  const sortedFrom = step.sortedFrom !== undefined ? step.sortedFrom :
    (step.type === "pass" ? Math.max(0, step.j) : values.length);
  const allSorted = step.type === "done";
  const highlight = step.i >= 0 ? [step.i] : [];
  if (step.j >= 0 && step.type !== "pass") highlight.push(step.j);
  const pivotIndex = step.type === "pivot" ? step.i : -1;
  renderBars(highlight, sortedFrom, allSorted, pivotIndex);
  $("processTitle").textContent = ({
    ready: "Ready to sort", compare: "Comparing values", swap: "Swapping values",
    pass: "Pass completed", done: "Sorting complete", minimum: "New minimum found",
    key: "Selecting insertion key", shift: "Shifting value", insert: "Key inserted",
    split: "Dividing the array", write: "Merging values", merge: "Range merged",
    pivot: "Pivot selected", pivotPlaced: "Pivot placed"
  })[step.type] || "Sorting";
  $("explanation").textContent = step.message;
  if (step.type === "compare") comparisons++;
  if (step.type === "swap" || step.type === "shift" || step.type === "write") swaps++;
  updateMetrics();
}

function updateAlgorithmInfo() {
  const algorithm = $("algorithmSelect").value;
  const info = complexity[algorithm] || complexity.bubble;
  document.querySelector(".metric-card:nth-child(3) strong").textContent = info[0];
  document.querySelector(".metric-card:nth-child(3) .metric-foot").textContent = `space: ${info[1]}`;
  $("javaCode").textContent = javaSnippets[algorithm] || javaSnippets.bubble;
}

function buildAndReset() {
  stopTimer();
  running = false;
  paused = false;
  finished = false;
  steps = buildSortingSteps(values, $("algorithmSelect").value);
  stepIndex = 0;
  comparisons = 0;
  swaps = 0;
  startBtn.disabled = false;
  startBtn.innerHTML = "<span>▶</span> Start sorting";
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Ⅱ Pause";
  updateAlgorithmInfo();
  showStep(steps[0]);
  $("progressBar").style.width = "0%";
}

function delayMs() {
  const speed = Number(speedRange.value);
  return 1000 / speed;
}

function stopTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function tick() {
  if (!running || paused) return;
  stepIndex++;
  if (stepIndex >= steps.length) {
    finish();
    return;
  }
  showStep(steps[stepIndex]);
  if (steps[stepIndex].type === "done") {
    finish(true);
    return;
  }
  timer = setTimeout(tick, delayMs());
}

function start() {
  if (running && paused) {
    paused = false;
    pauseBtn.textContent = "Ⅱ Pause";
    startBtn.disabled = true;
    timer = setTimeout(tick, 100);
    return;
  }
  if (finished) {
    try { values = parseArray(arrayInput.value); } catch { /* keep the last valid array */ }
    buildAndReset();
  }
  running = true;
  paused = false;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  timer = setTimeout(tick, 180);
}

function pause() {
  if (!running || finished) return;
  paused = !paused;
  if (paused) {
    stopTimer();
    pauseBtn.textContent = "▶ Resume";
    $("processTitle").textContent = "Simulation paused";
  } else {
    pauseBtn.textContent = "Ⅱ Pause";
    timer = setTimeout(tick, 100);
  }
}

function finish(alreadyAtDone = false) {
  stopTimer();
  running = false;
  paused = false;
  finished = true;
  startBtn.disabled = false;
  startBtn.innerHTML = "✓ Sorted — run again";
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Ⅱ Pause";
  if (!alreadyAtDone) {
    stepIndex = steps.length - 1;
    showStep(steps[stepIndex]);
  }
  $("progressBar").style.width = "100%";
}

function parseArray(raw) {
  const pieces = raw.split(",").map(s => s.trim());
  if (pieces.some(s => s === "" || !/^-?\d+$/.test(s))) {
    throw new Error("Enter whole numbers separated by commas.");
  }
  const parsed = pieces.map(Number);
  if (parsed.length < 2 || parsed.length > 18) {
    throw new Error("Please enter between 2 and 18 numbers.");
  }
  if (parsed.some(n => !Number.isSafeInteger(n) || Math.abs(n) > 999)) {
    throw new Error("Use whole numbers between -999 and 999.");
  }
  return parsed;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function applyCustomArray() {
  try {
    values = parseArray(arrayInput.value);
    sizeRange.value = Math.min(14, Math.max(4, values.length));
    $("sizeValue").textContent = `${values.length} values`;
    buildAndReset();
    showToast("Custom array applied successfully.");
  } catch (error) {
    showToast(error.message);
  }
}

function generateRandomArray() {
  const count = Number(sizeRange.value);
  values = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);
  arrayInput.value = values.join(", ");
  $("sizeValue").textContent = `${count} values`;
  buildAndReset();
  showToast("A new random array is ready.");
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", () => {
  try {
    values = parseArray(arrayInput.value);
    buildAndReset();
    showToast("Visualizer reset.");
  } catch {
    arrayInput.value = values.join(", ");
    buildAndReset();
    showToast("Visualizer reset to the last valid array.");
  }
});
randomBtn.addEventListener("click", generateRandomArray);
applyArrayBtn.addEventListener("click", applyCustomArray);
arrayInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyCustomArray();
});
sizeRange.addEventListener("input", () => {
  $("sizeValue").textContent = `${sizeRange.value} values`;
});
sizeRange.addEventListener("change", generateRandomArray);
speedRange.addEventListener("input", () => {
  $("speedValue").textContent = `${speedRange.value}×`;
});
$("algorithmSelect").addEventListener("change", () => {
  buildAndReset();
  showToast(`${algorithmNames[$("algorithmSelect").value]} selected.`);
});

const menuToggle = $("menuToggle");
menuToggle.addEventListener("click", () => {
  const nav = document.querySelector(".nav-links");
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

buildAndReset();
