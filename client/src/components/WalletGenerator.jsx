import React, { useState } from "react";
import axios from "axios";

const CopyBtn = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <button
      onClick={onCopy}
      className="ml-2 shrink-0 inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      {copied ? "Copied" : label}
    </button>
  );
};

// ✅ New pill-style box (label on top, value below)
const InfoPill = ({ title, value, danger }) => (
  <div
    className={[
      "flex flex-col rounded-md px-3 py-2 font-mono text-xs text-slate-800 ring-1",
      danger ? "bg-rose-50 ring-rose-200" : "bg-slate-50 ring-slate-200",
    ].join(" ")}
  >
    {/* Label */}
    <span className="mb-1 text-[11px] font-medium text-slate-600">{title}</span>

    {/* Value */}
    <div className="flex items-center justify-between gap-2">
      <span
        className="flex-1 whitespace-nowrap overflow-x-auto text-slate-900"
        title={value}
      >
        {value || "-"}
      </span>
      {value ? <CopyBtn text={value} /> : null}
    </div>
  </div>
);

const ChainBox = ({ name, data }) => (
  <div className="min-w-0 rounded-lg border border-slate-200 p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-emerald-500" />
      <h4 className="m-0 text-sm font-semibold text-slate-800">{name}</h4>
    </div>
    <div className="space-y-3">
      <InfoPill title="Address" value={data?.address} />
      <InfoPill title="Private Key" value={data?.privateKey} danger />
    </div>
  </div>
);

const WalletGenerator = ({ userId = 1, onGenerated }) => {
  const [mnemonic, setMnemonic] = useState(null);
  const [eth, setEth] = useState(null);
  const [btc, setBtc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const generate = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await axios.get("http://localhost:5000/api/swap/generate-wallet", { params: { userId } });
      const data = res?.data || {};
      if (!data?.mnemonic || !data?.ETH || !data?.BTC) {
        setErr("Invalid response from server");
        return;
      }
      setMnemonic(data.mnemonic);
      setEth(data.ETH);
      setBtc(data.BTC);
      onGenerated && onGenerated(data);
    } catch {
      setErr("Failed to generate wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h3 className="text-base font-semibold text-slate-900">Universal Wallet</h3>
        <p className="mt-1 text-xs text-slate-500">
          Mnemonic and chain credentials.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Wallet"}
          </button>
          {err && <div className="text-sm font-medium text-rose-600">{err}</div>}
        </div>

        {mnemonic && (
          <>
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 11.5h-1.5v-5h1.5v5zm0-6.5h-1.5V5.5h1.5V7z" />
              </svg>
              <p className="m-0 text-xs">
                Never share mnemonic or private keys. Store offline securely.
              </p>
            </div>

            <InfoPill title="Mnemonic" value={mnemonic} danger />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ChainBox name="ETH" data={eth} />
              <ChainBox name="BTC" data={btc} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletGenerator;
