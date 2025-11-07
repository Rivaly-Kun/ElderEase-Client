import React from "react";
import QRCode from "react-qr-code";
import { Calendar, Bell, Download } from "lucide-react";

const DashboardOverviewSection = ({
  memberData,
  events,
  eventsLoading,
  announcements,
  announcementsLoading,
  formatEventSchedule,
  formatRelativeTime,
  getEventAccent,
  getImagePath,
  onNavigate,
}) => (
  <div className="p-8">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400">
            {memberData.img ? (
              <img
                src={getImagePath(memberData.img)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.target.style.display = "none";
                  event.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-xl">${memberData.firstName.charAt(
                    0
                  )}${memberData.lastName.charAt(0)}</div>`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                {memberData.firstName.charAt(0)}
                {memberData.lastName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome, {memberData.firstName}!
            </h2>
            <p className="text-gray-600 mt-2">
              OSCA ID: {memberData.oscaID} • Member Since{" "}
              {new Date(memberData.date_created).getFullYear()}
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              MEMBERSHIP ACTIVE SINCE{" "}
              {new Date(memberData.date_created).getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Active Benefits
        </h3>
        <p className="text-4xl font-bold text-gray-800">0</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Pending Requests
        </h3>
        <p className="text-4xl font-bold text-gray-800">0</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Membership Status
        </h3>
        <p className="text-2xl font-bold text-green-600">Active</p>
        {memberData?.dateExpiration && (
          <p className="text-xs text-gray-500 mt-2">
            Expires: {new Date(memberData.dateExpiration).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Events Attended
        </h3>
        <p className="text-4xl font-bold text-gray-800">0</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Upcoming Barangay Events
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Stay updated with community activities and programs
          </p>

          <div className="space-y-3">
            {eventsLoading ? (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                Loading upcoming events...
              </div>
            ) : events.length > 0 ? (
              events.slice(0, 4).map((event) => {
                const { background, icon } = getEventAccent(event.category);

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className={`p-2 rounded ${background}`}>
                      <Calendar className={`w-5 h-5 ${icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>
                          📅 {formatEventSchedule(event.date, event.time)}
                        </span>
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                No upcoming events have been posted yet. Check back soon.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Recent Announcements
            </h2>
          </div>

          <div className="space-y-4">
            {announcementsLoading ? (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                Loading announcements...
              </div>
            ) : announcements.length > 0 ? (
              announcements.slice(0, 4).map((announcement) => {
                const postedLabel = formatRelativeTime(
                  announcement.rawTimestamp ?? announcement.timestamp
                );

                return (
                  <div
                    key={announcement.id}
                    className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {announcement.title}
                    </h3>
                    {announcement.message && (
                      <p className="text-sm text-gray-600 mb-2">
                        {announcement.message}
                      </p>
                    )}
                    {postedLabel && (
                      <p className="text-xs text-gray-400">{postedLabel}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                No announcements have been posted yet. Please check back later.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Info</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Age</span>
            <span className="text-sm font-semibold text-gray-800">
              {memberData.age} years
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Gender</span>
            <span className="text-sm font-semibold text-gray-800">
              {memberData.gender}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Civil Status</span>
            <span className="text-sm font-semibold text-gray-800">
              {memberData.civilStat}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Contact</span>
            <span className="text-sm font-semibold text-gray-800">
              {memberData.contactNum}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Birthday</span>
            <span className="text-sm font-semibold text-gray-800">
              {memberData.birthday}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardOverviewSection;
