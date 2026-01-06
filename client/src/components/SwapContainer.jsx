import React,{ useState } from "react";
import SwapForm from "./SwapForm";
import SwapModal from "./swapModal";
import BalancePanel from "./BalancePanel";
import WalletGenerator from "./walletGenerator";

const SwapContainer = () => {
  const [swapStatus, setSwapStatus] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <WalletGenerator onGenerated={(w) => console.log("Wallet generated:", w)} />
            <BalancePanel />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SwapForm onSwap={setSwapStatus} />
          </div>
        </div>
      </div>

      <SwapModal status={swapStatus} onClose={() => setSwapStatus(null)} />
    </div>
  );
};

export default SwapContainer;
