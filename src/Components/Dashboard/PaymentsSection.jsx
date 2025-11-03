import React from "react";
import { CreditCard } from "lucide-react";

const PaymentsSection = ({
  paymentsLoading,
  payments,
  paymentFilters,
  onFilterChange,
  onResetFilters,
  filtersApplied,
  availablePaymentModes,
  filteredPayments,
  decoratedPayments,
  totalFilteredAmount,
  nextPaymentDate,
  onOpenReceipt,
  onNavigateDashboard,
}) => {
  if (paymentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No Payments Yet
        </h3>
        <p className="text-gray-600 mb-6">
          You don't have any payment records yet. When you make a payment, it
          will appear here.
        </p>
        <button
          onClick={onNavigateDashboard}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl shadow-md border-2 border-blue-100 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              💳 Payment History
            </h3>
            <p className="text-base text-gray-700 leading-relaxed">
              View and filter your payments by date range or payment method
            </p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            disabled={!filtersApplied}
            className="px-8 py-3 rounded-xl border-2 border-blue-300 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white whitespace-nowrap shadow-sm hover:shadow-md"
          >
            🔄 Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              📅 From Date
            </label>
            <input
              type="date"
              value={paymentFilters.startDate}
              onChange={(event) =>
                onFilterChange("startDate", event.target.value)
              }
              className="w-full border-2 border-gray-300 rounded-xl px-5 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              📅 To Date
            </label>
            <input
              type="date"
              value={paymentFilters.endDate}
              onChange={(event) =>
                onFilterChange("endDate", event.target.value)
              }
              className="w-full border-2 border-gray-300 rounded-xl px-5 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              💰 Payment Method
            </label>
            <div className="relative">
              <select
                value={paymentFilters.mode}
                onChange={(event) => onFilterChange("mode", event.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-3 pr-12 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                {availablePaymentModes.map((mode) => (
                  <option key={mode} value={mode.toLowerCase()}>
                    {mode}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {filtersApplied && (
          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-5 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-blue-700 uppercase">
                🔎 Active Filters:
              </span>
              {paymentFilters.startDate && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-full font-semibold border-2 border-blue-300">
                  From:{" "}
                  {new Date(paymentFilters.startDate).toLocaleDateString()}
                </span>
              )}
              {paymentFilters.endDate && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-full font-semibold border-2 border-blue-300">
                  To: {new Date(paymentFilters.endDate).toLocaleDateString()}
                </span>
              )}
              {paymentFilters.mode !== "all" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-full font-semibold border-2 border-blue-300">
                  Method:{" "}
                  {paymentFilters.mode.charAt(0).toUpperCase() +
                    paymentFilters.mode.slice(1)}
                </span>
              )}
              <span className="text-base font-bold text-blue-700">
                Showing {filteredPayments.length} of {decoratedPayments.length}{" "}
                records
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Total Payments
          </h3>
          <p className="text-4xl font-bold text-gray-800">
            {filteredPayments.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {filtersApplied
              ? "Matches current filters"
              : "All recorded payments"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Total Amount
          </h3>
          <p className="text-4xl font-bold text-green-600">
            ₱{totalFilteredAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Includes payments in the view above.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Next Payment Due
          </h3>
          <p className="text-lg font-bold text-gray-800">
            {nextPaymentDate
              ? nextPaymentDate.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Awaiting first payment"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {decoratedPayments.length
              ? "Estimated from your latest payment."
              : "No payment history recorded yet."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
          <p className="text-sm text-gray-500">
            {filtersApplied
              ? `Showing ${filteredPayments.length} of ${decoratedPayments.length} record(s)`
              : `${decoratedPayments.length} total record(s)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Payment Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Mode of Payment
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No payments match your filters yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr
                    key={payment.id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {payment.paymentDate
                        ? payment.paymentDate.toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ₱
                      {parseFloat(
                        payment.amount ?? payment.payAmount ?? 0
                      ).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {payment.payDesc || payment.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {payment.resolvedMode || "Not recorded"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.payment_status === "Paid" ||
                          payment.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : payment.payment_status === "Pending" ||
                              payment.payment_status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : payment.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {payment.payment_status || payment.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        {payment.resolvedReference ? (
                          <span
                            className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded"
                            title={payment.resolvedReference}
                          >
                            {payment.referenceLabel ??
                              payment.resolvedReference}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No reference recorded
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(payment)}
                          className="px-3 py-1 text-xs font-semibold text-purple-600 border border-purple-200 rounded-full hover:bg-purple-50 transition"
                        >
                          View Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsSection;
