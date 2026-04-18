const promptEl = document.getElementById("promptInput");
const btnEl = document.getElementById("analyzeBtn");
const outEl = document.getElementById("output");

function setLoading(isLoading) {
  btnEl.disabled = isLoading;
  btnEl.textContent = isLoading ? "Generating..." : "Generate Workflow";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderWorkflow(workflow) {
  const stepsHtml = (workflow.steps || []).map(step => `
    <div class="stepCard">
      <div class="stepHead">
        <span>Step ${step.id}</span>
        <span>${step.estimated_time_min} min</span>
      </div>
      <h3>${escapeHtml(step.title)}</h3>
      <p class="muted">${escapeHtml(step.objective)}</p>
      <ul>
        ${(step.actions || []).map(a => `<li>${escapeHtml(a)}</li>`).join("")}
      </ul>
      <p><b>Success:</b> ${escapeHtml(step.success_criteria)}</p>
    </div>
  `).join("");

  outEl.innerHTML = `
    <div class="resultWrap">
      <h2>${escapeHtml(workflow.workflow_title)}</h2>
      <p class="muted">${escapeHtml(workflow.summary)}</p>

      <div class="panel">
        <h4>Steps</h4>
        ${stepsHtml}
      </div>

      <div class="panel">
        <h4>Raw JSON</h4>
        <pre class="codeBox">${escapeHtml(JSON.stringify(workflow, null, 2))}</pre>
      </div>
    </div>
  `;
}

async function generateWorkflow() {
  const prompt = promptEl.value.trim();
  if (prompt.length < 5) {
    outEl.innerHTML = "<p>Please enter a valid prompt.</p>";
    return;
  }

  setLoading(true);
  outEl.innerHTML = "<p class='muted'>Thinking...</p>";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed");

    renderWorkflow(data.workflow);
  } catch (err) {
    outEl.innerHTML = `<p>Error: ${escapeHtml(err.message)}</p>`;
  } finally {
    setLoading(false);
  }
}

btnEl.addEventListener("click", generateWorkflow);


