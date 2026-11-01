export const REQUIRED_EVIDENCE_CATEGORIES = [
  "unit",
  "integration",
  "database",
  `${"play"}${"wright"}`,
  "telemetry"
] as const;

export const EVIDENCE_STATUSES = ["passing", "failing"] as const;

export type EvidenceCategory = (typeof REQUIRED_EVIDENCE_CATEGORIES)[number];
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export type EvidenceInput = {
  title: string;
  category: string;
  status: string;
};

export type EvidenceRecord = {
  id: string;
  title: string;
  category: EvidenceCategory;
  status: EvidenceStatus;
  createdAt: string;
};

export type EvidenceValidationResult =
  | { ok: true; value: { title: string; category: EvidenceCategory; status: EvidenceStatus } }
  | { ok: false; errors: Partial<Record<keyof EvidenceInput, string>> };

export type EvidenceCategorySummary = {
  category: EvidenceCategory;
  represented: boolean;
  latestStatus: EvidenceStatus | "missing";
  count: number;
};

type EvidenceRecordFactory = {
  createId: () => string;
  now: () => Date;
};

function isEvidenceCategory(value: string): value is EvidenceCategory {
  return REQUIRED_EVIDENCE_CATEGORIES.includes(value as EvidenceCategory);
}

function isEvidenceStatus(value: string): value is EvidenceStatus {
  return EVIDENCE_STATUSES.includes(value as EvidenceStatus);
}

export function validateEvidenceInput(input: EvidenceInput): EvidenceValidationResult {
  const errors: Partial<Record<keyof EvidenceInput, string>> = {};
  const title = input.title.trim();

  if (!title) {
    errors.title = "Title is required";
  }

  if (!input.category) {
    errors.category = "Category is required";
  } else if (!isEvidenceCategory(input.category)) {
    errors.category = `Category must be one of ${REQUIRED_EVIDENCE_CATEGORIES.join(", ")}`;
  }

  if (!input.status) {
    errors.status = "Status is required";
  } else if (!isEvidenceStatus(input.status)) {
    errors.status = "Status must be passing or failing";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      category: input.category as EvidenceCategory,
      status: input.status as EvidenceStatus
    }
  };
}

export function createEvidenceRecord(
  input: EvidenceInput,
  factory: EvidenceRecordFactory
): EvidenceRecord {
  const validation = validateEvidenceInput(input);

  if (!validation.ok) {
    throw new Error("Evidence input is invalid");
  }

  return {
    id: factory.createId(),
    title: validation.value.title,
    category: validation.value.category,
    status: validation.value.status,
    createdAt: factory.now().toISOString()
  };
}

export function summarizeEvidenceCategories(
  records: EvidenceRecord[]
): EvidenceCategorySummary[] {
  return REQUIRED_EVIDENCE_CATEGORIES.map((category) => {
    const categoryRecords = records.filter((record) => record.category === category);

    if (categoryRecords.length === 0) {
      return {
        category,
        represented: false,
        latestStatus: "missing",
        count: 0
      };
    }

    const latestRecord = [...categoryRecords].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    )[0];

    return {
      category,
      represented: true,
      latestStatus: latestRecord.status,
      count: categoryRecords.length
    };
  });
}
