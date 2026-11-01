import { useEffect, useState, type FormEvent, type ReactElement } from "react";

type EvidenceCategory = "unit" | "integration" | "database" | "playwright" | "telemetry";
type EvidenceStatus = "passing" | "failing";

type EvidenceRecord = {
  id: string;
  title: string;
  category: EvidenceCategory;
  status: EvidenceStatus;
  createdAt: string;
};

type EvidenceCategorySummary = {
  category: EvidenceCategory;
  represented: boolean;
  latestStatus: EvidenceStatus | "missing";
  count: number;
};

type EvidenceState = {
  records: EvidenceRecord[];
  categorySummary: EvidenceCategorySummary[];
};

type ValidationErrors = Partial<Record<"title" | "category" | "status", string>>;

const evidenceApiPath = "/api/evidence";

const emptyState: EvidenceState = {
  records: [],
  categorySummary: []
};

async function loadEvidence(): Promise<EvidenceState> {
  const response = await fetch(evidenceApiPath);

  if (!response.ok) {
    throw new Error("Unable to load evidence.");
  }

  return (await response.json()) as EvidenceState;
}

async function createEvidence(input: {
  title: string;
  category: string;
  status: string;
}): Promise<
  | { ok: true; record: EvidenceRecord }
  | { ok: false; reason: "validation"; errors: ValidationErrors }
  | { ok: false; reason: "persistence"; message: string }
> {
  const response = await fetch(evidenceApiPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  return await response.json();
}

export function EvidenceDashboard(): ReactElement {
  const [evidence, setEvidence] = useState<EvidenceState>(emptyState);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [alert, setAlert] = useState<{ kind: "success" | "error"; message: string }>({
    kind: "success",
    message: ""
  });

  useEffect(() => {
    void loadEvidence()
      .then(setEvidence)
      .catch((error: unknown) => {
        setAlert({
          kind: "error",
          message: error instanceof Error ? error.message : "Unable to load evidence."
        });
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setAlert({ kind: "success", message: "" });

    const result = await createEvidence({ title, category, status });

    if (result.ok) {
      setAlert({ kind: "success", message: "Evidence saved." });
      setTitle("");
      setCategory("");
      setStatus("");
      setEvidence(await loadEvidence());
      return;
    }

    if (result.reason === "validation") {
      setErrors(result.errors);
      setAlert({ kind: "error", message: "Please fix the evidence fields." });
      return;
    }

    setAlert({ kind: "error", message: result.message });
  }

  return (
    <main>
      <header>
        <h1>Workflow Evidence</h1>
        <p>Record validation artifacts and inspect required coverage categories.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="title">
          Title
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <span className="error">{errors.title}</span>
        </label>

        <label htmlFor="category">
          Category
          <select
            id="category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value)}
          >
            <option value="">Select category</option>
            <option value="unit">unit</option>
            <option value="integration">integration</option>
            <option value="database">database</option>
            <option value="playwright">playwright</option>
            <option value="telemetry">telemetry</option>
          </select>
          <span className="error">{errors.category}</span>
        </label>

        <label htmlFor="status">
          Status
          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value)}
          >
            <option value="">Select status</option>
            <option value="passing">passing</option>
            <option value="failing">failing</option>
          </select>
          <span className="error">{errors.status}</span>
        </label>

        <button type="submit">Save Evidence</button>
        <div className={`alert-${alert.kind}`} role="alert" aria-live="polite">
          {alert.message}
        </div>
      </form>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading">Required Categories</h2>
        <table>
          <tbody>
            {evidence.categorySummary.map((summary) => (
              <tr key={summary.category} data-testid={`category-summary-${summary.category}`}>
                <td>{summary.category}</td>
                <td>{summary.represented ? "represented" : "missing"}</td>
                <td>{summary.latestStatus}</td>
                <td>{summary.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="records-heading">
        <h2 id="records-heading">Evidence Records</h2>
        {evidence.records.length === 0 ? <p>No evidence has been recorded yet.</p> : null}
        <table aria-label="Evidence records">
          <tbody>
            {evidence.records.map((record) => (
              <tr key={record.id}>
                <td>{record.title}</td>
                <td>{record.category}</td>
                <td>{record.status}</td>
                <td>{record.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
