import React from "react";
import { Users, Bell, Search, ChevronDown } from "lucide-react";

function Header({ userInfo, notificationCount = 0 }) {
  // Get user display name - prefer firstName/lastName over name
  const displayName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo.name || "User";

  // Get user avatar - prefer img from member data over custom avatar
  const userAvatar = userInfo.img || userInfo.avatar || (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-sm">
      {displayName.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Search Section */}
        <div className="flex items-center gap-4 flex-1">
          <Users className="w-6 h-6 text-gray-400" />
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Citizens..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-6 h-6 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* User Dropdown */}
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 overflow-hidden">
              {typeof userAvatar === "string" ? (
                <img
                  src={userAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userAvatar
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-800 text-sm">{displayName}</p>
              {userInfo.oscaID && (
                <p className="text-xs text-gray-500">ID: {userInfo.oscaID}</p>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
