import React, { useEffect, useState } from "react";
import { X, Users, Camera, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import { ref as dbRef, ref, get, update, child } from "firebase/database";
import { db } from "./services/firebase";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
} from "firebase/auth";
const auth = getAuth();
const MemberProfileModal = ({
  showProfileModal,
  setShowProfileModal,
  selectedMember,
  paymentsData = [],
  getImagePath = (p) => p,
  isDeceased = () => false,
  extractBarangay = () => "-",
  handleEditClick,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(selectedMember || {});
  const [saving, setSaving] = useState(false);

  const fetchPayments = async () => {
    const dbRefRoot = ref(db);
    const snapshot = await get(child(dbRefRoot, "payments"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const payments = Object.entries(data).map(([key, value]) => ({
        id: key, // 👈 this becomes your receipt number (-Ocb3dD0q10_Nu25tpj5)
        ...value,
      }));
      return payments;
    } else {
      return [];
    }
  };

  useEffect(() => {
    setFormData({ ...(selectedMember || {}) });
    setIsEditing(false);
  }, [selectedMember, showProfileModal]);

  if (!showProfileModal || !selectedMember) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!window.confirm("Are you sure you want to save these changes?")) return;

    setSaving(true);
    try {
      const key =
        selectedMember.firebaseKey || selectedMember.key || selectedMember.id;
      if (!key) throw new Error("Missing firebase key for member");

      const memberRef = dbRef(db, `members/${key}`);

      // Update Realtime Database first (excluding password and email)
      const { password, email, ...dbData } = formData;
      await update(memberRef, {
        ...dbData,
        date_updated: new Date().toISOString(),
      });

      // Update Firebase Auth password if it changed and user is current logged-in
      if (
        password &&
        auth.currentUser &&
        auth.currentUser.email === selectedMember.email
      ) {
        const oldPassword = prompt(
          "Please enter your current password to update password:"
        );
        if (!oldPassword) throw new Error("Password update cancelled");

        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          oldPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updatePassword(auth.currentUser, password);
        alert("Password updated successfully!");
      }

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating member:", error);
      alert("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
      setShowProfileModal(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[1600px] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-1">Member Profile</h2>
            <p className="text-purple-100 text-base">
              ID No: {isEditing ? formData.oscaID : selectedMember.oscaID}
            </p>
          </div>
          <button
            onClick={() => setShowProfileModal(false)}
            className="p-3 hover:bg-white/20 rounded-xl transition text-white"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Personal Information */}
            <div className="xl:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Email */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Email
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedMember.email || "N/A"}
                    </p>
                  </div>

                  {/* Password */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Password
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedMember.password || "N/A"}
                    </p>
                  </div>

                  {/* OSCA ID */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      OSCA ID
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="oscaID"
                        value={formData.oscaID || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-bold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMember.oscaID}
                      </p>
                    )}
                  </div>

                  {/* Control Number */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Control Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contrNum"
                        value={formData.contrNum || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-bold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMember.contrNum || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* ID Booklet # */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      ID Booklet #
                    </label>
                    <p className="text-lg font-bold text-gray-900">
                      {isEditing
                        ? formData.contrNum || selectedMember.contrNum || "N/A"
                        : selectedMember.contrNum || "N/A"}
                    </p>
                  </div>

                  {/* Last Name (Surname) */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Surname
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-bold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMember.lastName}
                      </p>
                    )}
                  </div>

                  {/* Suffix */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Suffix
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="suffix"
                        value={formData.suffix || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-bold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMember.suffix || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* First Name */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-bold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMember.firstName}
                      </p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Middle Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-bold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMember.middleName}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Age
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="age"
                        value={formData.age || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-semibold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMember.age} years old
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-semibold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMember.gender}
                      </p>
                    )}
                  </div>

                  {/* Civil Status */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Civil Status
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="civilStat"
                        value={formData.civilStat || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-semibold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMember.civilStat}
                      </p>
                    )}
                  </div>

                  {/* Birthday */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Birthday
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-semibold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMember.birthday}
                      </p>
                    )}
                  </div>

                  {/* Place of Birth */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Place of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="placeOfBirth"
                        value={formData.placeOfBirth || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.placeOfBirth}
                      </p>
                    )}
                  </div>

                  {/* Religion */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Religion
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="religion"
                        value={formData.religion || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.religion || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* Complete Address */}
                  <div className="bg-white rounded-xl p-4 shadow-sm lg:col-span-3">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Complete Address
                    </label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        rows="2"
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.address}
                      </p>
                    )}
                  </div>

                  {/* Barangay - Read Only */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Barangay
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {extractBarangay(
                        isEditing ? formData.address : selectedMember.address
                      )}
                    </p>
                  </div>

                  {/* Contact Number */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contactNum"
                        value={formData.contactNum || ""}
                        onChange={handleChange}
                        className="w-full text-lg font-semibold text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMember.contactNum}
                      </p>
                    )}
                  </div>

                  {/* Citizenship */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Citizenship
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="citizenship"
                        value={formData.citizenship || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.citizenship || "Filipino"}
                      </p>
                    )}
                  </div>

                  {/* Educational Attainment */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Educational Attainment
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="educAttain"
                        value={formData.educAttain || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.educAttain || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* TIN */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      TIN
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="tin"
                        value={formData.tin || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.tin || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* PhilHealth */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      PhilHealth
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="philHealth"
                        value={formData.philHealth || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.philHealth || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* DSWD Pensioner */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      DSWD Pensioner
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="dswdPensioner"
                        value={formData.dswdPensioner || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.dswdPensioner || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* Living Arrangement */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Living Arrangement
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="livingArr"
                        value={formData.livingArr || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.livingArr || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* Pension Source */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Pension Source
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="psource"
                        value={formData.psource || ""}
                        onChange={handleChange}
                        className="w-full text-base font-medium text-gray-900 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900">
                        {selectedMember.psource || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* Date Registered - Read Only */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">
                      Date Registered
                    </label>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(
                        selectedMember.date_created
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status - Read Only */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Status
                    </label>
                    {isDeceased(selectedMember.oscaID) ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gray-200 text-gray-800">
                        Deceased
                      </span>
                    ) : selectedMember.archived === 1 ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-orange-200 text-orange-800">
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-200 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefits and Services Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Benefits Tracker
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-white rounded-xl shadow-sm">
                    <div>
                      <span className="text-lg font-semibold text-gray-700">
                        Monthly Stipend
                      </span>
                      <p className="text-sm text-gray-500">
                        Regular support program
                      </p>
                    </div>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-200 text-green-800">
                      {selectedMember.regSupport || "Active"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white rounded-xl shadow-sm">
                    <div>
                      <span className="text-lg font-semibold text-gray-700">
                        Medical Assistance
                      </span>
                      <p className="text-sm text-gray-500">
                        Healthcare support
                      </p>
                    </div>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-200 text-green-800">
                      Active
                    </span>
                  </div>
                  {selectedMember.dswdPensioner && (
                    <div className="flex items-center justify-between p-5 bg-white rounded-xl shadow-sm">
                      <div>
                        <span className="text-lg font-semibold text-gray-700">
                          DSWD Pension
                        </span>
                        <p className="text-sm text-gray-500">
                          Social welfare program
                        </p>
                      </div>
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-200 text-blue-800">
                        {selectedMember.dswdPensioner}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment History Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Payment History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-blue-200">
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Receipt No.
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Agent
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData
                        .filter((p) => p.oscaID === selectedMember.oscaID)
                        .sort(
                          (a, b) => new Date(b.payDate) - new Date(a.payDate)
                        )
                        .slice(0, 5)
                        .map((payment, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-blue-100 hover:bg-white/50"
                          >
                            {/* 👇 Prefer several possible receipt id fields so we don't show a dash if one of them exists */}
                            <td className="px-4 py-4 text-base font-semibold text-gray-900">
                              {payment.id ||
                                payment.receiptNo ||
                                payment.firebaseKey ||
                                payment.key ||
                                "—"}
                            </td>

                            <td className="px-4 py-4 text-base font-bold text-green-600">
                              ₱
                              {payment.amount
                                ? Number(payment.amount).toLocaleString()
                                : "0.00"}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-gray-900 text-white uppercase">
                                {payment.modePay || "CASH"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              {payment.payDesc || "Monthly Stipend"}
                            </td>
                            <td className="px-4 py-4 text-base font-medium text-gray-900">
                              {new Date(payment.payDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              {payment.authorAgent || "N/A"}
                            </td>
                          </tr>
                        ))}
                      {paymentsData.filter(
                        (p) => p.oscaID === selectedMember.oscaID
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No payment records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Facial Recognition Records */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-600 rounded-xl">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Facial Recognition Records
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white/80 backdrop-blur-xl rounded-xl">
                    <thead>
                      <tr className="border-b-2 border-blue-100">
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-blue-900 uppercase">
                          Purpose
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No facial recognition records found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Smart ID & Other Info */}
            <div className="space-y-6">
              {/* Smart ID Preview */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 sticky top-0">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Smart ID Preview
                </h3>

                {/* Front of Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-blue-900 mb-4">
                  <div className="p-5 bg-gradient-to-br from-blue-50 via-white to-blue-50">
                    {/* Header with Logo */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-14 h-14 rounded-full bg-blue-900 flex-shrink-0 overflow-hidden border-2 border-blue-900">
                        <img
                          src="/img/imglogo.png"
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[10px] font-bold text-blue-900 leading-tight italic">
                          Barangay Pinagbuhatan Senior Citizens Association Inc.
                        </h4>
                        <p className="text-[7px] text-gray-600 leading-tight">
                          Unit 3, 2nd Floor, Robern Bldg., Evangelista Extension
                          St., Pinagbuhatan, Pasig City 1601
                        </p>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex gap-3">
                      {/* Photo */}
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-28 bg-gray-200 border-2 border-gray-400 overflow-hidden">
                          {selectedMember.img &&
                          selectedMember.img instanceof File ? (
                            <img
                              src={URL.createObjectURL(selectedMember.img)}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : selectedMember.img ? (
                            <img
                              src={getImagePath(selectedMember.img)}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-2xl font-bold">
                              {selectedMember.firstName.charAt(0)}
                              {selectedMember.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="w-24 h-7 border-b-2 border-gray-400 flex items-end justify-center pb-1">
                          <p className="text-[7px] text-gray-500">Signature</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-1">
                          <p className="text-[7px] text-gray-600 leading-none">
                            Surname, Suffix, Firstname Middlename
                          </p>
                          <p className="text-[10px] font-bold text-gray-900 leading-tight uppercase">
                            {selectedMember.lastName},{" "}
                            {selectedMember.firstName}{" "}
                            {selectedMember.middleName}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mb-1">
                          <div>
                            <p className="text-[7px] text-gray-600 leading-none">
                              Date of Birth
                            </p>
                            <p className="text-[8px] font-bold text-gray-900">
                              {selectedMember.birthday}
                            </p>
                          </div>
                          <div>
                            <p className="text-[7px] text-gray-600 leading-none">
                              Age/Sex
                            </p>
                            <p className="text-[8px] font-bold text-gray-900 uppercase">
                              {selectedMember.age}, {selectedMember.gender}
                            </p>
                          </div>
                          <div>
                            <p className="text-[7px] text-gray-600 leading-none">
                              Civil Status
                            </p>
                            <p className="text-[8px] font-bold text-gray-900 uppercase">
                              {selectedMember.civilStat}
                            </p>
                          </div>
                        </div>
                        <div className="mb-1">
                          <p className="text-[7px] text-gray-600 leading-none">
                            Address (House #, St., brgy.)
                          </p>
                          <p className="text-[8px] font-bold text-gray-900 leading-tight uppercase line-clamp-2">
                            {selectedMember.address}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <p className="text-[7px] text-gray-600 leading-none">
                              OSCA ID
                            </p>
                            <p className="text-[8px] font-bold text-gray-900">
                              {selectedMember.oscaID}
                            </p>
                          </div>
                          <div>
                            <p className="text-[7px] text-gray-600 leading-none">
                              CONTACT #
                            </p>
                            <p className="text-[8px] font-bold text-gray-900">
                              {selectedMember.contactNum}
                            </p>
                          </div>
                          <div>
                            <p className="text-[7px] text-gray-600 leading-none">
                              BLOOD TYPE
                            </p>
                            <p className="text-[8px] font-bold text-gray-900">
                              O+
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center justify-start">
                        <div className="bg-white p-1 border border-gray-300">
                          <QRCode
                            value={selectedMember.oscaID.toString()}
                            size={75}
                            level="H"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-2 border-t-2 border-gray-400 text-center">
                      <p className="text-[8px] font-bold text-gray-700 uppercase">
                        Date of Organization Membership
                      </p>
                      <p className="text-[9px] font-bold text-gray-900">
                        {new Date(
                          selectedMember.date_created
                        ).toLocaleDateString()}{" "}
                        - 2 YEARS
                      </p>
                      <p className="text-[8px] text-gray-600">
                        {selectedMember.contrNum}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back of Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-blue-900">
                  <div className="p-5 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                    <div className="mb-2 pb-2 border-b-2 border-gray-300">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="text-[10px] font-bold text-gray-900 uppercase">
                          Primary Medical Conditions
                        </h5>
                        <div className="text-right">
                          <p className="text-[7px] text-gray-600">
                            DATE ISSUED:{" "}
                            {new Date(
                              selectedMember.date_created
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-[7px] text-gray-600">
                            DATE EXPIRE:{" "}
                            {new Date(
                              new Date(selectedMember.date_created).setFullYear(
                                new Date(
                                  selectedMember.date_created
                                ).getFullYear() + 2
                              )
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[8px]">
                        <div>
                          <p>☐ Hypertension</p>
                          <p>☐ Osteoporosis</p>
                        </div>
                        <div>
                          <p>☐ Diabetes</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <h5 className="text-[9px] font-bold text-gray-900 mb-1">
                        THIS CARD IS NON-TRANSFERABLE
                      </h5>
                      <p className="text-[7px] text-gray-700 leading-tight text-justify">
                        This is to certify that the bearer hereof whose photo,
                        signature and date-of-birth affixed hereon is a bona
                        fide member of the senior citizen organization of
                        Barangay Pinagbuhatan. If this card is found, please
                        return to organization admin or call{" "}
                        <span className="font-bold">0948-789-4396</span>.
                      </p>
                    </div>
                    <div className="mb-2">
                      <h5 className="text-[9px] font-bold text-gray-900 mb-1">
                        Card holder other details:
                      </h5>
                      <p className="text-[7px] text-gray-700 mb-1">
                        Precinct No. 0234A
                      </p>
                      <h5 className="text-[8px] font-bold text-gray-900 mb-1">
                        IN CASE OF EMERGENCY, PLEASE NOTIFY:
                      </h5>
                      <p className="text-[7px] text-gray-700 leading-tight">
                        <span className="font-bold">JILLIAN ROMRERO</span> is 40
                        H. CRUZ VILLA MONIQUE
                        <br />
                        <span className="font-bold">
                          DOÑA AURORA, PINAGBUHATAN, 0969-687-9807 (DAUGHTER)
                        </span>
                      </p>
                    </div>
                    <div className="pt-2 border-t border-gray-300 text-center">
                      <div className="h-6 mb-1"></div>
                      <p className="text-[8px] font-semibold text-gray-900">
                        Mr. Ricardo H. Tlazon
                      </p>
                      <p className="text-[7px] text-gray-600">
                        Organization President
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed Footer */}
        <div className="px-8 py-6 border-t bg-gray-50 flex flex-wrap gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-1 min-w-[150px] px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold text-base shadow-lg"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ ...(selectedMember || {}) });
                }}
                className="flex-1 min-w-[150px] px-6 py-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-bold text-base shadow-lg"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                }}
                className="flex-1 min-w-[150px] px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-base shadow-lg"
              >
                Renew Membership
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                }}
                className="flex-1 min-w-[150px] px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold text-base shadow-lg"
              >
                Update Benefits
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                }}
                className="flex-1 min-w-[150px] px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-base shadow-lg flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Smart ID
              </button>
              <button
                onClick={() => {
                  setIsEditing(true);
                  if (typeof handleEditClick === "function")
                    handleEditClick(selectedMember);
                }}
                className="flex-1 min-w-[150px] px-6 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition font-bold text-base shadow-lg"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-8 py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition font-bold text-base"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfileModal;
