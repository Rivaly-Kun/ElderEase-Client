import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../Services/firebase";
import { ref, set, push } from "firebase/database";
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import {
  Eye,
  EyeOff,
  Upload,
  X,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";

const Registration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Account Information
    email: "",
    password: "",
    confirmPassword: "",

    // Personal Information
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    address: "",
    placeOfBirth: "",
    birthday: "",
    contactNum: "",
    gender: "",
    civilStat: "",
    oscaID: "",

    // Health and Social Status
    dswdPensioner: "No",
    dswdWithATM: "No",
    localSeniorPensioner: "No",
    bedridden: "No",
    disabilities: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactNum: "",
    emergencyContactRelation: "",

    // Medical Information
    medConditions: [],
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Medical Conditions Array Handlers
  const addMedCondition = () => {
    setFormData((prev) => ({
      ...prev,
      medConditions: [...(prev.medConditions || []), ""],
    }));
  };

  const updateMedCondition = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      medConditions: prev.medConditions.map((cond, i) =>
        i === index ? value : cond
      ),
    }));
  };

  const removeMedCondition = (index) => {
    setFormData((prev) => ({
      ...prev,
      medConditions: prev.medConditions.filter((_, i) => i !== index),
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.placeOfBirth)
      newErrors.placeOfBirth = "Place of birth is required";
    if (!formData.birthday) newErrors.birthday = "Date of birth is required";
    if (!formData.contactNum)
      newErrors.contactNum = "Contact number is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.civilStat) newErrors.civilStat = "Civil status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.emergencyContactName)
      newErrors.emergencyContactName = "Emergency contact name is required";
    if (!formData.emergencyContactNum)
      newErrors.emergencyContactNum = "Emergency contact number is required";
    if (!formData.emergencyContactRelation)
      newErrors.emergencyContactRelation =
        "Emergency contact relation is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newDocuments.push({
          name: file.name,
          data: reader.result,
          type: file.type,
          size: file.size,
        });

        if (newDocuments.length === files.length) {
          setUploadedDocuments((prev) => [...prev, ...newDocuments]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = (index) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
      return;
    }

    // Step 3: Submit registration
    if (!validateStep2()) return;

    setLoading(true);

    try {
      // NO AUTH ACCOUNT CREATED YET - Admin will create it upon approval
      // Upload documents to Firebase Storage
      const documentURLs = [];
      const tempId = `temp_${Date.now()}`;

      for (let i = 0; i < uploadedDocuments.length; i++) {
        const doc = uploadedDocuments[i];
        const fileName = `${tempId}_${i}_${doc.name}`;
        const fileRef = storageRef(
          storage,
          `pendingRegistrations/${tempId}/${fileName}`
        );

        await uploadString(fileRef, doc.data, "data_url");
        const downloadURL = await getDownloadURL(fileRef);

        documentURLs.push({
          name: doc.name,
          url: downloadURL,
          type: doc.type,
          uploadedAt: Date.now(),
        });
      }

      // Calculate age from birthday
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // Parse birthday into separate fields (matching admin structure)
      const [birthYear, birthMonth, birthDay] = formData.birthday.split("-");

      // Create account request in createaccreq node (matching admin structure)
      const createAccReqRef = ref(db, "createaccreq");
      const newRequestRef = push(createAccReqRef);

      await set(newRequestRef, {
        // Account Credentials (stored for admin to create account later)
        email: formData.email,
        password: formData.password, // Will be used by admin to create Firebase Auth account

        // Personal Information (matching exact admin field names)
        firstName: formData.firstName,
        middleName: formData.middleName || "",
        lastName: formData.lastName,
        suffix: formData.suffix || "",
        gender: formData.gender,
        civilStat: formData.civilStat,

        // Birthday fields
        birthday_month: birthMonth,
        birthday_day: birthDay,
        birthday_year: birthYear,
        birthday: formData.birthday,
        age: age,

        // Location
        placeOfBirth: formData.placeOfBirth,
        address: formData.address,
        contactNum: formData.contactNum,

        // Health and Social Status
        dswdPensioner: formData.dswdPensioner,
        dswdWithATM: formData.dswdWithATM,
        localSeniorPensioner: formData.localSeniorPensioner,
        bedridden: formData.bedridden,
        disabilities: formData.disabilities || "",
        medConditions:
          Array.isArray(formData.medConditions) &&
          formData.medConditions.length > 0
            ? formData.medConditions.filter((c) => c.trim()).join(", ")
            : "",

        // Emergency Contact
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNum: formData.emergencyContactNum,
        emergencyContactRelation: formData.emergencyContactRelation,
        emergencyContactAddress: "",

        // Documents
        documents: documentURLs,

        // OSCA ID will be assigned by admin
        oscaID: "", // Empty, admin will fill this
        contrNum: "", // Admin will fill

        // Additional fields that admin form has (set defaults)
        nationality: "Filipino",
        citizenship: "Filipino",
        religion: "",
        educAttain: "",
        bloodType: "",
        tin: "",
        philHealth: "",
        sssId: "",
        nationalId: "",
        barangayId: "",
        ncscNum: "",
        idBookletNum: "",
        precinctNo: "",
        psource: "",
        regSupport: "Active",
        livingArr: "",
        familyMembers: [],
        healthFacility: "",
        emergencyHospital: "",
        healthRecords: "",
        dateIssue: "",
        dateExpiration: "",
        img: null, // Admin can upload photo later

        // Status and Metadata
        status: "pending", // pending, approved, rejected
        requestDate: new Date().toISOString(),
        approvedBy: null,
        approvedDate: null,
        rejectedBy: null,
        rejectedDate: null,
        rejectionReason: null,
        createdAt: Date.now(),
        source: "online-registration",
        authUid: null, // Will be filled when admin creates Firebase Auth account
      });

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error) {
      setLoading(false);
      console.error("Registration error:", error);
      alert(`Registration failed: ${error.message}`);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  if (showSuccessModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Registration Request Submitted!
          </h2>
          <p className="text-gray-600 mb-2">
            Your membership application has been submitted successfully.
          </p>
          <p className="text-gray-600 mb-6">
            Our admin team will review your application and verify your
            information. You will receive an SMS notification once your account
            is approved and ready to use.
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-blue-800 mb-2">
              Next Steps:
            </p>
            <ol className="text-sm text-left text-gray-700 space-y-1">
              <li>1. Admin will review your application</li>
              <li>2. Wait for SMS notification about approval status</li>
              <li>3. Once approved, bring hard copy documents to the office</li>
              <li>
                4. Complete verification and receive your official OSCA ID
              </li>
              <li>5. Login using your registered email and password</li>
            </ol>
          </div>
          <button
            onClick={handleBackToLogin}
            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Senior Citizen Registration
          </h1>
          <p className="text-gray-600">
            Complete the form below to register for OSCA membership
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 1
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`w-24 h-1 ${
                  step >= 2 ? "bg-purple-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 2
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
              <div
                className={`w-24 h-1 ${
                  step >= 3 ? "bg-purple-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 3
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                3
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 max-w-md mx-auto">
            <span className="text-xs font-medium text-gray-600">
              Personal Info
            </span>
            <span className="text-xs font-medium text-gray-600">
              Health & Contact
            </span>
            <span className="text-xs font-medium text-gray-600">Documents</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Step 1: Personal Information
                </h2>

                {/* Account Information */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Account Credentials
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.password
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.confirmPassword
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Re-enter password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Full Name
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name (Surname) *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Dela Cruz"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Juan"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Santos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Suffix
                      </label>
                      <select
                        name="suffix"
                        value={formData.suffix}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">None</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address and Birth Information */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Complete Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="House No., Street, Barangay, City, Province"
                    ></textarea>
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Place of Birth *
                    </label>
                    <input
                      type="text"
                      name="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.placeOfBirth
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="City/Municipality, Province"
                    />
                    {errors.placeOfBirth && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.placeOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      max={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 60)
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.birthday ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.birthday && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.birthday}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="contactNum"
                      value={formData.contactNum}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.contactNum ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="09XXXXXXXXX"
                    />
                    {errors.contactNum && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.contactNum}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gender and Civil Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.gender ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Civil Status *
                    </label>
                    <select
                      name="civilStat"
                      value={formData.civilStat}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.civilStat ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                    {errors.civilStat && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.civilStat}
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
                  >
                    Next: Health & Contact Info
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Health and Emergency Contact */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Step 2: Health & Emergency Contact
                </h2>

                {/* Health and Social Status */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Health and Social Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        DSWD Pensioner?
                      </label>
                      <select
                        name="dswdPensioner"
                        value={formData.dswdPensioner}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        With ATM?
                      </label>
                      <select
                        name="dswdWithATM"
                        value={formData.dswdWithATM}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Local Senior Pensioner?
                      </label>
                      <select
                        name="localSeniorPensioner"
                        value={formData.localSeniorPensioner}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bedridden/PWD?
                      </label>
                      <select
                        name="bedridden"
                        value={formData.bedridden}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Disabilities (if any)
                      </label>
                      <input
                        type="text"
                        name="disabilities"
                        value={formData.disabilities}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Specify disabilities, if applicable"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Primary Medical Conditions
                    </label>
                    <button
                      type="button"
                      onClick={addMedCondition}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Condition
                    </button>
                  </div>

                  {formData.medConditions &&
                  formData.medConditions.length > 0 ? (
                    <div className="space-y-2">
                      {formData.medConditions.map((condition, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={condition}
                            onChange={(e) =>
                              updateMedCondition(index, e.target.value)
                            }
                            placeholder={`Condition ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeMedCondition(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-3">
                        No medical conditions added
                      </p>
                      <button
                        type="button"
                        onClick={addMedCondition}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Condition
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-3">
                    Add each medical condition separately (e.g., Hypertension,
                    Diabetes, Arthritis, etc.)
                  </p>
                </div>

                {/* Emergency Contact */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Emergency Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Emergency Contact Name *
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.emergencyContactName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Full name of emergency contact"
                      />
                      {errors.emergencyContactName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.emergencyContactName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Emergency Contact Number *
                      </label>
                      <input
                        type="tel"
                        name="emergencyContactNum"
                        value={formData.emergencyContactNum}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.emergencyContactNum
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="09XXXXXXXXX"
                      />
                      {errors.emergencyContactNum && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.emergencyContactNum}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.emergencyContactRelation
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="e.g., Son, Daughter, Spouse, etc."
                      />
                      {errors.emergencyContactRelation && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.emergencyContactRelation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
                  >
                    Next: Upload Documents
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Document Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Step 3: Upload Documents
                </h2>

                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    📋 Required Documents
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Valid Government ID</li>
                    <li>Birth Certificate</li>
                    <li>Proof of Residency (Barangay Certificate)</li>
                    <li>Recent Photo (passport size)</li>
                    <li>Medical Records (if applicable)</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    * Please ensure all documents are clear and readable.
                    Maximum file size: 5MB per file.
                  </p>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Upload Your Documents
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click to browse or drag and drop files here
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="fileUpload"
                  />
                  <label
                    htmlFor="fileUpload"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold cursor-pointer"
                  >
                    Choose Files
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted formats: JPG, PNG, PDF (Max 5MB per file)
                  </p>
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Uploaded Documents ({uploadedDocuments.length})
                    </h3>
                    {uploadedDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {doc.type.includes("pdf") ? "📄" : "🖼️"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 truncate max-w-xs">
                              {doc.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Important Notice
                  </h3>
                  <p className="text-gray-700 text-sm mb-3">
                    By submitting this registration form, you confirm that:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>All information provided is accurate and truthful</li>
                    <li>You are a resident of Pasig City</li>
                    <li>
                      You meet the age requirement (60 years old and above)
                    </li>
                    <li>You will bring original documents for verification</li>
                  </ul>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadedDocuments.length === 0}
                    className={`flex-1 py-3 rounded-xl transition font-semibold ${
                      loading || uploadedDocuments.length === 0
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Registration"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <button
              onClick={handleBackToLogin}
              className="text-purple-600 font-semibold hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
