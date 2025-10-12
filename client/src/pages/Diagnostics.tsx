
import { useEffect, useState } from "react";
import { asset } from "@/utils/asset";

type Row = { label: string; value: string | null };

export default function Diagnostics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Test with your actual PDF paths
  const pdfUrl = asset("/api/publications/hybrid-urbanism.pdf");

  async function testOnce() {
    setIsLoading(true);
    const out: Row[] = [];

    // 1) HEAD request (origin must allow it)
    try {
      const headRes = await fetch(pdfUrl, { method: "HEAD", mode: "cors" });
      out.push({ label: "HEAD status", value: String(headRes.status) });
      out.push({ label: "HEAD Accept-Ranges", value: headRes.headers.get("accept-ranges") });
      out.push({ label: "HEAD Content-Type", value: headRes.headers.get("content-type") });
      out.push({ label: "HEAD Content-Length", value: headRes.headers.get("content-length") });
      out.push({ label: "HEAD Content-Range", value: headRes.headers.get("content-range") });
      out.push({ label: "HEAD Content-Encoding", value: headRes.headers.get("content-encoding") });
      out.push({ label: "HEAD Access-Control-Expose-Headers", value: headRes.headers.get("access-control-expose-headers") });
    } catch (e: any) {
      out.push({ label: "HEAD error", value: e?.message ?? "failed" });
    }

    // 2) Range GET (the critical one — must be 206 and expose headers)
    try {
      const rangeRes = await fetch(pdfUrl, {
        method: "GET",
        mode: "cors",
        headers: { Range: "bytes=0-999" },
      });
      out.push({ label: "RANGE status", value: String(rangeRes.status) }); // should be 206
      out.push({ label: "RANGE Accept-Ranges", value: rangeRes.headers.get("accept-ranges") });
      out.push({ label: "RANGE Content-Range", value: rangeRes.headers.get("content-range") });
      out.push({ label: "RANGE Content-Length", value: rangeRes.headers.get("content-length") });
      out.push({ label: "RANGE Content-Type", value: rangeRes.headers.get("content-type") });
      out.push({ label: "RANGE Content-Encoding", value: rangeRes.headers.get("content-encoding") });
      out.push({ label: "RANGE Access-Control-Expose-Headers", value: rangeRes.headers.get("access-control-expose-headers") });
      // drain body so some CDNs don't complain
      await rangeRes.arrayBuffer();
    } catch (e: any) {
      out.push({ label: "RANGE error", value: e?.message ?? "failed" });
    }

    // 3) Worker load (same-origin check)
    try {
      const w = await fetch("/pdfjs/build/pdf.worker.min.mjs", { method: "GET" });
      out.push({ label: "Worker status (/pdfjs/build/pdf.worker.min.mjs)", value: String(w.status) });
      out.push({ label: "Worker Content-Type", value: w.headers.get("content-type") });
    } catch (e: any) {
      out.push({ label: "Worker error", value: e?.message ?? "failed" });
    }

    // 4) Test sessionStorage (to verify page refresh issues)
    try {
      sessionStorage.setItem("diagnostics-test", "working");
      const val = sessionStorage.getItem("diagnostics-test");
      out.push({ label: "SessionStorage test", value: val || "failed" });
      sessionStorage.removeItem("diagnostics-test");
    } catch (e: any) {
      out.push({ label: "SessionStorage error", value: e?.message ?? "failed" });
    }

    setRows(out);
    setIsLoading(false);
  }

  useEffect(() => {
    testOnce();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Mobile PDF Diagnostics</h1>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
          <p className="text-sm mb-2"><strong>UserAgent:</strong></p>
          <p className="text-xs text-white/70 break-all">{navigator.userAgent}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
          <p className="text-sm mb-2"><strong>PDF URL:</strong></p>
          <p className="text-xs text-white/70 break-all">{pdfUrl}</p>
        </div>

        <button
          onClick={testOnce}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors mb-6 font-medium"
        >
          {isLoading ? "Running tests..." : "Re-run tests"}
        </button>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {rows.length === 0 ? (
            <p className="text-white/60">Running diagnostics...</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <li key={i} className="flex flex-col sm:flex-row gap-2 py-2 border-b border-white/10">
                  <strong className="text-blue-300 min-w-[200px]">{r.label}:</strong>
                  <span className={`${
                    r.value === null || r.value === 'null' 
                      ? 'text-red-400' 
                      : r.label.includes('status') && r.value !== '206' && r.label.includes('RANGE')
                      ? 'text-yellow-400'
                      : 'text-white/90'
                  } break-all`}>
                    {String(r.value) || 'null'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-green-300">Expected Values</h2>
          <ul className="space-y-2 text-sm text-white/80">
            <li><strong>RANGE status:</strong> 206 (Partial Content)</li>
            <li><strong>Accept-Ranges:</strong> bytes</li>
            <li><strong>Content-Range:</strong> present (e.g., "bytes 0-999/12345")</li>
            <li><strong>Content-Type:</strong> application/pdf</li>
            <li><strong>Content-Encoding:</strong> null (no compression)</li>
            <li><strong>Access-Control-Expose-Headers:</strong> should include Content-Length, Content-Range, Accept-Ranges</li>
            <li><strong>Worker status:</strong> 200</li>
            <li><strong>SessionStorage:</strong> working</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
