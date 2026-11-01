export function renderEvidencePage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Workflow Evidence Dashboard</title>
    <style>
      :root {
        color-scheme: light;
        --background: #f6f7f9;
        --surface: #ffffff;
        --surface-strong: #eef2f6;
        --text: #17202a;
        --muted: #5d6978;
        --border: #d7dee7;
        --accent: #1d6fb8;
        --success: #127a45;
        --danger: #b3261e;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--background);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      main {
        width: min(1120px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 48px;
      }

      header {
        margin-bottom: 24px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(2rem, 5vw, 3rem);
        line-height: 1.05;
      }

      h2 {
        margin: 0 0 16px;
        font-size: 1.2rem;
      }

      p {
        margin: 0;
        color: var(--muted);
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(280px, 360px) 1fr;
        gap: 20px;
        align-items: start;
      }

      .panel {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 10px 24px rgb(15 23 42 / 0.06);
      }

      form {
        display: grid;
        gap: 16px;
      }

      label {
        display: grid;
        gap: 6px;
        font-weight: 650;
      }

      input,
      select,
      button {
        min-height: 42px;
        border-radius: 6px;
        font: inherit;
      }

      input,
      select {
        width: 100%;
        border: 1px solid var(--border);
        padding: 8px 10px;
        background: #ffffff;
        color: var(--text);
      }

      button {
        border: 1px solid var(--accent);
        background: var(--accent);
        color: white;
        font-weight: 700;
        cursor: pointer;
      }

      button:hover {
        filter: brightness(0.95);
      }

      [role="alert"] {
        min-height: 24px;
        font-weight: 700;
      }

      .alert-success {
        color: var(--success);
      }

      .alert-error,
      .error {
        color: var(--danger);
      }

      .error {
        min-height: 20px;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .stack {
        display: grid;
        gap: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.94rem;
      }

      th,
      td {
        border-bottom: 1px solid var(--border);
        padding: 10px 8px;
        text-align: left;
        vertical-align: top;
      }

      th {
        color: var(--muted);
        font-size: 0.8rem;
        text-transform: uppercase;
      }

      .status {
        display: inline-block;
        border-radius: 999px;
        padding: 2px 8px;
        background: var(--surface-strong);
        font-size: 0.85rem;
        font-weight: 700;
      }

      .empty {
        margin-top: 8px;
        padding: 16px;
        border: 1px dashed var(--border);
        border-radius: 8px;
        color: var(--muted);
        background: #fbfcfd;
      }

      @media (max-width: 820px) {
        main {
          width: min(100vw - 24px, 680px);
          padding-top: 20px;
        }

        .layout {
          grid-template-columns: 1fr;
        }

        table {
          font-size: 0.88rem;
        }

        th,
        td {
          padding: 8px 6px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Workflow Evidence</h1>
        <p>Record validation artifacts and inspect required coverage categories.</p>
      </header>

      <div class="layout">
        <section class="panel" aria-labelledby="form-heading">
          <h2 id="form-heading">Create Evidence</h2>
          <form id="evidence-form" novalidate>
            <label for="title">
              Title
              <input id="title" name="title" type="text" autocomplete="off" />
              <span class="error" id="title-error"></span>
            </label>

            <label for="category">
              Category
              <select id="category" name="category">
                <option value="">Select category</option>
                <option value="unit">unit</option>
                <option value="integration">integration</option>
                <option value="database">database</option>
                <option value="playwright">playwright</option>
                <option value="telemetry">telemetry</option>
              </select>
              <span class="error" id="category-error"></span>
            </label>

            <label for="status">
              Status
              <select id="status" name="status">
                <option value="">Select status</option>
                <option value="passing">passing</option>
                <option value="failing">failing</option>
              </select>
              <span class="error" id="status-error"></span>
            </label>

            <button type="submit">Save Evidence</button>
            <div id="form-alert" role="alert" aria-live="polite"></div>
          </form>
        </section>

        <div class="stack">
          <section class="panel" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Required Categories</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Coverage</th>
                  <th>Latest</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody id="category-summary"></tbody>
            </table>
          </section>

          <section class="panel" aria-labelledby="records-heading">
            <h2 id="records-heading">Evidence Records</h2>
            <div id="empty-state" class="empty">No evidence has been recorded yet.</div>
            <table aria-label="Evidence records">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody id="evidence-records"></tbody>
            </table>
          </section>
        </div>
      </div>
    </main>

    <script type="module">
      const form = document.querySelector("#evidence-form");
      const alert = document.querySelector("#form-alert");
      const emptyState = document.querySelector("#empty-state");
      const recordsBody = document.querySelector("#evidence-records");
      const summaryBody = document.querySelector("#category-summary");
      const fields = {
        title: document.querySelector("#title"),
        category: document.querySelector("#category"),
        status: document.querySelector("#status")
      };
      const errors = {
        title: document.querySelector("#title-error"),
        category: document.querySelector("#category-error"),
        status: document.querySelector("#status-error")
      };

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
      }

      function setAlert(message, kind) {
        alert.textContent = message;
        alert.className = kind === "success" ? "alert-success" : "alert-error";
      }

      function clearErrors() {
        for (const key of Object.keys(errors)) {
          errors[key].textContent = "";
        }
      }

      function renderEvidence(state) {
        emptyState.hidden = state.records.length > 0;
        recordsBody.innerHTML = state.records
          .map(
            (record) => \`
              <tr>
                <td>\${escapeHtml(record.title)}</td>
                <td>\${escapeHtml(record.category)}</td>
                <td><span class="status">\${escapeHtml(record.status)}</span></td>
                <td>\${escapeHtml(record.createdAt)}</td>
              </tr>
            \`
          )
          .join("");

        summaryBody.innerHTML = state.categorySummary
          .map(
            (summary) => \`
              <tr data-testid="category-summary-\${escapeHtml(summary.category)}">
                <td>\${escapeHtml(summary.category)}</td>
                <td>\${summary.represented ? "represented" : "missing"}</td>
                <td>\${escapeHtml(summary.latestStatus)}</td>
                <td>\${escapeHtml(summary.count)}</td>
              </tr>
            \`
          )
          .join("");
      }

      async function loadEvidence() {
        const response = await fetch("/api/evidence");
        renderEvidence(await response.json());
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearErrors();
        setAlert("", "success");

        const response = await fetch("/api/evidence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: fields.title.value,
            category: fields.category.value,
            status: fields.status.value
          })
        });
        const body = await response.json();

        if (body.ok) {
          setAlert("Evidence saved.", "success");
          form.reset();
          await loadEvidence();
          return;
        }

        if (body.reason === "validation") {
          for (const [field, message] of Object.entries(body.errors)) {
            errors[field].textContent = message;
          }
          setAlert("Please fix the evidence fields.", "error");
          return;
        }

        setAlert(body.message || "Unable to save evidence. Please retry.", "error");
      });

      await loadEvidence();
    </script>
  </body>
</html>`;
}
