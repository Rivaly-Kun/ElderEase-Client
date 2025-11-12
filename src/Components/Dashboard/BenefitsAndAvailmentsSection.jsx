import { useState, useCallback, useEffect } from "react";
import { db, storage } from "../../Services/firebase";
import { ref as dbRef, get, set, push } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  Upload,
  X,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Gift,
  TrendingUp,
  Calendar,
  DollarSign,
  FileCheck,
  XCircle,
  Info,
  Sparkles,
} from "lucide-react";

const BenefitsAndAvailmentsSection = ({
  currentUser,
  activeBenefits,
  benefitsLoading,
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState("available"); // available, history, requests
  const [availedBenefits, setAvaiedBenefits] = useState([]);
  const [benefitRequests, setBenefitRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalAmount: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    thisYearTotal: 0,
  });

  // Fetch availed benefits (already approved) using OSCA ID from availments
  const fetchAvaiedBenefits = useCallback(async () => {
    if (!currentUser?.oscaID) return;
    try {
      setLoading(true);
      const benefitsRef = dbRef(db, "availments");
      const snapshot = await get(benefitsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const benefitsList = [];

        // Search through all availments to find ones matching this OSCA ID
        Object.entries(data).forEach(([benefitId, benefit]) => {
          if (
            benefit.oscaID === currentUser.oscaID &&
            (benefit.status === "Approved" || benefit.status === "approved")
          ) {
            benefitsList.push({
              id: benefitId,
              ...benefit,
            });
          }
        });

        benefitsList.sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        );
        setAvaiedBenefits(benefitsList);
      } else {
        setAvaiedBenefits([]);
      }
    } catch (error) {
      console.error("Error fetching availed benefits:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch benefit requests (pending and rejected) using OSCA ID from availments
  const fetchBenefitRequests = useCallback(async () => {
    if (!currentUser?.oscaID) return;
    try {
      setLoading(true);
      const requestsRef = dbRef(db, "availments");
      const snapshot = await get(requestsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const requestsList = [];

        // Search through all availments to find pending/rejected ones matching this OSCA ID
        Object.entries(data).forEach(([requestId, request]) => {
          if (
            request.oscaID === currentUser.oscaID &&
            request.status !== "Approved" &&
            request.status !== "approved"
          ) {
            requestsList.push({
              id: requestId,
              ...request,
            });
          }
        });

        requestsList.sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        );
        setBenefitRequests(requestsList);
      } else {
        setBenefitRequests([]);
      }
    } catch (error) {
      console.error("Error fetching benefit requests:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Calculate Statistics
  const calculateStats = useCallback(() => {
    const currentYear = new Date().getFullYear();

    const totalReceived = availedBenefits.length;
    const totalAmount = availedBenefits.reduce(
      (sum, b) => sum + (b.cashValue || 0),
      0
    );
    const pendingRequests = benefitRequests.filter(
      (r) => r.status === "Pending"
    ).length;
    const rejectedRequests = benefitRequests.filter(
      (r) => r.status === "Rejected"
    ).length;

    const thisYearBenefits = availedBenefits.filter((b) => {
      const benefitYear = new Date(b.date || b.dateCreated).getFullYear();
      return benefitYear === currentYear;
    });
    const thisYearTotal = thisYearBenefits.reduce(
      (sum, b) => sum + (b.cashValue || 0),
      0
    );

    setStats({
      totalReceived,
      totalAmount,
      pendingRequests,
      rejectedRequests,
      thisYearTotal,
    });
  }, [availedBenefits, benefitRequests]);

  useEffect(() => {
    // Fetch both availed benefits and requests on component mount
    fetchAvaiedBenefits();
    fetchBenefitRequests();
  }, [fetchAvaiedBenefits, fetchBenefitRequests]);

  useEffect(() => {
    // Recalculate stats when data changes
    calculateStats();
  }, [calculateStats]);

  // Check if user can apply for a benefit (not already received or pending)
  const canApplyForBenefit = useCallback(
    (benefit) => {
      // Check if already received (approved)
      const alreadyReceived = availedBenefits.some(
        (b) =>
          b.benefitID === benefit.id || b.benefitName === benefit.benefitName
      );

      // Check if already has pending request (rejected requests can reapply)
      const hasPendingRequest = benefitRequests.some(
        (r) =>
          (r.benefitID === benefit.id ||
            r.benefitName === benefit.benefitName) &&
          r.status?.toLowerCase() === "pending"
      );

      return !alreadyReceived && !hasPendingRequest;
    },
    [availedBenefits, benefitRequests]
  );

  // Get the reason why user cannot apply
  const getCannotApplyReason = useCallback(
    (benefit) => {
      const alreadyReceived = availedBenefits.some(
        (b) =>
          b.benefitID === benefit.id || b.benefitName === benefit.benefitName
      );

      if (alreadyReceived) {
        return "You have already received this benefit";
      }

      const hasPendingRequest = benefitRequests.some(
        (r) =>
          (r.benefitID === benefit.id ||
            r.benefitName === benefit.benefitName) &&
          r.status?.toLowerCase() === "pending"
      );

      if (hasPendingRequest) {
        return "You already have a pending request for this benefit";
      }

      return null;
    },
    [availedBenefits, benefitRequests]
  );

  // Check if a benefit request was rejected
  const getRejectedRequest = useCallback(
    (benefit) => {
      return benefitRequests.find(
        (r) =>
          (r.benefitID === benefit.id ||
            r.benefitName === benefit.benefitName) &&
          r.status?.toLowerCase() === "rejected"
      );
    },
    [benefitRequests]
  );

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmitRequest = async () => {
    if (!selectedBenefit || uploadedFiles.length === 0) {
      alert("Please select a benefit and upload at least one document");
      return;
    }

    setSubmitting(true);
    try {
      const tempId = `req_${Date.now()}`;
      const uploadedDocuments = [];

      // Upload files - Use OSCA ID as fallback if memberFirebaseKey is not available
      const userIdentifier =
        currentUser.memberFirebaseKey ||
        currentUser.oscaID ||
        currentUser.uid ||
        "unknown";

      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileObj = uploadedFiles[i];
        const fileName = `${tempId}_${i}_${fileObj.name}`;
        const fileRef = storageRef(
          storage,
          `benefitRequests/${userIdentifier}/${fileName}`
        );

        await uploadBytes(fileRef, fileObj.file);
        const downloadURL = await getDownloadURL(fileRef);

        uploadedDocuments.push({
          name: fileObj.name,
          url: downloadURL,
          type: fileObj.type,
          uploadedAt: fileObj.uploadedAt,
        });
      }

      // Create benefit request record in availments
      const requestsRef = dbRef(db, "availments");
      const newRequestRef = push(requestsRef);

      // Generate reference number
      const referenceNumber = `BR-${Date.now().toString().slice(-8)}`;

      // Prepare the data object - only include memberFirebaseKey if it exists
      const requestData = {
        benefitID: selectedBenefit.id,
        benefitName: selectedBenefit.benefitName,
        cashValue: selectedBenefit.cashValue,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        oscaID: currentUser.oscaID,
        notes: requestNotes || "",
        documents: uploadedDocuments,
        status: "Pending",
        date: "",
        referenceNumber: referenceNumber,
        dateCreated: new Date().toISOString(),
        dateSubmitted: new Date().toISOString(),
      };

      // Only add memberFirebaseKey if it exists
      if (currentUser.memberFirebaseKey) {
        requestData.memberFirebaseKey = currentUser.memberFirebaseKey;
      }

      await set(newRequestRef, requestData);

      alert(
        `Request submitted successfully! Reference Number: ${referenceNumber}`
      );
      setShowRequestModal(false);
      setSelectedBenefit(null);
      setUploadedFiles([]);
      setRequestNotes("");
      fetchBenefitRequests();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(`Error submitting request: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Benefits & Availments
              </h2>
              <p className="text-purple-100">
                Track and request your senior citizen benefits
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
                <p className="text-xs font-semibold text-purple-100 uppercase tracking-wider">
                  This Year
                </p>
              </div>
              <p className="text-2xl font-bold text-white">
                ₱{stats.thisYearTotal.toLocaleString()}
              </p>
              <p className="text-xs text-purple-200 mt-1">Total received</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-5 h-5 text-green-300" />
                <p className="text-xs font-semibold text-purple-100 uppercase tracking-wider">
                  Approved
                </p>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.totalReceived}
              </p>
              <p className="text-xs text-purple-200 mt-1">Benefits received</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-300" />
                <p className="text-xs font-semibold text-purple-100 uppercase tracking-wider">
                  Pending
                </p>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.pendingRequests}
              </p>
              <p className="text-xs text-purple-200 mt-1">Awaiting approval</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-300" />
                <p className="text-xs font-semibold text-purple-100 uppercase tracking-wider">
                  All Time
                </p>
              </div>
              <p className="text-2xl font-bold text-white">
                ₱{stats.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-purple-200 mt-1">Total value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === "available"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Available Benefits
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "available"
                  ? "bg-white text-purple-600"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {activeBenefits?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === "history"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileCheck className="w-5 h-5" />
            My Benefits
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "history"
                  ? "bg-white text-purple-600"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {stats.totalReceived}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeTab === "requests"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Clock className="w-5 h-5" />
            My Requests
            {stats.pendingRequests > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "requests"
                    ? "bg-yellow-400 text-yellow-900"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {stats.pendingRequests}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content: Available Benefits */}
      {activeTab === "available" && (
        <div className="space-y-4">
          {benefitsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-semibold text-lg">
                  Loading available benefits...
                </p>
                <p className="text-gray-500 text-sm">Please wait a moment</p>
              </div>
            </div>
          ) : activeBenefits.length === 0 ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-12 text-center border-2 border-amber-200">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-3">
                No Benefits Available
              </h3>
              <p className="text-amber-700 max-w-md mx-auto leading-relaxed">
                There are currently no active benefits available for request.
                Please check back later or contact your barangay office for more
                information.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBenefits.map((benefit) => {
                const canApply = canApplyForBenefit(benefit);
                const reason = getCannotApplyReason(benefit);
                const rejectedRequest = getRejectedRequest(benefit);

                return (
                  <div
                    key={benefit.id}
                    className={`group relative bg-white rounded-2xl shadow-lg transition-all duration-300 border overflow-hidden ${
                      canApply
                        ? "border-gray-100 hover:shadow-2xl transform hover:-translate-y-2"
                        : "border-gray-300 opacity-75"
                    }`}
                  >
                    {/* Already Applied Badge */}
                    {!canApply && (
                      <div className="absolute top-4 right-4 z-20">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Already Applied
                        </div>
                      </div>
                    )}

                    {/* Decorative Element */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full -mr-16 -mt-16 transition-transform duration-300 ${
                        canApply
                          ? "from-purple-100 to-indigo-100 group-hover:scale-125"
                          : "from-gray-100 to-gray-200"
                      }`}
                    ></div>

                    {/* Card Header with Icon */}
                    <div className="relative p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`p-2 rounded-lg ${
                                canApply ? "bg-purple-100" : "bg-gray-200"
                              }`}
                            >
                              <Gift
                                className={`w-5 h-5 ${
                                  canApply ? "text-purple-600" : "text-gray-500"
                                }`}
                              />
                            </div>
                            {benefit.benefitID && (
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {benefit.benefitID}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2">
                            {benefit.benefitName}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Cash Value Highlight */}
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border-l-4 border-emerald-500">
                        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                          Cash Value
                        </p>
                        <p className="text-3xl font-bold text-emerald-600">
                          ₱{benefit.cashValue?.toLocaleString() || "0"}
                        </p>
                      </div>

                      {/* Description */}
                      {benefit.description && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            About This Benefit
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      )}

                      {/* Requirements */}
                      {benefit.requirements && (
                        <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                                Requirements
                              </p>
                              <p className="text-sm text-blue-800 leading-relaxed">
                                {benefit.requirements}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="p-6 pt-0 space-y-3">
                      {/* Show rejection notice if previously rejected */}
                      {rejectedRequest && canApply && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-900">
                                Previous Request Rejected
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Your request on{" "}
                                {new Date(
                                  rejectedRequest.dateCreated
                                ).toLocaleDateString("en-PH")}{" "}
                                was rejected.
                                {rejectedRequest.rejectionReason &&
                                  ` Reason: ${rejectedRequest.rejectionReason}`}
                              </p>
                              <p className="text-xs text-red-600 mt-2 font-semibold">
                                You can reapply with updated documents.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show cannot apply notice */}
                      {!canApply && reason && !rejectedRequest && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-orange-900">
                                Cannot Apply
                              </p>
                              <p className="text-xs text-orange-700 mt-1">
                                {reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (canApply) {
                            setSelectedBenefit(benefit);
                            setShowRequestModal(true);
                          }
                        }}
                        disabled={!canApply}
                        className={`w-full font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          canApply
                            ? rejectedRequest
                              ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md hover:shadow-xl group cursor-pointer"
                              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-xl group cursor-pointer"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                        }`}
                      >
                        {canApply ? (
                          rejectedRequest ? (
                            <>
                              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                              Reapply for This Benefit
                            </>
                          ) : (
                            <>
                              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                              Apply for This Benefit
                            </>
                          )
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Cannot Apply
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: My Benefits History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-semibold text-lg">
                  Loading your benefit history...
                </p>
              </div>
            </div>
          ) : availedBenefits.length === 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center border-2 border-blue-200">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-3">
                No Benefits Received Yet
              </h3>
              <p className="text-blue-700 max-w-md mx-auto leading-relaxed mb-6">
                You haven't received any approved benefits yet. Check out the
                Available Benefits tab to apply for assistance programs.
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                View Available Benefits
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">
                      Total Benefits Received
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {availedBenefits.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">
                      Total Amount Received
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      ₱{stats.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">
                      This Year
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      ₱{stats.thisYearTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits List */}
              <div className="grid grid-cols-1 gap-4">
                {availedBenefits.map((benefit, index) => (
                  <div
                    key={benefit.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Side */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">
                                  {benefit.benefitName}
                                </h3>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Approved
                                </span>
                              </div>

                              {/* Benefit Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                    Amount Received
                                  </p>
                                  <p className="text-2xl font-bold text-green-600">
                                    ₱{benefit.cashValue?.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                    Date Received
                                  </p>
                                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      benefit.date || benefit.dateCreated
                                    ).toLocaleDateString("en-PH", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                {benefit.benefitID && (
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                      Benefit ID
                                    </p>
                                    <p className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                                      {benefit.benefitID}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {benefit.notes && (
                                <div className="mt-4 bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                                    Notes
                                  </p>
                                  <p className="text-sm text-blue-800">
                                    {benefit.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Counter Badge */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-600">
                              #{availedBenefits.length - index}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: My Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Action Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                My Benefit Requests
              </h3>
              <p className="text-gray-600 mt-1">
                Track the status of your benefit applications
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBenefit(null);
                setUploadedFiles([]);
                setRequestNotes("");
                setShowRequestModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Request</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-semibold text-lg">
                  Loading your requests...
                </p>
              </div>
            </div>
          ) : benefitRequests.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-12 text-center border-2 border-purple-200">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-purple-900 mb-3">
                No Pending Requests
              </h3>
              <p className="text-purple-700 max-w-md mx-auto leading-relaxed mb-6">
                You don't have any benefit requests at the moment. Start by
                applying for available benefits to receive assistance.
              </p>
              <button
                onClick={() => {
                  setSelectedBenefit(null);
                  setUploadedFiles([]);
                  setRequestNotes("");
                  setShowRequestModal(true);
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Submit a Request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {benefitRequests.map((request) => {
                const isPending = request.status?.toLowerCase() === "pending";
                const isRejected = request.status?.toLowerCase() === "rejected";
                const statusConfig = {
                  pending: {
                    bg: "bg-yellow-50",
                    border: "border-yellow-200",
                    icon: <Clock className="w-6 h-6 text-yellow-600" />,
                    badge: "bg-yellow-100 text-yellow-700",
                    iconBg: "bg-yellow-100",
                  },
                  rejected: {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    icon: <XCircle className="w-6 h-6 text-red-600" />,
                    badge: "bg-red-100 text-red-700",
                    iconBg: "bg-red-100",
                  },
                  default: {
                    bg: "bg-gray-50",
                    border: "border-gray-200",
                    icon: <AlertCircle className="w-6 h-6 text-gray-600" />,
                    badge: "bg-gray-100 text-gray-700",
                    iconBg: "bg-gray-100",
                  },
                };

                const config =
                  statusConfig[request.status?.toLowerCase()] ||
                  statusConfig.default;

                return (
                  <div
                    key={request.id}
                    className={`${config.bg} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 ${config.border} overflow-hidden`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-3 ${config.iconBg} rounded-xl`}>
                            {config.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">
                                {request.benefitName}
                              </h3>
                              <span
                                className={`px-3 py-1 ${config.badge} text-xs font-bold rounded-full flex items-center gap-1 whitespace-nowrap`}
                              >
                                {getStatusIcon(request.status)}
                                {request.status}
                              </span>
                            </div>

                            {request.referenceNumber && (
                              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                <span className="font-semibold">
                                  Reference Number:
                                </span>
                                <span className="font-mono bg-white px-2 py-1 rounded border border-gray-300">
                                  {request.referenceNumber}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Request Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            Amount
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            ₱{request.cashValue?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            Submitted
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            {new Date(request.dateCreated).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            Status
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            {request.status}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            Documents
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {request.documents?.length || 0}
                          </p>
                        </div>
                      </div>

                      {/* Rejection Notice */}
                      {isRejected && (
                        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500 mb-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-red-900 uppercase tracking-wider mb-2">
                                Request Rejected
                              </p>
                              {request.rejectionReason ? (
                                <div>
                                  <p className="text-xs text-red-700 font-semibold mb-1">
                                    Reason:
                                  </p>
                                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                                    {request.rejectionReason}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-red-800 leading-relaxed mb-3">
                                  Your request was not approved by the
                                  administrator.
                                </p>
                              )}
                              <button
                                onClick={() => {
                                  // Find the benefit in activeBenefits
                                  const benefit = activeBenefits.find(
                                    (b) =>
                                      b.id === request.benefitID ||
                                      b.benefitName === request.benefitName
                                  );
                                  if (benefit) {
                                    setSelectedBenefit(benefit);
                                    setShowRequestModal(true);
                                  } else {
                                    alert(
                                      "This benefit is no longer available."
                                    );
                                  }
                                }}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                              >
                                <Plus className="w-4 h-4" />
                                Reapply for This Benefit
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {request.notes && (
                        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400 mb-4">
                          <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                            Your Notes
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {request.notes}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      {request.documents && request.documents.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Attached Documents ({request.documents.length})
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {request.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-300 group"
                              >
                                <FileText className="w-5 h-5 text-gray-600 group-hover:text-purple-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-600 truncate">
                                    {doc.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Click to view
                                  </p>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Request Benefit Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">Request a Benefit</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedBenefit(null);
                  setUploadedFiles([]);
                  setRequestNotes("");
                }}
                className="text-white hover:bg-purple-800 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Select Benefit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Benefit *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {activeBenefits.map((benefit) => {
                    const canApply = canApplyForBenefit(benefit);
                    const reason = getCannotApplyReason(benefit);

                    return (
                      <button
                        key={benefit.id}
                        onClick={() => canApply && setSelectedBenefit(benefit)}
                        disabled={!canApply}
                        className={`p-4 rounded-lg border-2 text-left transition ${
                          !canApply
                            ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                            : selectedBenefit?.id === benefit.id
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`font-semibold ${
                                  canApply ? "text-gray-800" : "text-gray-500"
                                }`}
                              >
                                {benefit.benefitName}
                              </p>
                              {!canApply && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  N/A
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm ${
                                canApply ? "text-gray-600" : "text-gray-400"
                              }`}
                            >
                              ₱{benefit.cashValue?.toLocaleString()}
                            </p>
                            {!canApply && reason && (
                              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {reason}
                              </p>
                            )}
                          </div>
                          {canApply && (
                            <div
                              className={`w-5 h-5 rounded border-2 ${
                                selectedBenefit?.id === benefit.id
                                  ? "bg-purple-600 border-purple-600"
                                  : "border-gray-300"
                              }`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Any additional information to include with your request..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Required Documents *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium mb-2">
                    Drag and drop files here or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
                  >
                    Select Files
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedBenefit(null);
                    setUploadedFiles([]);
                    setRequestNotes("");
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={
                    submitting || !selectedBenefit || uploadedFiles.length === 0
                  }
                  className={`flex-1 px-6 py-3 font-semibold rounded-lg text-white transition ${
                    submitting || !selectedBenefit || uploadedFiles.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenefitsAndAvailmentsSection;
