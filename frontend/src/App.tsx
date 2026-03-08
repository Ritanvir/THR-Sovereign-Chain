import { useState } from "react";

type AnchorResponse = {
  success?: boolean;
  anchorId?: string;
  documentHash?: string;
  recordRefHash?: string;
  txHash?: string;
  blockNumber?: number;
  error?: string;
};

type VerifyResponse = {
  success?: boolean;
  anchorId?: string;
  computedHash?: string;
  onChainHash?: string;
  isValid?: boolean;
  timestamp?: string;
  submittedBy?: string;
  recordRefHash?: string;
  eventType?: string;
  error?: string;
};

function App() {
  const [anchorFile, setAnchorFile] = useState<File | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [recordReference, setRecordReference] = useState("");
  const [eventType, setEventType] = useState("registration");
  const [anchorId, setAnchorId] = useState("");
  const [anchorResult, setAnchorResult] = useState<AnchorResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnchor = async () => {
    if (!anchorFile) {
      alert("Please select a file to anchor");
      return;
    }

    const formData = new FormData();
    formData.append("document", anchorFile);
    formData.append("recordReference", recordReference);
    formData.append("eventType", eventType);

    setLoading(true);
    setAnchorResult(null);

    try {
      const response = await fetch("http://localhost:5000/anchor-file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setAnchorResult(data);

      if (data.anchorId) {
        setAnchorId(data.anchorId);
      }
    } catch (error) {
      setAnchorResult({ error: "Failed to anchor file" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyFile) {
      alert("Please select a file to verify");
      return;
    }

    const formData = new FormData();
    formData.append("document", verifyFile);
    formData.append("anchorId", anchorId);

    setLoading(true);
    setVerifyResult(null);

    try {
      const response = await fetch("http://localhost:5000/verify-file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setVerifyResult(data);
    } catch (error) {
      setVerifyResult({ error: "Failed to verify file" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>THR Integrity Layer Demo</h1>
      <p>
        Upload a document, anchor its SHA-256 hash on the blockchain, then verify
        the file later.
      </p>

      <div style={{ border: "1px solid #ddd", padding: 20, marginBottom: 20 }}>
        <h2>Anchor Document</h2>

        <input
          type="file"
          onChange={(e) => setAnchorFile(e.target.files?.[0] || null)}
        />
        <br />
        <br />

        <input
          type="text"
          placeholder="Record Reference (example: THR-2026-0001)"
          value={recordReference}
          onChange={(e) => setRecordReference(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        >
          <option value="registration">Registration</option>
          <option value="transfer">Transfer</option>
          <option value="mortgage">Mortgage</option>
          <option value="encumbrance">Encumbrance</option>
          <option value="mutation">Mutation</option>
        </select>

        <button onClick={handleAnchor} disabled={loading}>
          {loading ? "Processing..." : "Anchor File"}
        </button>

        {anchorResult && (
          <pre style={{ marginTop: 20, background: "#f7f7f7", padding: 12 }}>
            {JSON.stringify(anchorResult, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ border: "1px solid #ddd", padding: 20 }}>
        <h2>Verify Document</h2>

        <input
          type="file"
          onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
        />
        <br />
        <br />

        <input
          type="text"
          placeholder="Anchor ID"
          value={anchorId}
          onChange={(e) => setAnchorId(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <button onClick={handleVerify} disabled={loading}>
          {loading ? "Processing..." : "Verify File"}
        </button>

        {verifyResult && (
          <pre style={{ marginTop: 20, background: "#f7f7f7", padding: 12 }}>
            {JSON.stringify(verifyResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;