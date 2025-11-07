import React from "react";
import {
  Calendar,
  HelpCircle,
  Palette,
  QrCode as QrCodeIcon,
  Bell,
  Menu,
  X,
  Edit3,
} from "lucide-react";
import ThemeSelectorDropdown from "./ThemeSelectorDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

const DashboardTopBar = ({
  activeSection,
  isSidebarOpen,
  onToggleSidebar,
  onOpenHelp,
  onToggleThemeSelector,
  onToggleNotifications,
  onHideNotifications,
  showThemeSelector,
  showNotifications,
  cardThemes,
  cardTheme,
  onSelectTheme,
  events,
  announcements,
  memberData,
  getImagePath,
  onEditProfile,
  onShowQR,
  onNavigateFromNotifications,
}) => {
  const activeTitleMap = {
    dashboard: "Dashboard",
    payments: "Payments",
    verification: "Verification",
    events: "Events",
    documents: "Documents",
  };

  const activeTitle = activeTitleMap[activeSection] || "Dashboard";
  const notificationCount = events.length + announcements.length;

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-600 shadow-sm lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="p-2 bg-purple-100 rounded-lg hidden sm:flex">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {activeTitle}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <button
            onClick={onOpenHelp}
            className="p-2 hover:bg-gray-100 rounded-lg transition relative"
            title="Help & Tutorial"
          >
            <HelpCircle className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={onShowQR}
            className="p-2 hover:bg-gray-100 rounded-lg transition relative"
            title="View QR Code"
          >
            <QrCodeIcon className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={onToggleNotifications}
            className="p-2 hover:bg-gray-100 rounded-lg transition relative group"
            title="Notifications"
          >
            <Bell className="w-6 h-6 text-gray-600 group-hover:text-purple-600 transition" />
            {notificationCount > 0 && (
              <div className="absolute top-0 right-0 flex items-center justify-center">
                <span className="absolute inline-flex items-center justify-center w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold rounded-full ring-2 ring-white animate-pulse shadow-lg">
                  {notificationCount}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={onEditProfile}
            className="relative group"
            title="Edit Profile"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 ring-2 ring-transparent hover:ring-blue-500 transition-all">
              {memberData.img ? (
                <img
                  src={getImagePath(memberData.img)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.target.style.display = "none";
                    event.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">${memberData.firstName.charAt(
                      0
                    )}${memberData.lastName.charAt(0)}</div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                  {memberData.firstName.charAt(0)}
                  {memberData.lastName.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>

      <ThemeSelectorDropdown
        visible={showThemeSelector}
        cardThemes={cardThemes}
        activeTheme={cardTheme}
        onSelectTheme={onSelectTheme}
      />

      <NotificationsDropdown
        visible={showNotifications}
        events={events}
        announcements={announcements}
        onClose={onHideNotifications}
        onNavigate={onNavigateFromNotifications}
      />
    </div>
  );
};

export default DashboardTopBar;
