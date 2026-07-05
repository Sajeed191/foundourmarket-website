/**
 * rAF INSTRUMENTATION — debugging experiment only.
 *
 * Wraps window.requestAnimationFrame to attribute every scheduled callback to
 * the application file/function that scheduled it, count executions, and detect
 * continuous loops (a callback that schedules another rAF from within itself).
 *
 * Does NOT change behavior: the original rAF is still called, callbacks run
 * unmodified, nothing is throttled or disabled. After 5 seconds it prints a
 * summary grouped by source file.
 *
 * Enable by importing this module (side-effect import) from __root.tsx.
 */

type SourceStat = {
  source: string;
  fnName: string;
  scheduled: number; // times a callback was scheduled from this source
  executed: number; // times a callback from this source ran
  continuous: boolean; // a callback rescheduled rAF while executing
  sampleStack: string;
};

declare global {
  interface Window {
    __rafInstrumented?: boolean;
  }
}

function parseStack(): { source: string; fnName: string; sample: string } {
  const err = new Error();
  const lines = (err.stack ?? "").split("\n").slice(1);
  let sample = "";
  for (const raw of lines) {
    const line = raw.trim();
    // Skip our own instrumentation frames.
    if (line.includes("raf-instrument")) continue;
    if (line.includes("requestAnimationFrame")) continue;
    // First meaningful APPLICATION frame: from /src/ and not node_modules.
    if (
      (line.includes("/src/") || line.includes("/@fs/")) &&
      !line.includes("node_modules")
    ) {
      sample = line;
      break;
    }
    if (!sample && line.startsWith("at ")) sample = line;
  }
  // Extract "at fnName (url:line:col)" or "at url:line:col".
  let fnName = "(anonymous)";
  let url = sample;
  const m = sample.match(/^at\s+(.+?)\s+\((.+)\)$/);
  if (m) {
    fnName = m[1];
    url = m[2];
  } else {
    const m2 = sample.match(/^at\s+(.+)$/);
    if (m2) url = m2[1];
  }
  // Reduce url to a src-relative file path.
  let source = url;
  const srcIdx = url.indexOf("/src/");
  if (srcIdx >= 0) {
    source = url.slice(srcIdx + 1); // drop leading slash → "src/..."
    source = source.replace(/\?.*$/, "").replace(/:\d+:\d+$/, "");
  } else {
    source = url.replace(/\?.*$/, "").replace(/:\d+:\d+$/, "");
    if (source.includes("node_modules")) {
      source = "node_modules/" + (source.split("node_modules/")[1] ?? source);
    }
  }
  return { source, fnName, sample };
}

export function installRafInstrumentation() {
  if (typeof window === "undefined" || window.__rafInstrumented) return;
  window.__rafInstrumented = true;

  const stats = new Map<string, SourceStat>();
  const origRaf = window.requestAnimationFrame.bind(window);

  // Tracks the source currently executing, so a reschedule inside a callback
  // can be flagged as a continuous loop.
  let executingSource: string | null = null;

  window.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
    const { source, fnName, sample } = parseStack();
    const key = source + "::" + fnName;
    let stat = stats.get(key);
    if (!stat) {
      stat = {
        source,
        fnName,
        scheduled: 0,
        executed: 0,
        continuous: false,
        sampleStack: sample,
      };
      stats.set(key, stat);
    }
    stat.scheduled++;

    // If this schedule happened while a callback from the SAME source was
    // executing, it's a self-perpetuating (continuous) loop.
    if (executingSource === key) {
      stat.continuous = true;
    }

    const wrapped: FrameRequestCallback = (t) => {
      const prev = executingSource;
      executingSource = key;
      stat!.executed++;
      try {
        cb(t);
      } finally {
        executingSource = prev;
      }
    };
    return origRaf(wrapped);
  }) as typeof window.requestAnimationFrame;

  // eslint-disable-next-line no-console
  console.log("[raf-instrument] installed — collecting for 5s…");

  window.setTimeout(() => {
    // Group by source file.
    const byFile = new Map<
      string,
      { callbacks: number; continuous: boolean; fns: Set<string> }
    >();
    for (const s of stats.values()) {
      let g = byFile.get(s.source);
      if (!g) {
        g = { callbacks: 0, continuous: false, fns: new Set() };
        byFile.set(s.source, g);
      }
      g.callbacks += s.executed;
      g.continuous = g.continuous || s.continuous;
      g.fns.add(s.fnName);
    }

    const rows = Array.from(byFile.entries()).sort(
      (a, b) => b[1].callbacks - a[1].callbacks,
    );

    const out: string[] = [];
    out.push("========== rAF SUMMARY (5s) ==========");
    for (const [file, g] of rows) {
      out.push(file);
      out.push(`  callbacks: ${g.callbacks}`);
      out.push(`  continuous loop: ${g.continuous ? "yes" : "no"}`);
      out.push(`  functions: ${Array.from(g.fns).join(", ")}`);
    }
    out.push("======================================");
    const loops = rows.filter(([, g]) => g.continuous).map(([f]) => f);
    out.push(
      "Files with continuous rAF loops: " +
        (loops.length ? loops.join(", ") : "(none)"),
    );
    // eslint-disable-next-line no-console
    console.log(out.join("\n"));
    // Expose for programmatic reads.
    (window as any).__rafSummary = { rows, loops };
  }, 5000);
}
