import React from "react";

const NotificationsDropdown = ({
  visible,
  events,
  announcements,
  onClose,
  onNavigate,
}) => {
  if (!visible) {
    return null;
  }

  const totalUpdates = events.length + announcements.length;

  return (
    <div className="mt-4 lg:mt-0 lg:absolute lg:top-full lg:right-8 lg:translate-y-3 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 z-[1000] w-full sm:w-[450px] max-w-[calc(100vw-2rem)] max-h-[500px] overflow-y-auto">
      <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">🔔 Notifications</h3>
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
                  onClick={() => onNavigate("events")}
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
                  onClick={() => onNavigate("dashboard")}
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
  );
};

export default NotificationsDropdown;
