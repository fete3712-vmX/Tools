const nameInput = document.getElementById("nameInput");
const branchInput = document.getElementById("branchInput");
const osSelect = document.getElementById("osSelect");

const onPush = document.getElementById("onPush");
const onPR = document.getElementById("onPR");
const onDispatch = document.getElementById("onDispatch");

const stepCheckout = document.getElementById("stepCheckout");
const stepNode = document.getElementById("stepNode");
const stepPython = document.getElementById("stepPython");

const codeInput = document.getElementById("codeInput");
const codeOutput = document.getElementById("code");
const copyBtn = document.getElementById("copyBtn");
const dlBtn = document.getElementById("dlBtn");

function update() {
    const name = nameInput.value.trim() || "CI";
    const branch = branchInput.value.trim() || "main";
    const os = osSelect.value;

    let triggers = [];
    if (onPush.checked) triggers.push(`  push:\n    branches: [ ${branch} ]`);
    if (onPR.checked) triggers.push(`  pull_request:\n    branches: [ ${branch} ]`);
    if (onDispatch.checked) triggers.push(`  workflow_dispatch:`);

    let steps = [];
    if (stepCheckout.checked) {
        steps.push(`      - name: Checkout\n        uses: actions/checkout@v4`);
    }
    if (stepNode.checked) {
        steps.push(`      - name: Setup Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20`);
    }
    if (stepPython.checked) {
        steps.push(`      - name: Setup Python\n        uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'`);
    }

    const rawCommands = codeInput.value.trim();
    if (rawCommands) {
        const lines = rawCommands.split("\n");
        if (lines.length === 1) {
            steps.push(`      - name: Run script\n        run: ${lines[0]}`);
        } else {
            const formatted = lines.map(line => `          ${line}`).join("\n");
            steps.push(`      - name: Run script\n        run: |\n${formatted}`);
        }
    }

    codeOutput.value = `name: ${name}

on:
${triggers.join("\n")}

jobs:
  run:
    runs-on: ${os}
    steps:
${steps.join("\n\n")}
`;
}

// Live reactivity (like QRGen)
[nameInput, branchInput, osSelect, onPush, onPR, onDispatch, stepCheckout, stepNode, stepPython, codeInput].forEach(el => {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
});

document.getElementById("gen").addEventListener("click", update);

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(codeOutput.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy"; }, 1200);
});

dlBtn.addEventListener("click", () => {
    const blob = new Blob([codeOutput.value], { type: "text/yaml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "main.yml";
    a.click();
    URL.revokeObjectURL(a.href);
});

// Initial run
update();
