import React from "react";
import { X } from "lucide-react";

const AnnouncementDetailsModal = ({ isOpen, announcement, onClose }) => {
  if (!isOpen || !announcement) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-8 flex items-start justify-between sticky top-0">
          <div className="flex-1">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">📢</span>
              <span>Announcement</span>
            </h2>
            <p className="text-blue-100 text-sm mt-2">Important Update</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              {announcement.title}
            </h3>
            <div className="inline-block px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700 text-sm">
              Announcement
            </div>
          </div>

          {/* Date Posted */}
          {announcement.createdAt && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 font-medium mb-2">
                📅 Posted On
              </p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Author/Posted By */}
          {announcement.createdBy && (
            <div className="bg-indigo-50 rounded-xl p-6 border-l-4 border-indigo-500">
              <p className="text-sm text-gray-600 font-medium mb-2">
                👤 Posted By
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {announcement.createdBy}
              </p>
            </div>
          )}

          {/* Category/Type */}
          {announcement.category && (
            <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 font-medium mb-2">
                🏷️ Category
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {announcement.category}
              </p>
            </div>
          )}

          {/* Full Content */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              📝 Full Details
            </h4>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {announcement.content || "No content available"}
              </p>
            </div>
          </div>

          {/* Priority Badge */}
          {announcement.priority && (
            <div
              className={`rounded-xl p-4 border-l-4 ${
                announcement.priority === "high"
                  ? "bg-red-50 border-red-500 text-red-700"
                  : announcement.priority === "medium"
                  ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                  : "bg-green-50 border-green-500 text-green-700"
              }`}
            >
              <p className="text-sm font-semibold">
                ⚠️ Priority:{" "}
                {announcement.priority.charAt(0).toUpperCase() +
                  announcement.priority.slice(1)}
              </p>
            </div>
          )}

          {/* Additional Info */}
          {(announcement.targetAudience || announcement.tags) && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3">
                ℹ️ Additional Information
              </h5>
              <div className="space-y-2">
                {announcement.targetAudience && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Target Audience:</span>{" "}
                    {announcement.targetAudience}
                  </p>
                )}
                {announcement.tags && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {typeof announcement.tags === "string"
                      ? announcement.tags.split(",").map((tag, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            #{tag.trim()}
                          </span>
                        ))
                      : announcement.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailsModal;
