import React, { useEffect, useMemo } from "react";
import {
  Home,
  Users,
  CreditCard,
  Bell,
  Heart,
  TrendingUp,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ activeMenu, setActiveMenu, userInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(
    () => [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Senior Citizen Management", path: "/citizens" },
      {
        icon: CreditCard,
        label: "Payment Management",
        path: "/payments",
      },
      {
        icon: Bell,
        label: "Notification Management",
        path: "/notifications",
      },
      {
        icon: Heart,
        label: "Service and Benefit Tracking",
        path: "/services",
      },
      { icon: TrendingUp, label: "Dynamic Reporting", path: "/reports" },
      { icon: Lock, label: "Role Based Access Control", path: "/roles" },
      {
        icon: MessageSquare,
        label: "Feedback and Incident",
        path: "/feedback",
      },
    ],
    []
  );

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) => item.path === location.pathname
    );
    if (currentItem && activeMenu !== currentItem.label) {
      setActiveMenu(currentItem.label);
    }
  }, [location.pathname, activeMenu, menuItems, setActiveMenu]);

  const handleClick = (item) => {
    setActiveMenu(item.label);
    navigate(item.path);
  };

  // Get display name and email from userInfo
  const displayName =
    userInfo?.firstName && userInfo?.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo?.name || "User";
  const userEmail = userInfo?.email || "user@eldereaseapp.com";
  const userAvatar = userInfo?.img;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* === Header === */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center shadow-sm overflow-hidden">
          <img
            src="/img/ElderEaseNewLogo.png"
            alt="ElderEase logo"
            className="w-8 h-8 object-contain"
          />
        </div>
        <span className="text-lg font-bold text-gray-800">Elder Ease</span>
      </div>

      {/* === User Info === */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 overflow-hidden">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{displayName}</h3>
          <p className="text-xs text-gray-500">{userEmail}</p>
        </div>
      </div>

      {/* === Navigation === */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.label;
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleClick(item)}
                  className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 relative ${
                    isActive
                      ? "bg-purple-100 text-purple-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                  }`}
                >
                  {/* Alignment bar fixed */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full transition-all duration-150 ${
                      isActive
                        ? "bg-purple-600"
                        : "bg-transparent group-hover:bg-purple-300"
                    }`}
                  />
                  <div className="flex items-center gap-3 pl-2">
                    <item.icon
                      className={`w-5 h-5 ${
                        isActive ? "text-purple-600" : "text-gray-500"
                      }`}
                    />
                    <span className="text-sm tracking-wide">{item.label}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
