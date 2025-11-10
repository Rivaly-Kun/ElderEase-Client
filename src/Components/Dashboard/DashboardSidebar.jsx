import React from "react";
import {
  Calendar,
  CreditCard,
  Camera,
  Bell,
  Download,
  LogOut,
  QrCode as QrCodeIcon,
  Gift,
  Megaphone,
} from "lucide-react";

const DashboardSidebar = ({
  memberData,
  activeSection,
  onSectionChange,
  onLogout,
  onShowQR,
  onClose,
  getImagePath,
}) => {
  const handleNavigate = (section) => {
    onSectionChange(section);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-purple-200 bg-white flex items-center justify-center">
            <img
              src="/img/ElderEaseNewLogo.png"
              alt="ElderEase logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-purple-600">ELDER EASE</h1>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400">
              {memberData.img ? (
                <img
                  src={getImagePath(memberData.img)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.target.style.display = "none";
                    event.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold">${memberData.firstName.charAt(
                      0
                    )}${memberData.lastName.charAt(0)}</div>`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {memberData.firstName.charAt(0)}
                  {memberData.lastName.charAt(0)}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                onShowQR();
                if (onClose) {
                  onClose();
                }
              }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-lg transition"
              title="View QR Code"
            >
              <QrCodeIcon className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">
              {memberData.firstName} {memberData.lastName}
            </p>
            <p className="text-xs text-gray-500">ID: {memberData.oscaID}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          <button
            onClick={() => handleNavigate("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "dashboard"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigate("payments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "payments"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Payments</span>
          </button>
          <button
            onClick={() => handleNavigate("verification")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "verification"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="font-medium">Verification</span>
          </button>
          <button
            onClick={() => handleNavigate("events")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "events"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Events</span>
          </button>
          <button
            onClick={() => handleNavigate("announcements")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "announcements"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Megaphone className="w-5 h-5" />
            <span className="font-medium">Announcements</span>
          </button>
          <button
            onClick={() => handleNavigate("documents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "documents"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Documents</span>
          </button>
          <button
            onClick={() => handleNavigate("benefits")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeSection === "benefits"
                ? "bg-purple-50 text-purple-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="font-medium">Benefits</span>
          </button>
        </div>
      </nav>

      <div className="p-4">
        <button
          onClick={() => {
            if (onClose) {
              onClose();
            }
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );
};

export default DashboardSidebar;
