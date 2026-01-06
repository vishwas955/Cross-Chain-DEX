// BalancePanel.jsx (UI only; same endpoints)
import React, { useState, useCallback } from "react";
import axios from "axios";

const BalancePill = ({ label, value }) => (
  <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    {/* Top row = coin name */}
    <span className="text-sm font-medium text-slate-700">{label}</span>

    {/* Bottom row = value (scrollable if too long) */}
    <span
      className="mt-1 w-full font-mono text-sm tabular-nums text-slate-900 
                 whitespace-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300"
      title={value}  // Tooltip shows full value
    >
      {value}
    </span>
  </div>
);

const BalancePanel = ({ userId = 1 }) => {
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setErr(null);
      const [evmRes, btcRes] = await Promise.all([
        axios.get("http://localhost:5000/api/swap/get-evm-bal", { params: { userId } }),
        axios.get("http://localhost:5000/api/swap/get-btc-bal", { params: { userId } }),
      ]);
      const evm = evmRes?.data || {};
      const btc = btcRes?.data || {};
      setBalances({ ETH: evm.ETH ?? 0, USDT: evm.USDT ?? 0, USDC: evm.USDC ?? 0, BTC: btc.BTC ?? 0 });
    } catch {
      setErr("Failed to fetch balances");
    } finally { setLoading(false); }
  }, [userId]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h3 className="text-base font-semibold text-slate-900">Balances</h3>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Fetching..." : "Fetch Balances"}
          </button>
          {err && <div className="text-sm font-medium text-rose-600">{err}</div>}
        </div>

        {!balances && !loading && !err && (
          <p className="m-0 text-sm text-slate-500">Click Fetch Balances to load current funds.</p>
        )}

        {balances && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <BalancePill label="BTC" value={balances.BTC} />
            <BalancePill label="ETH" value={balances.ETH} />
            <BalancePill label="USDT" value={balances.USDT} />
            <BalancePill label="USDC" value={balances.USDC} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BalancePanel;
