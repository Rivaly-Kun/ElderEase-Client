import React from "react";
import { X } from "lucide-react";

const EventDetailsModal = ({ visible, details, onClose }) => {
  if (!visible || !details) {
    return null;
  }

  const { event, status, attendance } = details;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8">
        <div className="px-8 py-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 sticky top-0 z-10 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-1">Event Details</h2>
              <p className="text-purple-100 text-base">{event.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition text-white"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[calc(100vh-250px)] overflow-y-auto space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            {status === "past" && (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                📅 Past Event
              </span>
            )}
            {status === "present" && (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                🎯 Today
              </span>
            )}
            {status === "upcoming" && (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                ⏰ Upcoming
              </span>
            )}
            {status === "future" && (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                🔮 Future Event
              </span>
            )}
            {attendance?.lastCheckedInAt && (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                ✓ Checked In
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>

            {event.description && (
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">
                  Description
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-200">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                  📅 Date
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {event.date
                    ? new Date(event.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                  🕐 Time
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {event.time || "—"}
                </p>
              </div>
            </div>

            {event.location && (
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                  📍 Location
                </p>
                <p className="text-gray-700">{event.location}</p>
              </div>
            )}

            {event.createdBy && (
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                  👤 Organized by
                </p>
                <p className="text-gray-700">{event.createdBy}</p>
              </div>
            )}
          </div>

          {attendance?.lastCheckedInAt ? (
            <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 space-y-4">
              <h4 className="text-xl font-bold text-green-900">
                ✓ Your Attendance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">
                    Name
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {attendance.displayName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">
                    Check-in Method
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {attendance.method === "qr"
                      ? "QR Code Scan"
                      : "Manual Check-in"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">
                    First Check-in
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(attendance.firstCheckedInAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">
                    Last Check-in
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(attendance.lastCheckedInAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {attendance.checkedInBy && (
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">
                    Verified by
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {attendance.checkedInBy}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
              <p className="text-blue-900 font-medium">
                ℹ️ You have not checked in for this event yet.
              </p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3 sticky bottom-0 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 min-w-[150px] px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
