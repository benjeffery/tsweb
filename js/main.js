const output = document.getElementById("output");
const code = document.getElementById("code");
const tsSummary = document.getElementById("tsSummary");
const generateButton = document.getElementById("generate");
const saveButton = document.getElementById("save");

function addToOutput(s) {
  output.value += ">>>" + code.value + "\n" + s + "\n";
}
function addToOutputERR(s) {
  output.value += "ERR:" + s + "\n";
}
function addToOutput(s) {
  output.value += s + "\n";
}

var saveData = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, fileName) {
      blob = new Blob([data], {type: "application/octet-stream"}),
      url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };
}());

output.value = "Initializing...\n";
// init Pyodide
async function main() {
  let pyodide = await loadPyodide({stderr: addToOutputERR, stdout: addToOutput});
  output.value += "Pyodide ready, importing dependencies....\n";
  await pyodide.loadPackage("micropip");
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install('msprime')
  `);
  output.value += "Done! Ready to generate.\n";
  generateButton.disabled = false;
  return pyodide;
}
let pyodideReadyPromise = main();

async function generate() {
  let pyodide = await pyodideReadyPromise;
  try {
    let html_out = pyodide.runPython(`
    import msprime
    import demes
    from js import document
    graph = demes.loads(document.getElementById("code").value)
    demography = msprime.Demography.from_demes(graph)
    num_samples = int(document.getElementById("num_samples").value)
    ts = msprime.sim_ancestry(samples=num_samples, demography=demography, random_seed=12)
    ts.dump("msprime.trees")
    ts._repr_html_()
    `)
    tsSummary.innerHTML = html_out;
    saveButton.disabled = false;
  } catch (err) {
    addToOutput(err);
  }
}

async function saveFile() {
  let pyodide = await pyodideReadyPromise;
  saveData(pyodide.FS.readFile("msprime.trees"), "msprime.trees");
}

