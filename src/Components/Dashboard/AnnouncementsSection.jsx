import React, { useState } from "react";
import { Bell, Search, X } from "lucide-react";

const AnnouncementsSection = ({
  announcements,
  announcementsLoading,
  onNavigateDashboard,
  onSelectAnnouncement,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (announcementsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          No Announcements Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Check back later for important updates and announcements from your
          barangay.
        </p>
        {onNavigateDashboard && (
          <button
            onClick={onNavigateDashboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    );
  }

  const filteredAnnouncements = announcements.filter((announcement) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchLower === "" ||
      (announcement.title &&
        announcement.title.toLowerCase().includes(searchLower)) ||
      (announcement.content &&
        announcement.content.toLowerCase().includes(searchLower))
    );
  });

  const noResults = filteredAnnouncements.length === 0 && searchQuery !== "";

  return (
    <div className="space-y-6 p-6">
      {/* Search Bar */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-2xl shadow-md border border-blue-100 p-8">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              📢 Search Announcements
            </h3>
            <p className="text-sm text-gray-600">
              Find important updates and messages from your barangay
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {searchQuery && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
              <span>Found {filteredAnnouncements.length} result(s)</span>
              <button
                onClick={() => setSearchQuery("")}
                className="ml-auto hover:bg-blue-200 p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Announcements Grid */}
      {noResults ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
          <p className="text-yellow-800 font-medium">
            No announcements found matching "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition overflow-hidden cursor-pointer group"
              onClick={() =>
                onSelectAnnouncement && onSelectAnnouncement(announcement)
              }
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 group-hover:from-blue-100 group-hover:to-cyan-100 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition">
                      {announcement.title}
                    </h3>
                    {announcement.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        📅{" "}
                        {new Date(announcement.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-2xl ml-4">📣</div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {announcement.content && (
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {announcement.content}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500">
                    Click to view full details
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsSection;
