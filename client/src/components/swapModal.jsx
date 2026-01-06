import React from "react"

const SwapModal = ({ status, onClose }) => {
  if (!status) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-xl font-bold mb-4">Swap Status</h3>
        <p className="mb-2">Status: {status.message}</p>
        {status.txHash && (
          <p className="text-blue-600 break-all">
            Tx Hash: {status.txHash}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default SwapModal