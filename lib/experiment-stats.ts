/** Import observations, not a semantic accuracy score or an approved document cache. */
export const EXPERIMENT_KEY = "exam-formatter-experiments-v1";
export interface ImportExperiment {
  id: string;
  capturedAt: string;
  appVersion: string;
  sourceHash: string | null;
  mode: "reviewed-reuse" | "file-text" | "ocr";
  status: "structured" | "needs-review" | "failed" | "cancelled";
  fileType: string;
  fileBytes: number;
  pages: number;
  models: string[];
  durationMs: number;
  questions: number;
  choices: number;
  mediaGroups: number;
  validationIssues: number;
  environment: string;
  semanticAccuracy: null;
}

type StoragePort = Pick<Storage, "getItem" | "setItem">;

function valid(record: ImportExperiment): boolean {
  const fields = ["id","capturedAt","appVersion","sourceHash","mode","status","fileType","fileBytes","pages","models","durationMs","questions","choices","mediaGroups","validationIssues","environment","semanticAccuracy"];
  return Boolean(record && typeof record.id === "string" && typeof record.appVersion === "string" &&
    Object.keys(record).every(key => fields.includes(key)) &&
    typeof record.capturedAt === "string" && Number.isFinite(Date.parse(record.capturedAt)) &&
    (record.sourceHash === null || /^[a-f0-9]{64}$/.test(record.sourceHash)) &&
    ["reviewed-reuse", "file-text", "ocr"].includes(record.mode) &&
    ["structured", "needs-review", "failed", "cancelled"].includes(record.status) &&
    typeof record.fileType === "string" && typeof record.environment === "string" &&
    Array.isArray(record.models) && record.models.every(model => typeof model === "string") &&
    record.semanticAccuracy === null &&
    [record.fileBytes, record.pages, record.durationMs, record.questions, record.choices,
      record.mediaGroups, record.validationIssues].every(value => typeof value === "number" && Number.isFinite(value) && value >= 0));
}

export function readExperiments(storage: StoragePort): ImportExperiment[] {
  const raw = storage.getItem(EXPERIMENT_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.runs) || !parsed.runs.every(valid)) {
    throw new Error("ข้อมูลสถิติเดิมไม่ถูกต้อง กรุณาสำรองข้อมูลก่อนแก้ไข");
  }
  return parsed.runs;
}

export function appendExperiment(storage: StoragePort, run: ImportExperiment): void {
  if (!valid(run)) throw new Error("ข้อมูลการทดลองไม่ถูกต้อง");
  const runs = [...readExperiments(storage), run].slice(-200);
  // Only the explicit metadata schema is stored; no raw source, file name or API key.
  storage.setItem(EXPERIMENT_KEY, JSON.stringify({ schemaVersion: 1, runs }));
}

export function experimentReport(runs: ImportExperiment[]) {
  const groups = new Map<string, ImportExperiment[]>();
  for (const run of runs) {
    // Unidentified sources cannot establish a comparable benchmark cohort.
    const key = JSON.stringify([run.sourceHash || run.id, run.mode, run.appVersion,
      [...run.models].sort(), run.pages, run.environment]);
    groups.set(key, [...(groups.get(key) || []), run]);
  }
  return {
    schemaVersion: 1,
    timingBoundary: "handleFileParsed entry to import result; excludes file reading/PDF rendering before callback, manual review and export",
    retention: "latest 200 imports in this browser profile; download to retain/share; not synced across machines",
    interpretation: "structural success is not semantic accuracy; compare identical source/mode/model/app/environment cohorts; cancelled/failed runs excluded from duration medians",
    runs,
    groups: Array.from(groups.values()).map(group => {
      const durations = group.filter(run => run.status === "structured" || run.status === "needs-review")
        .map(run => run.durationMs).sort((a,b) => a-b);
      const middle = Math.floor(durations.length / 2);
      return {
        sourceHash: group[0].sourceHash, mode: group[0].mode, appVersion: group[0].appVersion,
        models: group[0].models, pages: group[0].pages, environment: group[0].environment,
        samples: group.length,
        structured: group.filter(run => run.status === "structured").length,
        needsReview: group.filter(run => run.status === "needs-review").length,
        failed: group.filter(run => run.status === "failed").length,
        cancelled: group.filter(run => run.status === "cancelled").length,
        medianMs: durations.length ? (durations.length % 2 ? durations[middle] : (durations[middle-1]+durations[middle])/2) : null,
        semanticAccuracy: null,
      };
    }),
  };
}
