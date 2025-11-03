import React from "react";
import { X } from "lucide-react";

const PaymentReceiptModal = ({
  visible,
  receipt,
  memberData,
  onClose,
  onDownload,
}) => {
  if (!visible || !receipt) {
    return null;
  }

  const paymentDateLabel = receipt.paymentDate
    ? receipt.paymentDate.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date unavailable";

  const resolvedAmount = parseFloat(
    receipt.amount ?? receipt.payAmount ?? 0
  ).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Payment Receipt
            </h3>
            <p className="text-sm text-gray-500">{paymentDateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <div>
              <span className="block text-xs uppercase text-gray-400">
                Member
              </span>
              <span className="font-semibold text-gray-800">
                {memberData?.firstName} {memberData?.lastName}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase text-gray-400">
                OSCA ID
              </span>
              <span className="font-semibold text-gray-800">
                {memberData?.oscaID}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase text-gray-400">
                Amount Paid
              </span>
              <span className="font-semibold text-gray-800">
                ₱{resolvedAmount}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase text-gray-400">
                Mode of Payment
              </span>
              <span className="font-semibold text-gray-800">
                {receipt.resolvedMode || "Not recorded"}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase text-gray-400">
                Status
              </span>
              <span className="font-semibold text-gray-800">
                {receipt.payment_status || receipt.status || "Unknown"}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase text-gray-400">
                Reference
              </span>
              <span className="font-semibold text-gray-800">
                {receipt.resolvedReference || receipt.id || "—"}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <span className="block text-xs uppercase text-gray-400 mb-1">
              Description
            </span>
            <p>
              {receipt.payDesc ||
                receipt.description ||
                "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onDownload}
              className="flex-1 sm:flex-none px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Download Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
