import React, { useState } from "react";
import { X } from "lucide-react";

const NotificationsDropdown = ({
  visible,
  events,
  announcements,
  onClose,
  onNavigate,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(null);
  if (!visible) {
    return null;
  }

  const totalUpdates = events.length + announcements.length;

  return (
    <>
      <div className="mt-4 lg:mt-0 lg:absolute lg:top-full lg:right-8 lg:translate-y-3 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 z-[1000] w-full sm:w-[450px] max-w-[calc(100vw-2rem)] max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              🔔 Notifications
            </h3>
            <p className="text-xs text-gray-500 mt-1">{totalUpdates} updates</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {totalUpdates === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 mb-2">No new updates yet</p>
            <p className="text-xs text-gray-400">
              Check back soon for events and announcements
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.length > 0 && (
              <>
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">
                  📅 New Events ({events.length})
                </p>
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 hover:shadow-md transition cursor-pointer group"
                    onClick={() => {
                      setSelectedItem(event);
                      setItemType("event");
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">📌</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition truncate">
                          {event.title || "Event"}
                        </p>
                        {event.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <p className="text-xs text-purple-600 font-medium mt-2">
                          📅{" "}
                          {event.date
                            ? new Date(event.date).toLocaleDateString()
                            : "Date TBA"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {events.length > 3 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    +{events.length - 3} more event(s)
                  </p>
                )}
              </>
            )}

            {announcements.length > 0 && (
              <>
                <p className="text-xs font-bold text-blue-600 uppercase mb-2 mt-4">
                  📢 Announcements ({announcements.length})
                </p>
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:shadow-md transition cursor-pointer group"
                    onClick={() => {
                      setSelectedItem(announcement);
                      setItemType("announcement");
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">📣</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition truncate">
                          {announcement.title || "Announcement"}
                        </p>
                        {announcement.content && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {announcement.content}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 font-medium mt-2">
                          📅{" "}
                          {announcement.createdAt
                            ? new Date(
                                announcement.createdAt
                              ).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {announcements.length > 3 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    +{announcements.length - 3} more announcement(s)
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div
              className={`bg-gradient-to-r ${
                itemType === "event"
                  ? "from-purple-500 to-blue-600"
                  : "from-blue-500 to-cyan-600"
              } text-white p-6 flex items-start justify-between`}
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {itemType === "event"
                    ? "📅 Event Details"
                    : "📢 Announcement"}
                </h2>
                <p className="text-opacity-80 text-white text-sm mt-1">
                  {itemType === "event"
                    ? "Event Information"
                    : "Important Update"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setItemType(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedItem.title}
                </h3>
                <div className="flex flex-wrap gap-3 items-center text-sm">
                  <span
                    className={`px-3 py-1 rounded-full font-medium ${
                      itemType === "event"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {itemType === "event" ? "Event" : "Announcement"}
                  </span>
                </div>
              </div>

              {/* Date/Time */}
              {itemType === "event" && selectedItem.date && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    📅 Event Date & Time
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedItem.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {selectedItem.time && (
                    <p className="text-sm text-gray-700 mt-1">
                      ⏰ {selectedItem.time}
                    </p>
                  )}
                </div>
              )}

              {/* Created/Posted Date */}
              {itemType === "announcement" && selectedItem.createdAt && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    📅 Posted On
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedItem.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}

              {/* Location (for events) */}
              {itemType === "event" && selectedItem.location && (
                <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-500">
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    📍 Location
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedItem.location}
                  </p>
                </div>
              )}

              {/* Description/Content */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">
                  {itemType === "event" ? "Description" : "Details"}
                </h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {itemType === "event"
                    ? selectedItem.description || "No description available"
                    : selectedItem.content || "No content available"}
                </p>
              </div>

              {/* Additional Info */}
              {selectedItem.organizer && (
                <div>
                  <h4 className="text-sm font-bold text-gray-600 mb-2">
                    Organized By
                  </h4>
                  <p className="text-gray-900">{selectedItem.organizer}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setItemType(null);
                    if (itemType === "event") {
                      onNavigate("events");
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                >
                  {itemType === "event" ? "View Full Event" : "Got It"}
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setItemType(null);
                  }}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationsDropdown;
