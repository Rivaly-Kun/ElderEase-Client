import React from "react";
import { Bell } from "lucide-react";

const EventsSection = ({
  eventsLoading,
  eventAttendanceLoading,
  events,
  eventAttendance,
  eventStatusFilter,
  onStatusFilterChange,
  eventSearchQuery,
  onSearchQueryChange,
  statusFilters,
  getEventStatus,
  getStatusBadge,
  onViewDetails,
  onNavigateDashboard,
}) => {
  if (eventsLoading || eventAttendanceLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No Events Found
        </h3>
        <p className="text-gray-600 mb-6">
          There are no events scheduled at the moment. Check back later!
        </p>
        {onNavigateDashboard && (
          <button
            onClick={onNavigateDashboard}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    );
  }

  const filteredEvents = events
    .map((event) => {
      const status = getEventStatus(event.date, event.time);
      const badge = getStatusBadge(status);
      const attendance = eventAttendance[event.id];
      return { event, status, badge, attendance };
    })
    .filter(({ event, status, attendance }) => {
      const searchLower = eventSearchQuery.toLowerCase();
      const matchesSearch =
        searchLower === "" ||
        (event.title && event.title.toLowerCase().includes(searchLower)) ||
        (event.description &&
          event.description.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower));

      if (!matchesSearch) {
        return false;
      }

      if (eventStatusFilter === "all") {
        return true;
      }

      if (eventStatusFilter === "attended") {
        return !!attendance?.lastCheckedInAt;
      }

      if (eventStatusFilter === "not-attended") {
        return !attendance?.lastCheckedInAt;
      }

      return status === eventStatusFilter;
    });

  const noResults =
    filteredEvents.length === 0 &&
    (eventStatusFilter !== "all" || eventSearchQuery !== "");

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl shadow-md border border-purple-100 p-8">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              📅 Search & Filter Events
            </h3>
            <p className="text-sm text-gray-600">
              Find events by search or status to stay updated with community
              activities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <label
                htmlFor="event-search"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Search Events
              </label>
              <div className="relative">
                <input
                  id="event-search"
                  type="text"
                  placeholder="Try 'health', 'celebration', 'barangay'..."
                  value={eventSearchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  className="w-full px-5 py-3 pl-12 border-2 border-gray-300 rounded-xl bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 shadow-sm hover:border-gray-400"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  🔎
                </div>
              </div>
              {eventSearchQuery && (
                <button
                  onClick={() => onSearchQueryChange("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 pt-4 transition"
                >
                  ✕
                </button>
              )}
            </div>
            <div>
              <label
                htmlFor="event-status-filter"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                📊 Filter by Status
              </label>
              <div className="relative">
                <select
                  id="event-status-filter"
                  value={eventStatusFilter}
                  onChange={(event) => onStatusFilterChange(event.target.value)}
                  className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                >
                  {statusFilters.map((filterOption) => (
                    <option key={filterOption.value} value={filterOption.value}>
                      {filterOption.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-purple-600"
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
          {(eventSearchQuery || eventStatusFilter !== "all") && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-purple-200">
              <span className="text-sm font-medium text-gray-600">
                Active Filters:
              </span>
              {eventSearchQuery && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  🔍 "{eventSearchQuery}"
                  <button
                    onClick={() => onSearchQueryChange("")}
                    className="hover:text-purple-900 ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}
              {eventStatusFilter !== "all" && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  📊{" "}
                  {statusFilters.find(
                    (filter) => filter.value === eventStatusFilter
                  )?.label || eventStatusFilter}
                  <button
                    onClick={() => onStatusFilterChange("all")}
                    className="hover:text-blue-900 ml-1"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(({ event, status, badge, attendance }) => (
          <div
            key={event.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}
                >
                  {badge.icon} {badge.label}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    attendance?.lastCheckedInAt
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {attendance?.lastCheckedInAt
                    ? "✓ Attended"
                    : "○ Not Attended"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                {event.title || "Untitled Event"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {event.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Description
                  </p>
                  <p className="text-gray-700 line-clamp-2">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    📅 Date
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {event.date
                      ? new Date(event.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    🕐 Time
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {event.time || "—"}
                  </p>
                </div>
              </div>

              {event.location && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    📍 Location
                  </p>
                  <p className="text-gray-700">{event.location}</p>
                </div>
              )}

              {event.createdBy && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    👤 Organized by
                  </p>
                  <p className="text-gray-700">{event.createdBy}</p>
                </div>
              )}

              {attendance?.lastCheckedInAt && (
                <div className="pt-3 border-t border-gray-200 bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-2">
                    ✓ Checked In
                  </p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {attendance.displayName}
                    </p>
                    <p>
                      <span className="font-semibold">Method:</span>{" "}
                      {attendance.method === "qr"
                        ? "QR Code Scan"
                        : "Manual Check-in"}
                    </p>
                    <p>
                      <span className="font-semibold">First Check-in:</span>{" "}
                      {new Date(attendance.firstCheckedInAt).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold">Last Check-in:</span>{" "}
                      {new Date(attendance.lastCheckedInAt).toLocaleString()}
                    </p>
                    {attendance.checkedInBy && (
                      <p>
                        <span className="font-semibold">Verified by:</span>{" "}
                        {attendance.checkedInBy}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => onViewDetails({ event, attendance, status })}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  attendance?.lastCheckedInAt
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : status === "past"
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {attendance?.lastCheckedInAt
                  ? "✓ Checked In - View Details"
                  : "📋 View Details"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {noResults && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
          <p className="text-yellow-800 font-medium">
            {eventSearchQuery
              ? `No events found matching "${eventSearchQuery}".`
              : `No ${eventStatusFilter} events found.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default EventsSection;
