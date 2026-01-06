import React, { useState } from "react";
import axios from "axios";

const SwapForm = ({ onSwap }) => {
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [txHash, setTxHash] = useState(null);

  const handleSwap = async () => {
    if (!amount || fromToken === toToken) {
      alert("Enter valid amount and tokens.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/swap/execute", {
        fromToken: fromToken,
        toToken: toToken,
        amount: amount,
        userId: 1,
      });

      if (!res || !res.data || res.data.status !== "completed") {
        alert("Transaction failed");
        setLoading(false);
        return;
      }

      if (res.data.txHash) {
        const protocol = res.data.protocol;
        const txHash = res.data.txHash;
        setTxHash(txHash);
        alert(
          `Swap Successful! Protocol: ${protocol}, Transaction Hash : ${txHash}`
        );
      } else if (res.data.txid) {
        const protocol = res.data.protocol;
        const txid = res.data.txid;
        setTxHash(txid);
        alert(
          `Swap Successful! Protocol: ${protocol}, Transaction ID : ${txid}`
        );
      }

      onSwap({
        message: "Swap Successful!",
        txHash: res.data.txHash || res.data.txid,
      });
    } catch (err) {
      onSwap({
        message: "Swap Failed",
        txHash: null,
      });
      throw new Error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Swap</h2>
      <div className="mb-4">
        <label className="block text-gray-700">From</label>
        <select
          value={fromToken}
          onChange={(e) => setFromToken(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-2"
        >
          <option>ETH</option>
          <option>USDC</option>
          <option>USDT</option>
          <option>BTC</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">To</label>
        <select
          value={toToken}
          onChange={(e) => setToToken(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-2"
        >
          <option>ETH</option>
          <option>USDC</option>
          <option>USDT</option>
          <option>BTC</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-2"
          placeholder="Enter amount"
        />
      </div>

      <button
        onClick={handleSwap}
        disabled={loading}
        className={`bg-indigo-600 text-white px-4 py-2 rounded w-full hover:bg-indigo-700 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Swap"}
      </button>

      {txHash && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <p className="mb-2 text-sm">Transaction Hash:</p>
          <p className="text-xs break-words">{txHash}</p>
        </div>
      )}
    </div>
  );
};

export default SwapForm;
