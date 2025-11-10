import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, storage } from "../Services/firebase";
import { ref, get, set, update } from "firebase/database";
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import QRCode from "react-qr-code";
import {
  Download,
  LogOut,
  HelpCircle,
  CreditCard,
  Camera,
  Calendar,
  Bell,
  Edit3,
  X,
  Menu,
  QrCode as QrCodeIcon,
  Palette,
  Printer,
  Trash2,
  Plus,
} from "lucide-react";
import Verification from "../Components/VerificationModule";
import HelpTutorial from "../Components/HelpTutorial";
import DocumentsSection from "../Components/DocumentsSection";
import DashboardSidebar from "../Components/Dashboard/DashboardSidebar";
import DashboardTopBar from "../Components/Dashboard/DashboardTopBar";
import FacialRecognitionReminder from "../Components/Dashboard/FacialRecognitionReminder";
import DashboardOverviewSection from "../Components/Dashboard/DashboardOverviewSection";
import PaymentsSection from "../Components/Dashboard/PaymentsSection";
import PaymentReceiptModal from "../Components/Dashboard/PaymentReceiptModal";
import EventsSection from "../Components/Dashboard/EventsSection";
import EventDetailsModal from "../Components/Dashboard/EventDetailsModal";
import AnnouncementsSection from "../Components/Dashboard/AnnouncementsSection";
import AnnouncementDetailsModal from "../Components/Dashboard/AnnouncementDetailsModal";

const PAYMENT_MODE_OPTIONS = [
  "Cash",
  "GCash",
  "Bank Deposit",
  "Check",
  "Voucher",
];

const EVENT_STATUS_FILTERS = [
  { value: "all", label: "All Events" },
  { value: "past", label: "Past" },
  { value: "present", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "future", label: "Future" },
  { value: "attended", label: "Attended" },
  { value: "not-attended", label: "Not Attended" },
];

const parseDateInput = (value) => {
  if (!value && value !== 0) return null;
  if (typeof value === "number") {
    return new Date(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  if (value instanceof Date) {
    return value;
  }
  return null;
};

const resolvePaymentDate = (payment) => {
  if (!payment) return null;
  const dateValue =
    payment.payDate ??
    payment.paymentDate ??
    payment.date ??
    payment.dateReceived ??
    payment.dateCreated ??
    payment.date_created ??
    payment.timestamp;
  return parseDateInput(dateValue);
};

const resolvePaymentMode = (payment, index) => {
  return (
    payment.resolvedMode ??
    payment.modePay ??
    payment.paymentMode ??
    payment.mode ??
    payment.payment_mode ??
    payment.payMethod ??
    payment.method ??
    (PAYMENT_MODE_OPTIONS[index % PAYMENT_MODE_OPTIONS.length] || "Unknown")
  );
};

const formatEventSchedule = (date, time) => {
  try {
    const parsedDate = parseDateInput(date);
    if (!parsedDate) return "Date TBA";

    const dateStr = parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (time) {
      return `${dateStr} at ${time}`;
    }
    return dateStr;
  } catch (err) {
    return "Date TBA";
  }
};

const formatRelativeTime = (value) => {
  try {
    const parsed = parseDateInput(value);
    if (!parsed) return "";

    const diffMs = Date.now() - parsed.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  } catch (err) {
    return "";
  }
};

const getEventAccent = (category) => {
  const categoryLower = (category || "").toLowerCase();

  const accentMap = {
    health: { background: "bg-blue-100", icon: "text-blue-600" },
    wellness: { background: "bg-green-100", icon: "text-green-600" },
    social: { background: "bg-purple-100", icon: "text-purple-600" },
    education: { background: "bg-yellow-100", icon: "text-yellow-600" },
    recreation: { background: "bg-pink-100", icon: "text-pink-600" },
    community: { background: "bg-indigo-100", icon: "text-indigo-600" },
    fitness: { background: "bg-red-100", icon: "text-red-600" },
    activity: { background: "bg-cyan-100", icon: "text-cyan-600" },
  };

  return (
    accentMap[categoryLower] || {
      background: "bg-gray-100",
      icon: "text-gray-600",
    }
  );
};

// Helper to normalize medical conditions from string or array
const normalizeMedConditions = (medConds) => {
  if (Array.isArray(medConds)) {
    return medConds
      .map((c) => (typeof c === "string" ? c.trim() : c))
      .filter((c) => typeof c === "string" && c.length > 0);
  }
  if (typeof medConds === "string" && medConds.trim()) {
    return medConds
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }
  return [];
};

const CitizenHome = () => {
  const navigate = useNavigate();

  // State Variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [user, setUser] = useState(null);
  const [signature, setSignature] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme & UI State
  const [cardTheme, setCardTheme] = useState("blue");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Payments State
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState({
    startDate: "",
    endDate: "",
    mode: "all",
  });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Events State
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [eventAttendance, setEventAttendance] = useState({});
  const [eventAttendanceLoading, setEventAttendanceLoading] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);

  // Announcements Modal State
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // Documents State
  const [memberDocuments, setMemberDocuments] = useState([]);
  const [memberDocumentsLoading, setMemberDocumentsLoading] = useState(false);
  const [documentCategories, setDocumentCategories] = useState([]);
  const [documentCategoriesLoading, setDocumentCategoriesLoading] =
    useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] =
    useState(null);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [documentUploadFile, setDocumentUploadFile] = useState(null);
  const [documentUploadLoading, setDocumentUploadLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentViewerModal, setShowDocumentViewerModal] = useState(false);
  const [documentViewerLoading, setDocumentViewerLoading] = useState(true);

  // Benefits State
  const [activeBenefits, setActiveBenefits] = useState([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);

  // Members State
  const [allMembers, setAllMembers] = useState([]);
  const [allMembersLoading, setAllMembersLoading] = useState(false);

  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({
    name: "",
    age: "",
    relationship: "",
    address: "",
  });
  const [editingFamilyIndex, setEditingFamilyIndex] = useState(null);

  // Signature & Drawing State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // QR & ID Card State
  const qrRef = useRef(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showIDCardModal, setShowIDCardModal] = useState(false);

  // Reminders & Modals
  const [facialRecognitionReminder, setFacialRecognitionReminder] =
    useState(false);
  const [showHelpTutorial, setShowHelpTutorial] = useState(false);
  const [tutorialType, setTutorialType] = useState("dashboard");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(new Set());
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  // Activity & Inactivity
  const inactivityTimerRef = useRef(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Card Themes
  const cardThemes = {
    purple: {
      name: "Purple",
      icon: "💜",
      primary: "from-purple-500 to-purple-600",
      logo: "bg-purple-600",
      border: "border-purple-600",
      headerText: "text-white",
    },
    blue: {
      name: "Blue",
      icon: "💙",
      primary: "from-blue-500 to-blue-600",
      logo: "bg-blue-600",
      border: "border-blue-600",
      headerText: "text-white",
    },
    green: {
      name: "Green",
      icon: "💚",
      primary: "from-green-500 to-green-600",
      logo: "bg-green-600",
      border: "border-green-600",
      headerText: "text-white",
    },
    red: {
      name: "Red",
      icon: "❤️",
      primary: "from-red-500 to-red-600",
      logo: "bg-red-600",
      border: "border-red-600",
      headerText: "text-white",
    },
  };
  const currentTheme = cardThemes[cardTheme] || cardThemes.blue;

  // Initial Setup & Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          setLoading(true);
          const email = currentUser.email;
          const uid = currentUser.uid;

          // Find member by email
          const membersRef = ref(db, "members");
          const membersSnapshot = await get(membersRef);

          if (!membersSnapshot.exists()) {
            throw new Error("Members database not found");
          }

          const allMembersData = membersSnapshot.val();
          let memberData = null;
          let firebaseKey = null;

          Object.entries(allMembersData).forEach(([key, value]) => {
            if (
              value.email === email ||
              value.oscaID === email ||
              value.username === email
            ) {
              memberData = value;
              firebaseKey = key;
            }
          });

          if (!memberData || !firebaseKey) {
            throw new Error(
              "Member profile not found for your account. Please contact administrator."
            );
          }

          console.log("✅ Found member data:", memberData);
          console.log("🔑 Firebase Key:", firebaseKey);

          // Combine all data with uid
          const combinedData = {
            ...memberData,
            firebaseKey: firebaseKey,
            uid: uid,
            email: email,
          };

          setMemberData(combinedData);
          setUser({
            uid: uid,
            email: email,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            oscaID: memberData.oscaID,
          });

          // Load signature if exists
          if (memberData.signature) {
            setSignature(memberData.signature);
          }
        } catch (err) {
          console.error("Error fetching member data:", err);
          setError(
            "Connection Error: " +
              err.message +
              ". Please make sure your database is accessible."
          );
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login", { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  const fetchMemberData = async (oscaID) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching member data for oscaID:", oscaID);

      // Fetch member details from Firebase
      const memberRef = ref(db, `members/${oscaID}`);
      const memberSnapshot = await get(memberRef);

      if (!memberSnapshot.exists()) {
        throw new Error("Member profile not found in database");
      }

      const memberData = memberSnapshot.val();
      console.log("Found member data:", memberData);

      setMemberData(memberData);
      setUser({
        oscaID: oscaID,
        username: memberData.username,
      });

      // Load signature if exists
      if (memberData.signature) {
        setSignature(memberData.signature);
      }
    } catch (err) {
      console.error("Error fetching member data:", err);
      if (!navigator.onLine) {
        setError(
          "You appear to be offline. Please check your internet connection."
        );
      } else {
        setError(
          "Connection Error: " +
            err.message +
            ". Please check the Firebase database configuration."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout handler - Show confirmation
  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirmation(true);
  }, []);

  // Logout handler - Execute logout
  const handleLogout = useCallback(() => {
    console.log("🔐 [LOGOUT] Logout initiated");
    setShowLogoutConfirmation(false);
    // Sign out from Firebase
    auth
      .signOut()
      .then(() => {
        console.log("✅ [LOGOUT] Firebase sign out successful");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        console.log("✅ [LOGOUT] User data cleared from storage");
        console.log("🔄 [LOGOUT] Redirecting to login page...");
        navigate("/", { replace: true });
      })
      .catch((error) => {
        console.error("❌ [LOGOUT] Error during sign out:", error);
      });
  }, [navigate]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      if (!memberData || !notificationId) return;

      try {
        const timestamp = Date.now();
        const readNotifRef = ref(
          db,
          `readNotifs/${memberData.oscaID}/${notificationId}`
        );

        await set(readNotifRef, timestamp);

        // Update local state
        setReadNotificationIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(notificationId);
          return newSet;
        });

        console.log(
          `✅ [NOTIFICATIONS] Marked notification ${notificationId} as read`
        );
      } catch (err) {
        console.error(
          "❌ [NOTIFICATIONS] Error marking notification as read:",
          err
        );
      }
    },
    [memberData]
  );

  // Compute unread events and announcements
  const unreadEvents = useMemo(() => {
    return events.filter((event) => !readNotificationIds.has(event.id));
  }, [events, readNotificationIds]);

  const unreadAnnouncements = useMemo(() => {
    return announcements.filter(
      (announcement) => !readNotificationIds.has(announcement.id)
    );
  }, [announcements, readNotificationIds]);

  // Fetch payments for current user
  const fetchPayments = useCallback(async () => {
    if (!memberData) {
      console.log("❌ No memberData available");
      return;
    }

    console.log(
      "🔍 Fetching payments for member with OSCA ID:",
      memberData.oscaID
    );

    try {
      setPaymentsLoading(true);

      // Fetch ALL payments from the payments node
      const paymentsRef = ref(db, `payments`);
      const paymentsSnapshot = await get(paymentsRef);

      console.log("📊 Payments snapshot exists:", paymentsSnapshot.exists());

      if (paymentsSnapshot.exists()) {
        const allPaymentsData = paymentsSnapshot.val();
        console.log("📊 All payments data:", allPaymentsData);

        // Convert to array and filter by current member's oscaID
        const paymentsArray = Object.entries(allPaymentsData)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter((payment) => payment.oscaID === memberData.oscaID);

        const sortedPayments = [...paymentsArray].sort((a, b) => {
          const first = resolvePaymentDate(b)?.getTime() ?? 0;
          const second = resolvePaymentDate(a)?.getTime() ?? 0;
          return first - second;
        });

        setPayments(sortedPayments);
        console.log(
          "✅ Fetched payments for OSCA ID:",
          memberData.oscaID,
          "Count:",
          paymentsArray.length,
          "Data:",
          paymentsArray
        );
      } else {
        setPayments([]);
        console.log("⚠️ No payments node found in database");
      }
    } catch (err) {
      console.error("❌ Error fetching payments:", err);
      setError("Failed to fetch payments: " + err.message);
    } finally {
      setPaymentsLoading(false);
    }
  }, [memberData]);

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const eventsRef = ref(db, "events");
      const eventsSnapshot = await get(eventsRef);

      if (eventsSnapshot.exists()) {
        const eventsData = eventsSnapshot.val();
        const eventsArray = Object.entries(eventsData).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setEvents(eventsArray);
        console.log("✅ Fetched events:", eventsArray);
      } else {
        setEvents([]);
        console.log("⚠️ No events found in database");
      }
    } catch (err) {
      console.error("❌ Error fetching events:", err);
      setError("Failed to fetch events: " + err.message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Fetch active benefits
  const fetchBenefits = useCallback(async () => {
    try {
      setBenefitsLoading(true);
      const benefitsRef = ref(db, "benefits");
      const benefitsSnapshot = await get(benefitsRef);

      if (benefitsSnapshot.exists()) {
        const benefitsData = benefitsSnapshot.val();
        const benefitsArray = Object.entries(benefitsData)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter((benefit) => benefit.isActive === true)
          .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

        setActiveBenefits(benefitsArray);
        console.log("✅ Active benefits fetched:", benefitsArray.length);
      } else {
        setActiveBenefits([]);
        console.log("⚠️ No benefits found in database");
      }
    } catch (err) {
      console.error("❌ Error fetching benefits:", err);
      setError("Failed to fetch benefits: " + err.message);
    } finally {
      setBenefitsLoading(false);
    }
  }, []);

  // Fetch member documents for current member
  const fetchMemberDocuments = useCallback(async () => {
    if (!memberData) return;

    try {
      setMemberDocumentsLoading(true);
      const memberDocumentsRef = ref(
        db,
        `memberDocuments/${memberData.firebaseKey}`
      );
      const docsSnapshot = await get(memberDocumentsRef);

      if (docsSnapshot.exists()) {
        const docsData = docsSnapshot.val();
        const docsArray = Object.entries(docsData).map(([key, value]) => ({
          id: key,
          ...value,
        }));

        setMemberDocuments(docsArray);
        console.log("✅ Fetched member documents:", docsArray);
      } else {
        setMemberDocuments([]);
        console.log("⚠️ No member documents found");
      }
    } catch (err) {
      console.error("❌ Error fetching member documents:", err);
      setError("Failed to fetch documents: " + err.message);
    } finally {
      setMemberDocumentsLoading(false);
    }
  }, [memberData]);

  // Fetch all members from database
  const fetchAllMembers = useCallback(async () => {
    try {
      setAllMembersLoading(true);
      const membersRef = ref(db, "members");
      const membersSnapshot = await get(membersRef);

      if (membersSnapshot.exists()) {
        const membersData = membersSnapshot.val();
        const membersArray = Object.entries(membersData).map(
          ([key, value]) => ({
            firebaseKey: key,
            ...value,
          })
        );
        setAllMembers(membersArray);
        console.log("✅ Fetched all members:", membersArray.length);
      } else {
        setAllMembers([]);
        console.log("⚠️ No members found in database");
      }
    } catch (err) {
      console.error("❌ Error fetching members:", err);
      setError("Failed to fetch members: " + err.message);
    } finally {
      setAllMembersLoading(false);
    }
  }, []);

  // Fetch event attendance for current member
  const fetchEventAttendance = useCallback(async () => {
    if (!memberData) return;

    try {
      setEventAttendanceLoading(true);
      const eventsRef = ref(db, "events");
      const eventsSnapshot = await get(eventsRef);

      if (eventsSnapshot.exists()) {
        const allEventsData = eventsSnapshot.val();
        const attendanceMap = {};

        // Build map of event IDs to attendance status for current member
        Object.entries(allEventsData).forEach(([eventId, eventData]) => {
          if (eventData.attendance) {
            // Check if current member has attendance record in this event
            const memberAttendance =
              eventData.attendance[memberData.firebaseKey];
            if (memberAttendance) {
              attendanceMap[eventId] = {
                attended: memberAttendance.lastCheckedInAt ? true : false,
                checkedInAt: memberAttendance.checkedInAt,
                lastCheckedInAt: memberAttendance.lastCheckedInAt,
                firstCheckedInAt: memberAttendance.firstCheckedInAt,
                method: memberAttendance.method, // "qr", "manual", etc
                displayName: memberAttendance.displayName,
                checkedInBy: memberAttendance.checkedInBy,
              };
            }
          }
        });

        setEventAttendance(attendanceMap);
        console.log("✅ Fetched event attendance:", attendanceMap);
      } else {
        setEventAttendance({});
        console.log("⚠️ No events found");
      }
    } catch (err) {
      console.error("❌ Error fetching event attendance:", err);
      setEventAttendance({});
    } finally {
      setEventAttendanceLoading(false);
    }
  }, [memberData]);

  // Calculate event status (past, present, future, upcoming)
  const getEventStatus = (eventDate, eventTime) => {
    if (!eventDate) return "unknown";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0);

    const diffTime = eventDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "past";
    } else if (diffDays === 0) {
      return "present";
    } else if (diffDays <= 7) {
      return "upcoming";
    } else {
      return "future";
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      past: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Past Event",
        icon: "📅",
      },
      present: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Today",
        icon: "🎯",
      },
      upcoming: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "Upcoming",
        icon: "⏰",
      },
      future: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Future Event",
        icon: "🔮",
      },
      unknown: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Unknown",
        icon: "❓",
      },
    };
    return badges[status] || badges.unknown;
  };

  // Fetch document categories
  const fetchDocumentCategories = useCallback(async () => {
    try {
      setDocumentCategoriesLoading(true);
      const categoriesRef = ref(db, "documentCategories");
      const categoriesSnapshot = await get(categoriesRef);

      if (categoriesSnapshot.exists()) {
        const categoriesData = categoriesSnapshot.val();
        const categoriesArray = Object.entries(categoriesData)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter((cat) => cat.isActive !== false);

        setDocumentCategories(categoriesArray);
        console.log("✅ Fetched document categories:", categoriesArray);
      } else {
        setDocumentCategories([]);
        console.log("⚠️ No document categories found");
      }
    } catch (err) {
      console.error("❌ Error fetching document categories:", err);
      setError("Failed to fetch document categories: " + err.message);
    } finally {
      setDocumentCategoriesLoading(false);
    }
  }, []);

  // Handle document upload
  const handleDocumentUpload = async (filesToUpload) => {
    if (
      !Array.isArray(filesToUpload) ||
      filesToUpload.length === 0 ||
      !selectedDocumentCategory ||
      !memberData
    ) {
      alert("Please select a category and choose at least one file");
      return;
    }

    try {
      setDocumentUploadLoading(true);
      const files = filesToUpload;
      let successCount = 0;

      // Upload each file
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const fileName = `${
          memberData.firebaseKey
        }_${Date.now()}_${fileIndex}_${file.name}`;
        const fileRef = storageRef(
          storage,
          `memberDocuments/${memberData.firebaseKey}/${fileName}`
        );

        // Upload file using FileReader API (works for all file types)
        const base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await uploadString(fileRef, base64String, "data_url");
        const fileUrl = await getDownloadURL(fileRef);
        const storagePath = `memberDocuments/${memberData.firebaseKey}/${fileName}`;

        // Save document record to Firebase
        const docId = `${memberData.firebaseKey}_${Date.now()}_${fileIndex}`;
        const documentsRef = ref(
          db,
          `memberDocuments/${memberData.firebaseKey}/${docId}`
        );

        await set(documentsRef, {
          memberKey: memberData.firebaseKey,
          memberOscaID: memberData.oscaID,
          category: selectedDocumentCategory.name,
          categoryId: selectedDocumentCategory.id,
          categoryName: selectedDocumentCategory.name,
          name: file.name,
          downloadURL: fileUrl,
          contentType: file.type,
          size: file.size,
          storagePath: storagePath,
          uploadedAt: Date.now(),
          uploadedBy: memberData.firstName + " " + memberData.lastName,
          uploadedById: memberData.firebaseKey,
          notes: "",
        });

        successCount++;
      }

      // Reset form
      setSelectedDocumentCategory(null);
      setShowDocumentUploadModal(false);

      alert(`${successCount} file(s) uploaded successfully!`);
      fetchMemberDocuments();
    } catch (err) {
      console.error("❌ Error uploading documents:", err);
      alert("Failed to upload documents: " + err.message);
    } finally {
      setDocumentUploadLoading(false);
    }
  };

  // Fetch payments when memberData or activeSection changes
  useEffect(() => {
    if (memberData && activeSection === "payments") {
      fetchPayments();
    }
  }, [memberData, activeSection, fetchPayments]);

  // Fetch events and attendance when section changes
  useEffect(() => {
    if (activeSection === "events") {
      fetchEvents();
      fetchEventAttendance();
    }
  }, [activeSection, fetchEvents, fetchEventAttendance]);

  // Fetch documents and categories when section changes
  useEffect(() => {
    if (activeSection === "documents") {
      fetchDocumentCategories();
      fetchMemberDocuments();
    }
  }, [activeSection, fetchDocumentCategories, fetchMemberDocuments]);

  // Fetch benefits when section changes
  useEffect(() => {
    if (activeSection === "benefits") {
      fetchBenefits();
    }
  }, [activeSection, fetchBenefits]);

  // Fetch benefits on component mount for dashboard overview
  useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  const decoratedPayments = useMemo(() => {
    if (!payments?.length) return [];

    return payments.map((payment, index) => {
      const paymentDate = resolvePaymentDate(payment);
      const resolvedMode = resolvePaymentMode(payment, index);
      const resolvedReference =
        payment?.reference ??
        payment?.referenceNo ??
        payment?.reference_no ??
        payment?.referenceNumber ??
        payment?.referenceID ??
        payment?.referenceId ??
        payment?.reference_code ??
        payment?.referenceCode ??
        payment?.receiptNo ??
        payment?.receipt_no ??
        payment?.receiptNumber ??
        payment?.transactionId ??
        payment?.transactionID ??
        payment?.transactionNumber ??
        payment?.id ??
        null;
      const resolvedReferenceString =
        resolvedReference !== null && resolvedReference !== undefined
          ? String(resolvedReference)
          : "";
      const referenceLabel = resolvedReferenceString
        ? resolvedReferenceString.length > 14
          ? `${resolvedReferenceString.slice(
              0,
              10
            )}…${resolvedReferenceString.slice(-2)}`
          : resolvedReferenceString
        : null;

      return {
        ...payment,
        paymentDate,
        resolvedMode,
        resolvedModeKey: resolvedMode?.toLowerCase() ?? "",
        resolvedReference: resolvedReferenceString || null,
        referenceLabel,
      };
    });
  }, [payments]);

  const availablePaymentModes = useMemo(() => {
    const modes = new Set(
      PAYMENT_MODE_OPTIONS.map((mode) => mode.trim()).filter(Boolean)
    );

    decoratedPayments.forEach((payment) => {
      if (payment.resolvedMode) {
        modes.add(payment.resolvedMode);
      }
    });

    return Array.from(modes);
  }, [decoratedPayments]);

  const filteredPayments = useMemo(() => {
    if (!decoratedPayments.length) return [];

    const startDate = paymentFilters.startDate
      ? parseDateInput(paymentFilters.startDate)
      : null;
    const endDate = paymentFilters.endDate
      ? parseDateInput(paymentFilters.endDate)
      : null;

    const startTime = startDate ? startDate.getTime() : null;
    const endTime = endDate ? endDate.getTime() + 86_399_999 : null; // inclusive end of day
    const modeFilter = paymentFilters.mode?.toLowerCase() ?? "all";

    return decoratedPayments.filter((payment) => {
      const paymentTime = payment.paymentDate?.getTime();

      if (startTime && (paymentTime ?? -Infinity) < startTime) {
        return false;
      }

      if (endTime && (paymentTime ?? Infinity) > endTime) {
        return false;
      }

      if (modeFilter !== "all" && payment.resolvedModeKey !== modeFilter) {
        return false;
      }

      return true;
    });
  }, [decoratedPayments, paymentFilters]);

  const totalFilteredAmount = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => {
      const amount = parseFloat(payment.amount ?? payment.payAmount ?? "0");
      return sum + (Number.isNaN(amount) ? 0 : amount);
    }, 0);
  }, [filteredPayments]);

  const nextPaymentDate = useMemo(() => {
    if (!decoratedPayments.length) return null;

    const sortedTimes = decoratedPayments
      .map((payment) => payment.paymentDate?.getTime())
      .filter((time) => typeof time === "number" && !Number.isNaN(time))
      .sort((a, b) => b - a);

    if (!sortedTimes.length) return null;

    const next = new Date(sortedTimes[0]);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [decoratedPayments]);

  const filtersApplied = Boolean(
    paymentFilters.startDate ||
      paymentFilters.endDate ||
      (paymentFilters.mode && paymentFilters.mode !== "all")
  );

  const handleFilterChange = (field, value) => {
    setPaymentFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetPaymentFilters = () => {
    setPaymentFilters({
      startDate: "",
      endDate: "",
      mode: "all",
    });
  };

  const handleOpenReceiptModal = (payment) => {
    setSelectedReceipt(payment);
    setShowReceiptModal(true);
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedReceipt(null);
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setDocumentViewerLoading(true);
    setShowDocumentViewerModal(true);
  };

  const handleCloseDocumentViewer = () => {
    setShowDocumentViewerModal(false);
    setSelectedDocument(null);
    setDocumentViewerLoading(true);
  };

  const handleDownloadDocument = (doc) => {
    if (!doc || !doc.downloadURL) return;

    // Create a temporary link element
    const link = window.document.createElement("a");
    link.href = doc.downloadURL;
    link.download = doc.name || "document";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    // Append to body, click, and remove
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleDownloadReceipt = () => {
    if (!selectedReceipt || !memberData) return;

    const paymentDateLabel = selectedReceipt.paymentDate
      ? selectedReceipt.paymentDate.toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

    const amountValue = parseFloat(
      selectedReceipt.amount ?? selectedReceipt.payAmount ?? "0"
    );
    const formattedAmount = Number.isNaN(amountValue)
      ? "0.00"
      : amountValue.toFixed(2);

    // Create canvas for receipt image
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Header background
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(20, 20, canvas.width - 40, 120);

    // Header text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ELDEREASE", canvas.width / 2, 75);
    ctx.font = "bold 28px Arial";
    ctx.fillText("Payment Receipt", canvas.width / 2, 115);

    // Reset text color
    ctx.fillStyle = "#1f2937";
    ctx.textAlign = "left";

    let yPos = 180;
    const leftMargin = 60;
    const lineHeight = 40;

    // Receipt details
    const details = [
      {
        label: "Member Name:",
        value: `${memberData.firstName ?? ""} ${
          memberData.lastName ?? ""
        }`.trim(),
      },
      { label: "OSCA ID:", value: memberData.oscaID ?? "N/A" },
      { label: "Payment Date:", value: paymentDateLabel },
      { label: "Amount Paid:", value: `₱${formattedAmount}`, highlight: true },
      {
        label: "Mode of Payment:",
        value: selectedReceipt.resolvedMode ?? "Not specified",
      },
      {
        label: "Status:",
        value:
          selectedReceipt.payment_status ??
          selectedReceipt.status ??
          "Not specified",
      },
      {
        label: "Reference:",
        value:
          selectedReceipt.resolvedReference ??
          selectedReceipt.id ??
          "Not provided",
      },
      {
        label: "Description:",
        value:
          selectedReceipt.payDesc ??
          selectedReceipt.description ??
          "No description",
      },
    ];

    details.forEach((item, index) => {
      // Label
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(item.label, leftMargin, yPos);

      // Value
      if (item.highlight) {
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "#10b981";
      } else {
        ctx.font = "20px Arial";
        ctx.fillStyle = "#1f2937";
      }
      ctx.fillText(item.value, leftMargin, yPos + 30);

      yPos += item.highlight ? 80 : 70;
    });

    // Divider line
    yPos += 20;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, yPos);
    ctx.lineTo(canvas.width - 60, yPos);
    ctx.stroke();

    // Footer
    yPos += 50;
    ctx.font = "16px Arial";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.fillText(
      `Generated on: ${new Date().toLocaleString()}`,
      canvas.width / 2,
      yPos
    );
    ctx.fillText("Thank you for your payment!", canvas.width / 2, yPos + 30);
    ctx.fillText(
      "This is an official receipt from ElderEase",
      canvas.width / 2,
      yPos + 60
    );

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const rawId =
        selectedReceipt.resolvedReference ??
        selectedReceipt.id ??
        Date.now().toString();
      const safeId = String(rawId)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
      link.href = url;
      link.download = `elderease-receipt-${memberData.oscaID}-${safeId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  // Check privacy acceptance and show modal if not accepted
  useEffect(() => {
    const privacyAcceptedLocal = localStorage.getItem(
      "elderease_privacy_accepted"
    );
    if (!privacyAcceptedLocal) {
      setShowPrivacyModal(true);
    } else {
      setPrivacyAccepted(true);
    }
  }, []);

  // Session timeout - auto logout after 30 minutes of inactivity
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const handleActivity = () => {
      setLastActivityTime(Date.now());
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      inactivityTimerRef.current = setTimeout(() => {
        console.warn("🔐 Session timeout due to inactivity");
        setSessionTimeout(
          "Your session has expired due to inactivity. Please login again."
        );
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Add activity listeners
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    handleActivity(); // Initialize timer

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [handleLogout]);

  // Check for facial recognition reminder (every 3 months)
  useEffect(() => {
    if (!memberData) return;

    const lastFacialRecognitionDate = memberData.lastFacialRecognition
      ? new Date(memberData.lastFacialRecognition)
      : null;

    const today = new Date();
    const threeMonthsAgo = new Date(today.setMonth(today.getMonth() - 3));

    if (
      !lastFacialRecognitionDate ||
      lastFacialRecognitionDate < threeMonthsAgo
    ) {
      setFacialRecognitionReminder(true);
    }
  }, [memberData]);

  // Load and check notifications
  useEffect(() => {
    if (!memberData) return;

    const loadNotifications = async () => {
      try {
        const notificationsRef = ref(db, `notifications/${memberData.oscaID}`);
        const notificationsSnapshot = await get(notificationsRef);

        if (notificationsSnapshot.exists()) {
          const notificationsData = notificationsSnapshot.val();
          const notificationsArray = Array.isArray(notificationsData)
            ? notificationsData.filter((n) => n)
            : Object.entries(notificationsData).map(([key, value]) => ({
                id: key,
                ...value,
              }));

          setNotifications(notificationsArray);
        }

        // Load read notifications
        const readNotifsRef = ref(db, `readNotifs/${memberData.oscaID}`);
        const readNotifsSnapshot = await get(readNotifsRef);

        if (readNotifsSnapshot.exists()) {
          const readNotifsData = readNotifsSnapshot.val();
          const readIds = new Set(Object.keys(readNotifsData));
          setReadNotificationIds(readIds);
          console.log(
            "📖 [NOTIFICATIONS] Loaded read notifications:",
            readIds.size
          );
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    };

    loadNotifications();
  }, [memberData]);

  useEffect(() => {
    let isMounted = true;

    const normaliseCollection = (payload) => {
      if (!payload) return [];
      if (Array.isArray(payload)) {
        return payload
          .map((item, index) => {
            if (!item) return null;
            return {
              id: item.id ?? item.key ?? `item-${index}`,
              ...item,
            };
          })
          .filter(Boolean);
      }

      if (typeof payload === "object") {
        return Object.entries(payload)
          .map(([key, value]) => {
            if (!value) return null;
            return {
              id: value.id ?? value.key ?? key,
              ...value,
            };
          })
          .filter(Boolean);
      }

      return [];
    };

    const loadCommunityContent = async () => {
      setEventsLoading(true);
      setAnnouncementsLoading(true);

      try {
        const [eventsSnapshot, announcementsSnapshot] = await Promise.all([
          get(ref(db, "events")),
          get(ref(db, "announcements")),
        ]);

        if (!isMounted) return;

        if (eventsSnapshot.exists()) {
          const rawEvents = normaliseCollection(eventsSnapshot.val());
          const mappedEvents = rawEvents
            .map((eventItem, index) => {
              const scheduleValue =
                eventItem.date ??
                eventItem.eventDate ??
                eventItem.schedule ??
                eventItem.datetime ??
                eventItem.timestamp ??
                eventItem.startDate ??
                null;

              const timestamp =
                parseDateInput(scheduleValue)?.getTime() ??
                (typeof scheduleValue === "number" ? scheduleValue : null);

              return {
                id: eventItem.id ?? `event-${index}`,
                title:
                  eventItem.title ??
                  eventItem.name ??
                  eventItem.eventName ??
                  "Community Event",
                description:
                  eventItem.description ??
                  eventItem.details ??
                  eventItem.message ??
                  "Stay tuned for more information.",
                date: scheduleValue,
                time:
                  eventItem.time ??
                  eventItem.eventTime ??
                  eventItem.scheduleTime ??
                  eventItem.timeStart ??
                  "",
                location:
                  eventItem.location ??
                  eventItem.venue ??
                  eventItem.place ??
                  "",
                category: eventItem.category ?? eventItem.type ?? "general",
                timestamp,
              };
            })
            .sort((a, b) => {
              const first = b.timestamp ?? 0;
              const second = a.timestamp ?? 0;
              return first - second;
            });

          setEvents(mappedEvents);
        } else {
          setEvents([]);
        }

        if (announcementsSnapshot.exists()) {
          const rawAnnouncements = normaliseCollection(
            announcementsSnapshot.val()
          );

          const mappedAnnouncements = rawAnnouncements
            .map((announcementItem, index) => {
              const timestampValue =
                announcementItem.timestamp ??
                announcementItem.date ??
                announcementItem.createdAt ??
                announcementItem.publishedAt ??
                null;

              const timestamp =
                parseDateInput(timestampValue)?.getTime() ??
                (typeof timestampValue === "number" ? timestampValue : null);

              return {
                id: announcementItem.id ?? `announcement-${index}`,
                title:
                  announcementItem.title ??
                  announcementItem.subject ??
                  announcementItem.heading ??
                  "Community Update",
                message:
                  announcementItem.message ??
                  announcementItem.description ??
                  announcementItem.body ??
                  "",
                timestamp,
                rawTimestamp: timestampValue,
              };
            })
            .sort((a, b) => {
              const first = b.timestamp ?? 0;
              const second = a.timestamp ?? 0;
              return first - second;
            });

          setAnnouncements(mappedAnnouncements);
        } else {
          setAnnouncements([]);
        }
      } catch (err) {
        console.error("Error loading community content:", err);
        if (isMounted) {
          setEvents([]);
          setAnnouncements([]);
        }
      } finally {
        if (isMounted) {
          setEventsLoading(false);
          setAnnouncementsLoading(false);
        }
      }
    };

    loadCommunityContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const getImagePath = (imagePath) => {
    if (!imagePath || imagePath === "null") return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `/profile/${imagePath.replace(/^\/?profile\/?/, "")}`;
  };

  // Accept privacy policy
  const handlePrivacyAccept = () => {
    localStorage.setItem("elderease_privacy_accepted", "true");
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
  };

  // Dismiss notification
  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  // Mark facial recognition as completed
  const markFacialRecognitionComplete = async () => {
    if (!memberData) return;

    try {
      const memberRef = ref(db, `members/${memberData.firebaseKey}`);
      await update(memberRef, {
        lastFacialRecognition: new Date().toISOString(),
      });

      setFacialRecognitionReminder(false);
      setMemberData({
        ...memberData,
        lastFacialRecognition: new Date().toISOString(),
      });

      console.log("✅ Facial recognition date updated");
    } catch (err) {
      console.error("Error updating facial recognition date:", err);
    }
  };

  // Open edit modal with current member data
  const openEditModal = () => {
    setEditFormData({
      // Personal Information
      firstName: memberData.firstName || "",
      lastName: memberData.lastName || "",
      address: memberData.address || "",
      birthday: memberData.birthday || "",
      contactNum: memberData.contactNum || "",
      email: memberData.email || "",
      img: memberData.img || "",
      // Demographic Information
      age: memberData.age || "",
      citizenship: memberData.citizenship || "",
      civilStat: memberData.civilStat || "",
      gender: memberData.gender || "",
      bloodType: memberData.bloodType || "",
      educAttain: memberData.educAttain || "",
      // Health & Medical Information
      disabilities: memberData.disabilities || "",
      bedridden: memberData.bedridden || "",
      dswdPensioner: memberData.dswdPensioner || "",
      dswdWithATM: memberData.dswdWithATM || "",
      // Emergency Contact Information
      emergencyContactName: memberData.emergencyContactName || "",
      emergencyContactNum: memberData.emergencyContactNum || "",
      emergencyContactAddress: memberData.emergencyContactAddress || "",
      emergencyContactRelation: memberData.emergencyContactRelation || "",
      // Barangay & ID Information
      barangay: memberData.barangay || "",
      placeOfBirth: memberData.placeOfBirth || "",
      middleName: memberData.middleName || "",
      suffix: memberData.suffix || "",
      nationalId: memberData.nationalId || "",
      idBookletNum: memberData.idBookletNum || "",
      // Government IDs & Numbers
      oscaID: memberData.oscaID || "",
      sssId: memberData.sssId || "",
      philHealth: memberData.philHealth || "",
      tin: memberData.tin || "",
      ncscNum: memberData.ncscNum || "",
      // Medical Information
      medConditions: normalizeMedConditions(memberData.medConditions),
      healthRecords: memberData.healthRecords || "",
      healthFacility: memberData.healthFacility || "",
      emergencyHospital: memberData.emergencyHospital || "",
      // Additional Information
      nationality: memberData.nationality || "",
      religion: memberData.religion || "",
      localSeniorPensioner: memberData.localSeniorPensioner || "",
      precinctNo: memberData.precinctNo || "",
      // Family Members
      familyMembers: memberData.familyMembers || [],
    });
    setNewFamilyMember({
      name: "",
      age: "",
      relationship: "",
      address: "",
    });
    setEditingFamilyIndex(null);
    setShowEditModal(true);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Medical Conditions Array Handlers
  const addMedCondition = () => {
    setEditFormData((prev) => ({
      ...prev,
      medConditions: [...(prev.medConditions || []), ""],
    }));
  };

  const updateMedCondition = (index, value) => {
    setEditFormData((prev) => ({
      ...prev,
      medConditions: prev.medConditions.map((cond, i) =>
        i === index ? value : cond
      ),
    }));
  };

  const removeMedCondition = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      medConditions: prev.medConditions.filter((_, i) => i !== index),
    }));
  };

  // Save edited information
  const saveEditedInfo = async () => {
    try {
      setEditLoading(true);
      const memberRef = ref(db, `members/${memberData.firebaseKey}`);
      let imgUrl = memberData.img;

      // Upload profile picture if changed
      if (editFormData.img && editFormData.img.startsWith("data:")) {
        try {
          const fileName = `${memberData.firebaseKey}.jpg`;
          const fileRef = storageRef(storage, `member-photos/${fileName}`);
          await uploadString(fileRef, editFormData.img, "data_url");
          // Get the download URL
          imgUrl = await getDownloadURL(fileRef);
          console.log("✅ Profile picture uploaded:", imgUrl);
        } catch (uploadErr) {
          console.error("Error uploading image:", uploadErr);
          alert("Failed to upload profile picture. Please try again.");
          setEditLoading(false);
          return;
        }
      }

      await update(memberRef, {
        // Personal Information
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        address: editFormData.address,
        birthday: editFormData.birthday,
        contactNum: editFormData.contactNum,
        email: editFormData.email,
        img: imgUrl,
        // Demographic Information
        age: editFormData.age || null,
        citizenship: editFormData.citizenship || null,
        civilStat: editFormData.civilStat || null,
        gender: editFormData.gender || null,
        bloodType: editFormData.bloodType || null,
        educAttain: editFormData.educAttain || null,
        // Health & Medical Information
        disabilities: editFormData.disabilities || null,
        bedridden: editFormData.bedridden || null,
        dswdPensioner: editFormData.dswdPensioner || null,
        dswdWithATM: editFormData.dswdWithATM || null,
        // Emergency Contact Information
        emergencyContactName: editFormData.emergencyContactName || null,
        emergencyContactNum: editFormData.emergencyContactNum || null,
        emergencyContactAddress: editFormData.emergencyContactAddress || null,
        emergencyContactRelation: editFormData.emergencyContactRelation || null,
        // Barangay & ID Information
        barangay: editFormData.barangay || null,
        placeOfBirth: editFormData.placeOfBirth || null,
        middleName: editFormData.middleName || null,
        suffix: editFormData.suffix || null,
        nationalId: editFormData.nationalId || null,
        idBookletNum: editFormData.idBookletNum || null,
        // Government IDs & Numbers
        oscaID: editFormData.oscaID || null,
        sssId: editFormData.sssId || null,
        philHealth: editFormData.philHealth || null,
        tin: editFormData.tin || null,
        ncscNum: editFormData.ncscNum || null,
        // Medical Information
        medConditions:
          Array.isArray(editFormData.medConditions) &&
          editFormData.medConditions.length > 0
            ? editFormData.medConditions.filter((c) => c.trim()).join(", ")
            : null,
        healthRecords: editFormData.healthRecords || null,
        healthFacility: editFormData.healthFacility || null,
        emergencyHospital: editFormData.emergencyHospital || null,
        // Additional Information
        nationality: editFormData.nationality || null,
        religion: editFormData.religion || null,
        localSeniorPensioner: editFormData.localSeniorPensioner || null,
        precinctNo: editFormData.precinctNo || null,
        // Family Members
        familyMembers: editFormData.familyMembers || [],
        // Metadata
        date_updated: new Date().toISOString(),
      });

      // Update local state with all fields
      setMemberData((prev) => ({
        ...prev,
        // Personal Information
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        address: editFormData.address,
        birthday: editFormData.birthday,
        contactNum: editFormData.contactNum,
        email: editFormData.email,
        img: imgUrl,
        // Demographic Information
        age: editFormData.age,
        citizenship: editFormData.citizenship,
        civilStat: editFormData.civilStat,
        gender: editFormData.gender,
        bloodType: editFormData.bloodType,
        educAttain: editFormData.educAttain,
        // Health & Medical Information
        disabilities: editFormData.disabilities,
        bedridden: editFormData.bedridden,
        dswdPensioner: editFormData.dswdPensioner,
        dswdWithATM: editFormData.dswdWithATM,
        // Emergency Contact Information
        emergencyContactName: editFormData.emergencyContactName,
        emergencyContactNum: editFormData.emergencyContactNum,
        emergencyContactAddress: editFormData.emergencyContactAddress,
        emergencyContactRelation: editFormData.emergencyContactRelation,
        // Barangay & ID Information
        barangay: editFormData.barangay,
        placeOfBirth: editFormData.placeOfBirth,
        middleName: editFormData.middleName,
        suffix: editFormData.suffix,
        nationalId: editFormData.nationalId,
        idBookletNum: editFormData.idBookletNum,
        // Government IDs & Numbers
        oscaID: editFormData.oscaID,
        sssId: editFormData.sssId,
        philHealth: editFormData.philHealth,
        tin: editFormData.tin,
        ncscNum: editFormData.ncscNum,
        // Medical Information
        medConditions:
          Array.isArray(editFormData.medConditions) &&
          editFormData.medConditions.length > 0
            ? editFormData.medConditions.filter((c) => c.trim()).join(", ")
            : null,
        healthRecords: editFormData.healthRecords,
        healthFacility: editFormData.healthFacility,
        emergencyHospital: editFormData.emergencyHospital,
        // Additional Information
        nationality: editFormData.nationality,
        religion: editFormData.religion,
        localSeniorPensioner: editFormData.localSeniorPensioner,
        precinctNo: editFormData.precinctNo,
        // Family Members
        familyMembers: editFormData.familyMembers,
      }));

      setShowEditModal(false);
      alert("Personal information updated successfully!");
    } catch (err) {
      console.error("Error saving edited info:", err);
      alert("Failed to save changes: " + err.message);
    } finally {
      setEditLoading(false);
    }
  };
  // Signature Pad Functions
  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    // Check if it's a touch event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    // Mouse event
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    const coords = getCoordinates(e, canvas);
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch devices
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const coords = getCoordinates(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL("image/png");

    try {
      // Save signature to Firebase using firebaseKey
      const memberRef = ref(db, `members/${memberData.firebaseKey}`);
      await update(memberRef, {
        signature: signatureData,
      });

      setSignature(signatureData);
      setShowSignatureModal(false);
      alert("Signature saved successfully!");
      // Refresh data
      if (memberData.firebaseKey) {
        fetchMemberData(memberData.firebaseKey);
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      alert("Error saving signature. Please try again.");
    }
  };

  // QR Code Download Function
  const downloadQRCode = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 512, 512);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Code-${memberData.oscaID}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // Download QR Code as SVG
  const downloadQRCodeSVG = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const downloadLink = document.createElement("a");
    downloadLink.download = `QR-Code-${memberData.oscaID}.svg`;
    downloadLink.href = "data:image/svg+xml;base64," + btoa(svgData);
    downloadLink.click();
  };

  // Print Smart ID function
  const printSmartID = () => {
    const smartIdElement = document.querySelector("[data-smart-id-print]");
    if (!smartIdElement) return;

    // Convert all images to data URLs or use absolute paths
    const processElement = async (element) => {
      const images = element.querySelectorAll("img");
      for (const img of images) {
        try {
          if (!img.src.startsWith("data:") && !img.src.startsWith("http")) {
            // Convert relative paths to absolute
            const absoluteUrl = new URL(img.src, window.location.origin).href;
            img.src = absoluteUrl;
          }
        } catch (e) {
          console.warn("Could not process image:", img.src);
        }
      }
    };

    const clone = smartIdElement.cloneNode(true);
    processElement(clone);

    // Convert Tailwind classes to inline styles
    const convertToInlineStyles = (element) => {
      if (!(element instanceof HTMLElement)) return;

      const computed = window.getComputedStyle(element);
      const important = [
        "display",
        "width",
        "height",
        "padding",
        "margin",
        "border",
        "background",
        "color",
        "font-size",
        "font-weight",
        "text-align",
        "flex-direction",
        "gap",
        "align-items",
        "justify-content",
        "overflow",
        "aspect-ratio",
        "border-radius",
        "box-shadow",
        "flex",
        "flex-shrink",
        "min-width",
        "max-width",
        "line-height",
        "text-transform",
        "line-clamp",
        "object-fit",
        "object-cover",
      ];

      important.forEach((prop) => {
        const value = computed.getPropertyValue(prop);
        if (value) {
          element.style.setProperty(prop, value, "important");
        }
      });

      // Recursively apply to children
      for (let child of element.children) {
        convertToInlineStyles(child);
      }
    };

    convertToInlineStyles(clone);

    const printFrame = document.createElement("iframe");
    printFrame.style.cssText = `
      position: fixed;
      right: -10000px;
      bottom: -10000px;
      width: 8.5in;
      height: 11in;
      border: none;
    `;
    document.body.appendChild(printFrame);

    const frameDocument =
      printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDocument) {
      document.body.removeChild(printFrame);
      return;
    }

    // Create print HTML with Tailwind CSS
    const printHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart ID Card</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      * {
        box-sizing: border-box;
      }
      
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100%;
        background: white;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
      
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      
      .print-wrapper {
        display: flex;
        flex-direction: column;
        gap: 30px;
        align-items: center;
        padding: 20px;
        width: 100%;
      }
      
      .smart-id-card {
        width: 100% !important;
        max-width: 650px !important;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      img {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        max-width: 100%;
        height: auto;
      }
      
      h3 {
        display: none !important;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        
        .print-wrapper {
          padding: 0;
          gap: 20mm;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-wrapper">
      ${clone.outerHTML}
    </div>
  </body>
</html>`;

    frameDocument.open();
    frameDocument.write(printHTML);
    frameDocument.close();

    const cleanup = () => {
      try {
        if (printFrame && printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      } catch (e) {
        console.error("Error cleaning up print frame:", e);
      }
    };

    const triggerPrint = () => {
      try {
        const frameWindow = printFrame.contentWindow;
        if (!frameWindow) {
          cleanup();
          return;
        }

        frameWindow.focus();

        // Wait a bit for content to fully render
        setTimeout(() => {
          frameWindow.print();

          // Setup cleanup handlers
          frameWindow.onafterprint = cleanup;
          setTimeout(cleanup, 2000);
        }, 300);
      } catch (e) {
        console.error("Error printing:", e);
        cleanup();
      }
    };

    // Wait for iframe to load content before printing
    setTimeout(triggerPrint, 500);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Loading member data...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Connecting to database...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMemberData}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="w-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">
            No member data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div
        className={
          (isSidebarOpen
            ? "flex fixed inset-y-0 left-0 z-40 w-[85vw] max-w-sm shadow-2xl"
            : "hidden") +
          " lg:flex lg:w-72 xl:w-80 bg-white border-b border-gray-200 lg:border-b-0 lg:border-r shadow-sm lg:sticky lg:top-0 lg:h-screen lg:z-30"
        }
      >
        <div className="flex h-full w-full flex-col">
          <DashboardSidebar
            memberData={memberData}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onLogout={handleLogoutClick}
            onShowQR={() => setShowQRModal(true)}
            onClose={() => setIsSidebarOpen(false)}
            getImagePath={getImagePath}
          />
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
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
                {activeSection === "dashboard" && "Dashboard"}
                {activeSection === "payments" && "Payments"}
                {activeSection === "verification" && "Verification"}
                {activeSection === "events" && "Events"}
                {activeSection === "documents" && "Documents"}
                {activeSection === "benefits" && "Active Benefits"}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
              <button
                onClick={() => {
                  setTutorialType(activeSection);
                  setShowHelpTutorial(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition relative"
                title="Help & Tutorial"
              >
                <HelpCircle className="w-6 h-6 text-gray-600" />
              </button>

              {/* QR Code Icon Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition relative"
                title="View QR Code"
              >
                <QrCodeIcon className="w-6 h-6 text-gray-600" />
              </button>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg transition relative group"
                title="Notifications"
              >
                <Bell className="w-6 h-6 text-gray-600 group-hover:text-purple-600 transition" />
                {(unreadEvents.length > 0 ||
                  unreadAnnouncements.length > 0) && (
                  <div className="absolute top-0 right-0 flex items-center justify-center">
                    <span className="absolute inline-flex items-center justify-center w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold rounded-full ring-2 ring-white animate-pulse shadow-lg">
                      {unreadEvents.length + unreadAnnouncements.length}
                    </span>
                  </div>
                )}
              </button>
              <button
                onClick={openEditModal}
                className="relative group"
                title="Edit Profile"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 ring-2 ring-transparent hover:ring-blue-500 transition-all">
                  {memberData.img ? (
                    <img
                      src={getImagePath(memberData.img)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">${memberData.firstName.charAt(
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
                {/* Edit icon on hover */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
              </button>
            </div>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="mt-4 lg:mt-0 lg:absolute lg:top-full lg:right-8 lg:translate-y-3 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 z-[1000] w-full sm:w-[450px] max-w-[calc(100vw-2rem)] max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    🔔 Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {unreadEvents.length + unreadAnnouncements.length} unread •{" "}
                    {events.length + announcements.length} total
                  </p>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              {events.length === 0 && announcements.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 mb-2">
                    No new updates yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Check back soon for events and announcements
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Events Section */}
                  {events.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-purple-600 uppercase mb-2">
                        📅 Events ({unreadEvents.length} unread)
                      </p>
                      {events.slice(0, 3).map((event) => {
                        const isRead = readNotificationIds.has(event.id);
                        return (
                          <div
                            key={event.id}
                            className={`p-4 bg-gradient-to-br ${
                              isRead
                                ? "from-gray-50 to-gray-100 border-gray-200"
                                : "from-purple-50 to-blue-50 border-purple-200"
                            } rounded-xl border-2 hover:shadow-md transition cursor-pointer group relative`}
                            onClick={() => {
                              markNotificationAsRead(event.id);
                              setActiveSection("events");
                              setShowNotifications(false);
                            }}
                          >
                            {!isRead && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                            <div className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0">📌</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition truncate">
                                  {event.title || "Event"}
                                </p>
                                {event.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                                <p className="text-xs text-purple-600 font-medium mt-2">
                                  📅{" "}
                                  {event.date
                                    ? new Date(event.date).toLocaleDateString()
                                    : "Date TBA"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {events.length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          +{events.length - 3} more event(s)
                        </p>
                      )}
                    </>
                  )}

                  {/* Announcements Section */}
                  {announcements.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-blue-600 uppercase mb-2 mt-4">
                        📢 Announcements ({unreadAnnouncements.length} unread)
                      </p>
                      {announcements.slice(0, 3).map((announcement) => {
                        const isRead = readNotificationIds.has(announcement.id);
                        return (
                          <div
                            key={announcement.id}
                            className={`p-4 bg-gradient-to-br ${
                              isRead
                                ? "from-gray-50 to-gray-100 border-gray-200"
                                : "from-blue-50 to-cyan-50 border-blue-200"
                            } rounded-xl border-2 hover:shadow-md transition cursor-pointer group relative`}
                            onClick={() => {
                              markNotificationAsRead(announcement.id);
                              setActiveSection("dashboard");
                              setShowNotifications(false);
                            }}
                          >
                            {!isRead && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                            <div className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0">📣</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition truncate">
                                  {announcement.title || "Announcement"}
                                </p>
                                {announcement.content && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {announcement.content}
                                  </p>
                                )}
                                <p className="text-xs text-blue-600 font-medium mt-2">
                                  📅{" "}
                                  {announcement.createdAt
                                    ? new Date(
                                        announcement.createdAt
                                      ).toLocaleDateString()
                                    : "Recently"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {announcements.length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          +{announcements.length - 3} more announcement(s)
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Facial Recognition Reminder */}
          {facialRecognitionReminder && (
            <div className="fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-2xl p-6 z-[999] max-w-sm animate-pulse">
              <div className="flex items-start gap-4">
                <Camera className="w-6 h-6 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    Facial Recognition Required
                  </h3>
                  <p className="text-sm mt-2 opacity-90">
                    It's been 3 months since your last facial verification.
                    Please complete the facial recognition process to verify
                    you're active.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setActiveSection("verification");
                        setFacialRecognitionReminder(false);
                      }}
                      className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Verify Now
                    </button>
                    <button
                      onClick={() => setFacialRecognitionReminder(false)}
                      className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition"
                    >
                      Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        {activeSection === "dashboard" && (
          <DashboardOverviewSection
            memberData={memberData}
            events={events}
            eventsLoading={eventsLoading}
            announcements={announcements}
            announcementsLoading={announcementsLoading}
            formatEventSchedule={formatEventSchedule}
            formatRelativeTime={formatRelativeTime}
            getEventAccent={getEventAccent}
            getImagePath={getImagePath}
            onNavigate={setActiveSection}
            activeBenefits={activeBenefits}
            onSelectEvent={(event) => {
              setSelectedEventDetails({
                event,
                status: "upcoming",
                attendance: null,
              });
              setShowEventDetailsModal(true);
            }}
            onSelectAnnouncement={(announcement) => {
              setSelectedAnnouncement(announcement);
              setShowAnnouncementModal(true);
            }}
          />
        )}

        {/* verification */}
        {activeSection === "verification" && (
          <Verification memberData={memberData} getImagePath={getImagePath} />
        )}

        {/* Payments Section */}
        {activeSection === "payments" && (
          <div className="p-8">
            <PaymentsSection
              paymentsLoading={paymentsLoading}
              payments={payments}
              paymentFilters={paymentFilters}
              onFilterChange={handleFilterChange}
              onResetFilters={resetPaymentFilters}
              filtersApplied={filtersApplied}
              availablePaymentModes={availablePaymentModes}
              filteredPayments={filteredPayments}
              decoratedPayments={decoratedPayments}
              totalFilteredAmount={totalFilteredAmount}
              nextPaymentDate={nextPaymentDate}
              onOpenReceipt={handleOpenReceiptModal}
              onNavigateDashboard={() => setActiveSection("dashboard")}
            />
          </div>
        )}

        {/* Payment Receipt Modal */}
        <PaymentReceiptModal
          visible={showReceiptModal}
          receipt={selectedReceipt}
          memberData={memberData}
          onClose={handleCloseReceiptModal}
          onDownload={handleDownloadReceipt}
        />

        {/* Events Section */}
        {activeSection === "events" && (
          <div className="p-8">
            {eventsLoading || eventAttendanceLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading events...</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Events Found
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no events scheduled at the moment. Check back later!
                </p>
                <button
                  onClick={() => setActiveSection("dashboard")}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Filter */}
                <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl shadow-md border border-purple-100 p-8">
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        📅 Search & Filter Events
                      </h3>
                      <p className="text-sm text-gray-600">
                        Find events by search or status to stay updated with
                        community activities
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Search Bar */}
                      <div className="relative">
                        <label
                          htmlFor="event-search"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          Search Events
                        </label>
                        <div className="relative">
                          <input
                            id="event-search"
                            type="text"
                            placeholder="Try 'health', 'celebration', 'barangay'..."
                            value={eventSearchQuery}
                            onChange={(event) =>
                              setEventSearchQuery(event.target.value)
                            }
                            className="w-full px-5 py-3 pl-12 border-2 border-gray-300 rounded-xl bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 shadow-sm hover:border-gray-400"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                            🔎
                          </div>
                        </div>
                        {eventSearchQuery && (
                          <button
                            onClick={() => setEventSearchQuery("")}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 pt-4 transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {/* Status Filter */}
                      <div>
                        <label
                          htmlFor="event-status-filter"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          📊 Filter by Status
                        </label>
                        <div className="relative">
                          <select
                            id="event-status-filter"
                            value={eventStatusFilter}
                            onChange={(event) =>
                              setEventStatusFilter(event.target.value)
                            }
                            className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 shadow-sm hover:border-gray-400 appearance-none cursor-pointer"
                          >
                            {EVENT_STATUS_FILTERS.map((filterOption) => (
                              <option
                                key={filterOption.value}
                                value={filterOption.value}
                              >
                                {filterOption.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2">
                            <svg
                              className="w-5 h-5 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Active Filters Display */}
                    {(eventSearchQuery || eventStatusFilter !== "all") && (
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-purple-200">
                        <span className="text-sm font-medium text-gray-600">
                          Active Filters:
                        </span>
                        {eventSearchQuery && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            🔍 "{eventSearchQuery}"
                            <button
                              onClick={() => setEventSearchQuery("")}
                              className="hover:text-purple-900 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                        {eventStatusFilter !== "all" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            📊{" "}
                            {EVENT_STATUS_FILTERS.find(
                              (f) => f.value === eventStatusFilter
                            )?.label || eventStatusFilter}
                            <button
                              onClick={() => setEventStatusFilter("all")}
                              className="hover:text-blue-900 ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events
                    .map((event) => {
                      const status = getEventStatus(event.date, event.time);
                      const badge = getStatusBadge(status);
                      const attendance = eventAttendance[event.id];

                      return { event, status, badge, attendance };
                    })
                    .filter(({ status, attendance, event }) => {
                      // Search filter
                      const searchLower = eventSearchQuery.toLowerCase();
                      const matchesSearch =
                        searchLower === "" ||
                        (event.title &&
                          event.title.toLowerCase().includes(searchLower)) ||
                        (event.description &&
                          event.description
                            .toLowerCase()
                            .includes(searchLower)) ||
                        (event.location &&
                          event.location.toLowerCase().includes(searchLower));

                      if (!matchesSearch) {
                        return false;
                      }

                      // Status filter
                      if (eventStatusFilter === "all") {
                        return true;
                      } else if (eventStatusFilter === "attended") {
                        return !!attendance?.lastCheckedInAt;
                      } else if (eventStatusFilter === "not-attended") {
                        return !attendance?.lastCheckedInAt;
                      } else {
                        return status === eventStatusFilter;
                      }
                    })
                    .map(({ event, status, badge, attendance }) => (
                      <div
                        key={event.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition overflow-hidden"
                      >
                        {/* Header with Status Badge */}
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                          <div className="flex items-start justify-between mb-3">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}
                            >
                              {badge.icon} {badge.label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                attendance?.attended
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {attendance?.attended
                                ? "✓ Attended"
                                : "○ Not Attended"}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                            {event.title || "Untitled Event"}
                          </h3>
                        </div>

                        {/* Event Details */}
                        <div className="p-6 space-y-4">
                          {event.description && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                Description
                              </p>
                              <p className="text-gray-700 line-clamp-2">
                                {event.description}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                📅 Date
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {event.date
                                  ? new Date(event.date).toLocaleDateString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                🕐 Time
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {event.time || "—"}
                              </p>
                            </div>
                          </div>

                          {event.location && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                📍 Location
                              </p>
                              <p className="text-gray-700">{event.location}</p>
                            </div>
                          )}

                          {event.createdBy && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                👤 Organized by
                              </p>
                              <p className="text-gray-700">{event.createdBy}</p>
                            </div>
                          )}

                          {attendance?.lastCheckedInAt && (
                            <div className="pt-3 border-t border-gray-200 bg-green-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-green-700 uppercase mb-2">
                                ✓ Checked In
                              </p>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p>
                                  <span className="font-semibold">Name:</span>{" "}
                                  {attendance.displayName}
                                </p>
                                <p>
                                  <span className="font-semibold">Method:</span>{" "}
                                  {attendance.method === "qr"
                                    ? "QR Code Scan"
                                    : "Manual Check-in"}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    First Check-in:
                                  </span>{" "}
                                  {new Date(
                                    attendance.firstCheckedInAt
                                  ).toLocaleString()}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Last Check-in:
                                  </span>{" "}
                                  {new Date(
                                    attendance.lastCheckedInAt
                                  ).toLocaleString()}
                                </p>
                                {attendance.checkedInBy && (
                                  <p>
                                    <span className="font-semibold">
                                      Verified by:
                                    </span>{" "}
                                    {attendance.checkedInBy}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          {status === "past" ? (
                            <button
                              onClick={() => {
                                setSelectedEventDetails({
                                  event,
                                  attendance,
                                  status,
                                });
                                setShowEventDetailsModal(true);
                              }}
                              className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium transition"
                            >
                              📋 View Details
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedEventDetails({
                                  event,
                                  attendance,
                                  status,
                                });
                                setShowEventDetailsModal(true);
                              }}
                              className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                                attendance?.lastCheckedInAt
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {attendance?.lastCheckedInAt
                                ? "✓ Checked In - View Details"
                                : "📋 View Details"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* No Results Message */}
                {events
                  .map((event) => {
                    const status = getEventStatus(event.date, event.time);
                    const attendance = eventAttendance[event.id];
                    return { event, status, attendance };
                  })
                  .filter(({ status, attendance, event }) => {
                    // Search filter
                    const searchLower = eventSearchQuery.toLowerCase();
                    const matchesSearch =
                      searchLower === "" ||
                      (event.title &&
                        event.title.toLowerCase().includes(searchLower)) ||
                      (event.description &&
                        event.description
                          .toLowerCase()
                          .includes(searchLower)) ||
                      (event.location &&
                        event.location.toLowerCase().includes(searchLower));

                    if (!matchesSearch) {
                      return false;
                    }

                    // Status filter
                    if (eventStatusFilter === "all") {
                      return false;
                    } else if (eventStatusFilter === "attended") {
                      return !!attendance?.lastCheckedInAt;
                    } else if (eventStatusFilter === "not-attended") {
                      return !attendance?.lastCheckedInAt;
                    } else {
                      return status === eventStatusFilter;
                    }
                  }).length === 0 &&
                  (eventStatusFilter !== "all" || eventSearchQuery !== "") && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
                      <p className="text-yellow-800 font-medium">
                        {eventSearchQuery
                          ? `No events found matching "${eventSearchQuery}".`
                          : `No ${eventStatusFilter} events found.`}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Event Details Modal */}
        {showEventDetailsModal && selectedEventDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8">
              {/* Header */}
              <div className="px-8 py-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 sticky top-0 z-10 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-1">Event Details</h2>
                    <p className="text-purple-100 text-base">
                      {selectedEventDetails.event.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEventDetailsModal(false);
                      setSelectedEventDetails(null);
                    }}
                    className="p-3 hover:bg-white/20 rounded-xl transition text-white"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 max-h-[calc(100vh-250px)] overflow-y-auto space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  {selectedEventDetails.status === "past" && (
                    <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                      📅 Past Event
                    </span>
                  )}
                  {selectedEventDetails.status === "present" && (
                    <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      🎯 Today
                    </span>
                  )}
                  {selectedEventDetails.status === "upcoming" && (
                    <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                      ⏰ Upcoming
                    </span>
                  )}
                  {selectedEventDetails.status === "future" && (
                    <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                      🔮 Future Event
                    </span>
                  )}

                  {selectedEventDetails.attendance?.lastCheckedInAt && (
                    <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      ✓ Checked In
                    </span>
                  )}
                </div>

                {/* Event Info Card */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedEventDetails.event.title}
                  </h3>

                  {selectedEventDetails.event.description && (
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase mb-2">
                        Description
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedEventDetails.event.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                        📅 Date
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEventDetails.event.date
                          ? new Date(
                              selectedEventDetails.event.date
                            ).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                        🕐 Time
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEventDetails.event.time || "—"}
                      </p>
                    </div>
                  </div>

                  {selectedEventDetails.event.location && (
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                        📍 Location
                      </p>
                      <p className="text-gray-700">
                        {selectedEventDetails.event.location}
                      </p>
                    </div>
                  )}

                  {selectedEventDetails.event.createdBy && (
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase mb-1">
                        👤 Organized by
                      </p>
                      <p className="text-gray-700">
                        {selectedEventDetails.event.createdBy}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attendance Info Card */}
                {selectedEventDetails.attendance?.lastCheckedInAt && (
                  <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 space-y-4">
                    <h4 className="text-xl font-bold text-green-900">
                      ✓ Your Attendance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">
                          Name
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {selectedEventDetails.attendance.displayName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">
                          Check-in Method
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {selectedEventDetails.attendance.method === "qr"
                            ? "QR Code Scan"
                            : "Manual Check-in"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">
                          First Check-in
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(
                            selectedEventDetails.attendance.firstCheckedInAt
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">
                          Last Check-in
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {new Date(
                            selectedEventDetails.attendance.lastCheckedInAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedEventDetails.attendance.checkedInBy && (
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">
                          Verified by
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {selectedEventDetails.attendance.checkedInBy}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!selectedEventDetails.attendance?.lastCheckedInAt && (
                  <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                    <p className="text-blue-900 font-medium">
                      ℹ️ You have not checked in for this event yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3 sticky bottom-0 rounded-b-3xl">
                <button
                  onClick={() => {
                    setShowEventDetailsModal(false);
                    setSelectedEventDetails(null);
                  }}
                  className="flex-1 min-w-[150px] px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Details Modal */}
        <AnnouncementDetailsModal
          isOpen={showAnnouncementModal}
          announcement={selectedAnnouncement}
          onClose={() => {
            setShowAnnouncementModal(false);
            setSelectedAnnouncement(null);
          }}
        />

        {/* Documents Section */}
        {activeSection === "documents" && (
          <DocumentsSection
            memberDocuments={memberDocuments}
            memberDocumentsLoading={memberDocumentsLoading}
            documentCategories={documentCategories}
            documentCategoriesLoading={documentCategoriesLoading}
            showDocumentUploadModal={showDocumentUploadModal}
            setShowDocumentUploadModal={setShowDocumentUploadModal}
            selectedDocumentCategory={selectedDocumentCategory}
            setSelectedDocumentCategory={setSelectedDocumentCategory}
            documentUploadFile={documentUploadFile}
            setDocumentUploadFile={setDocumentUploadFile}
            documentUploadLoading={documentUploadLoading}
            handleDocumentUpload={handleDocumentUpload}
            handleViewDocument={handleViewDocument}
            memberData={memberData}
          />
        )}

        {/* Announcements Section */}
        {activeSection === "announcements" && (
          <AnnouncementsSection
            announcements={announcements}
            announcementsLoading={false}
            onNavigateDashboard={() => setActiveSection("dashboard")}
            onSelectAnnouncement={(announcement) => {
              setSelectedAnnouncement(announcement);
              setShowAnnouncementModal(true);
            }}
          />
        )}

        {/* Benefits Section */}
        {activeSection === "benefits" && (
          <div className="space-y-6 p-6">
            {benefitsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-gray-600 font-medium">
                    Loading benefits...
                  </p>
                </div>
              </div>
            ) : activeBenefits.length === 0 ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-12 text-center border-2 border-amber-100">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm6 6c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-12 0c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-2">
                  No Active Benefits
                </h3>
                <p className="text-amber-700 max-w-md mx-auto">
                  There are currently no active benefits available. Check back
                  later for new programs and assistance offerings.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Benefits Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">
                          Total Benefits
                        </p>
                        <p className="text-4xl font-bold">
                          {activeBenefits.length}
                        </p>
                      </div>
                      <div className="text-5xl opacity-20">🎁</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">
                          Total Value
                        </p>
                        <p className="text-3xl font-bold">
                          ₱
                          {activeBenefits
                            .reduce((sum, b) => sum + (b.cashValue || 0), 0)
                            .toLocaleString()}
                        </p>
                      </div>
                      <div className="text-5xl opacity-20">💰</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">
                          Highest Value
                        </p>
                        <p className="text-3xl font-bold">
                          ₱
                          {Math.max(
                            ...activeBenefits.map((b) => b.cashValue || 0)
                          ).toLocaleString()}
                        </p>
                        <p className="text-yellow-100 text-xs mt-1">
                          {
                            activeBenefits.find(
                              (b) =>
                                b.cashValue ===
                                Math.max(
                                  ...activeBenefits.map((b) => b.cashValue || 0)
                                )
                            )?.benefitName
                          }
                        </p>
                      </div>
                      <div className="text-5xl opacity-20">⭐</div>
                    </div>
                  </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeBenefits.map((benefit, index) => (
                    <div
                      key={benefit.id}
                      className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 border border-gray-100"
                    >
                      {/* Gradient Background Decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>

                      {/* Card Header */}
                      <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 p-6 text-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-block w-2 h-2 bg-white rounded-full"></span>
                              <p className="text-xs font-semibold text-green-100 uppercase tracking-wider">
                                {benefit.benefitID}
                              </p>
                            </div>
                            <h3 className="text-xl font-bold leading-tight">
                              {benefit.benefitName}
                            </h3>
                          </div>
                          <div className="flex-shrink-0 w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white border-opacity-30">
                            <span className="text-2xl">✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="relative p-6 space-y-5 z-10">
                        {/* Cash Value Highlight */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500">
                          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                            Cash Value
                          </p>
                          <p className="text-3xl font-bold text-green-600">
                            ₱{benefit.cashValue?.toLocaleString() || "N/A"}
                          </p>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                            Description
                          </label>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>

                        {/* Requirements */}
                        {benefit.requirements && (
                          <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                              📋 Requirements
                            </label>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {benefit.requirements}
                            </p>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V7z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              {new Date(benefit.dateCreated).toLocaleDateString(
                                "en-PH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <span>●</span>
                            <span>Active</span>
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

        {/* Floating ID Card Button - Bottom Right */}
        <button
          onClick={() => setShowIDCardModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
          title="View ID Card"
        >
          <CreditCard className="w-7 h-7" />
        </button>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewerModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-gray-800 truncate">
                  {selectedDocument.name}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>📁 {selectedDocument.category}</span>
                  <span>
                    📅{" "}
                    {new Date(selectedDocument.uploadedAt).toLocaleDateString()}
                  </span>
                  <span>
                    💾{" "}
                    {(() => {
                      const bytes = selectedDocument.size;
                      if (bytes === 0) return "0 Bytes";
                      const k = 1024;
                      const sizes = ["Bytes", "KB", "MB", "GB"];
                      const i = Math.floor(Math.log(bytes) / Math.log(k));
                      return (
                        Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
                        " " +
                        sizes[i]
                      );
                    })()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseDocumentViewer}
                className="p-2 hover:bg-gray-100 rounded-lg transition ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50 relative">
              {/* Loading Overlay */}
              {documentViewerLoading && (
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-700 font-semibold text-lg">
                      Loading document...
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Please wait while we prepare your file
                    </p>
                  </div>
                </div>
              )}

              {selectedDocument.contentType?.includes("image") ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={selectedDocument.downloadURL}
                    alt={selectedDocument.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onLoad={() => setDocumentViewerLoading(false)}
                    onError={() => setDocumentViewerLoading(false)}
                  />
                </div>
              ) : selectedDocument.contentType?.includes("pdf") ? (
                <iframe
                  src={selectedDocument.downloadURL}
                  className="w-full h-full min-h-[600px] rounded-lg border-2 border-gray-300"
                  title={selectedDocument.name}
                  onLoad={() => setDocumentViewerLoading(false)}
                />
              ) : selectedDocument.contentType?.includes("word") ||
                selectedDocument.contentType?.includes("document") ||
                selectedDocument.name?.toLowerCase().endsWith(".docx") ||
                selectedDocument.name?.toLowerCase().endsWith(".doc") ||
                selectedDocument.contentType?.includes("sheet") ||
                selectedDocument.contentType?.includes("excel") ||
                selectedDocument.name?.toLowerCase().endsWith(".xlsx") ||
                selectedDocument.name?.toLowerCase().endsWith(".xls") ||
                selectedDocument.contentType?.includes("presentation") ||
                selectedDocument.contentType?.includes("powerpoint") ||
                selectedDocument.name?.toLowerCase().endsWith(".pptx") ||
                selectedDocument.name?.toLowerCase().endsWith(".ppt") ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    selectedDocument.downloadURL
                  )}&embedded=true`}
                  className="w-full h-full min-h-[600px] rounded-lg border-2 border-gray-300"
                  title={selectedDocument.name}
                  onLoad={() => setDocumentViewerLoading(false)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <File className="w-24 h-24 text-gray-400 mb-4" />
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    Preview not available
                  </h4>
                  <p className="text-gray-600 mb-6">
                    This file type cannot be previewed in the browser.
                  </p>
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="p-6 border-t border-gray-200 bg-white flex gap-3 rounded-b-2xl">
              <button
                onClick={handleCloseDocumentViewer}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadDocument(selectedDocument)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Add Your Signature
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sign below to add your digital signature
                  </p>
                </div>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border-2 border-dashed border-gray-300 rounded-lg bg-white w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearSignature}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={saveSignature}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIDCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Your Smart ID Card
                  </h2>
                  <p className="text-sm text-gray-500">
                    ID No: {memberData.oscaID}
                  </p>
                </div>
                <button
                  onClick={() => setShowIDCardModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Theme Selector Dropdown */}
              <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-800 mb-1">
                    Choose ID Card Theme
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select a color theme for your ID card
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(cardThemes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setCardTheme(key);
                      }}
                      className={`p-3 rounded-lg border-2 transition hover:scale-105 ${
                        cardTheme === key
                          ? `${theme.border} bg-white`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{theme.icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">
                            {theme.name}
                          </p>
                          {cardTheme === key && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ Active
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Cards Container */}
              <div className="space-y-6 sm:space-y-8" data-smart-id-print>
                {/* Front of Card */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4 print:hidden">
                    Front Side
                  </h3>
                  <div
                    className={`smart-id-card bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border-4 ${currentTheme.border}`}
                    style={{
                      width: "100%",
                      maxWidth: "650px",
                      aspectRatio: "85.6 / 53.98",
                      printColorAdjust: "exact",
                      WebkitPrintColorAdjust: "exact",
                    }}
                  >
                    <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-blue-50 via-white to-blue-50 h-full flex flex-col">
                      {/* Header with Logo */}
                      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                        {/* Logo Circle */}
                        <div
                          className={`w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-full ${currentTheme.logo} flex-shrink-0 overflow-hidden border border-sm:border-2 md:border-2 border-white flex items-center justify-center`}
                        >
                          <img
                            src="/img/ElderEaseNewLogo.png"
                            alt="ElderEase logo"
                            className="w-7 sm:w-8 md:w-10 h-auto object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[9px] sm:text-xs md:text-sm font-bold text-blue-900 leading-tight italic">
                            Barangay Pinagbuhatan Senior Citizens Association
                            Inc.
                          </h4>
                          <p className="text-[7px] sm:text-[8px] md:text-xs text-gray-600 leading-tight">
                            Unit 3, 2nd Floor, Robern Bldg., Evangelista
                            Extension St., Pinagbuhatan, Pasig City 1601
                          </p>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex gap-2 sm:gap-3 flex-1 overflow-hidden">
                        {/* Photo */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-16 sm:w-20 md:w-24 h-20 sm:h-24 md:h-28 bg-gray-200 border-2 border-gray-400 overflow-hidden">
                            {memberData.img ? (
                              <img
                                src={getImagePath(memberData.img)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-base sm:text-lg md:text-xl font-bold">
                                {memberData.firstName.charAt(0)}
                                {memberData.lastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="w-16 sm:w-20 md:w-24 h-4 sm:h-5 md:h-6 border-b-2 border-gray-400 flex items-center justify-center overflow-hidden">
                            {signature ? (
                              <img
                                src={signature}
                                alt="Signature"
                                className="h-full object-contain"
                              />
                            ) : (
                              <p className="text-[6px] sm:text-[7px] md:text-sm text-gray-400">
                                No Sig
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="mb-1 sm:mb-1.5">
                            <p className="text-[7px] sm:text-[8px] md:text-xs text-gray-600 leading-none">
                              Name
                            </p>
                            <p className="text-[8px] sm:text-xs md:text-sm font-bold text-gray-900 leading-tight uppercase line-clamp-2">
                              {memberData.lastName}, {memberData.firstName}{" "}
                              {memberData.middleName}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-0.5 sm:gap-1 mb-1 sm:mb-1.5 text-[7px] sm:text-[8px] md:text-xs">
                            <div>
                              <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                                DOB
                              </p>
                              <p className="font-bold text-gray-900 text-[7px] sm:text-[8px] md:text-xs">
                                {memberData.birthday}
                              </p>
                            </div>
                            <div>
                              <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                                Age/Sex
                              </p>
                              <p className="font-bold text-gray-900 uppercase text-[7px] sm:text-[8px] md:text-xs">
                                {memberData.age}/{memberData.gender.charAt(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                                Status
                              </p>
                              <p className="font-bold text-gray-900 uppercase text-[7px] sm:text-[8px] md:text-xs">
                                {memberData.civilStat.substring(0, 4)}
                              </p>
                            </div>
                          </div>
                          <div className="mb-1 sm:mb-1.5">
                            <p className="text-[7px] sm:text-[8px] md:text-xs text-gray-600 leading-none">
                              Address
                            </p>
                            <p className="text-[7px] sm:text-[8px] md:text-xs font-bold text-gray-900 leading-tight uppercase line-clamp-1">
                              {memberData.address}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] md:text-xs">
                            <div>
                              <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                                OSCA ID
                              </p>
                              <p className="font-bold text-gray-900 text-[7px] sm:text-[8px] md:text-xs">
                                {memberData.oscaID}
                              </p>
                            </div>
                            <div>
                              <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                                CONTACT
                              </p>
                              <p className="font-bold text-gray-900 text-[7px] sm:text-[8px] md:text-xs">
                                {memberData.contactNum}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex flex-col items-center justify-start flex-shrink-0">
                          <div className="bg-white p-1 sm:p-1.5 border border-gray-300">
                            <QRCode
                              value={memberData.oscaID.toString()}
                              size={
                                window.innerWidth < 640
                                  ? 60
                                  : window.innerWidth < 768
                                  ? 70
                                  : 75
                              }
                              level="H"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-400 text-center">
                        <p className="text-[7px] sm:text-[8px] md:text-xs font-bold text-gray-700 uppercase leading-none">
                          Membership Date
                        </p>
                        <p className="text-[8px] sm:text-xs md:text-sm font-bold text-gray-900">
                          {new Date(
                            memberData.date_created
                          ).toLocaleDateString()}{" "}
                          - 2 YEARS
                        </p>
                        <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600">
                          {memberData.contrNum}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of Card */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4 print:hidden">
                    Back Side
                  </h3>
                  <div
                    className={`smart-id-card bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border-4 ${currentTheme.border}`}
                    style={{
                      width: "100%",
                      maxWidth: "650px",
                      aspectRatio: "85.6 / 53.98",
                      printColorAdjust: "exact",
                      WebkitPrintColorAdjust: "exact",
                    }}
                  >
                    <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 h-full flex flex-col">
                      {/* Medical Conditions Section */}
                      <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-300 flex-1">
                        <div className="flex justify-between items-start gap-2 mb-1 sm:mb-1.5">
                          <h5 className="text-[8px] sm:text-xs md:text-sm font-bold text-gray-900 uppercase leading-tight">
                            Medical Conditions
                          </h5>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                              ISSUED:{" "}
                              {memberData.dateIssue
                                ? new Date(
                                    memberData.dateIssue
                                  ).toLocaleDateString()
                                : new Date(
                                    memberData.date_created
                                  ).toLocaleDateString()}
                            </p>
                            <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-none">
                              EXPIRE:{" "}
                              {memberData.dateExpiration
                                ? new Date(
                                    memberData.dateExpiration
                                  ).toLocaleDateString()
                                : new Date(
                                    new Date(
                                      memberData.date_created
                                    ).setFullYear(
                                      new Date(
                                        memberData.date_created
                                      ).getFullYear() + 2
                                    )
                                  ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-[7px] sm:text-[8px] md:text-xs">
                          {memberData.disabilities ||
                          memberData.medConditions ||
                          memberData.bedridden === "Yes" ? (
                            <div className="space-y-0.5">
                              {memberData.disabilities && (
                                <p className="text-gray-900 font-medium">
                                  • {memberData.disabilities}
                                </p>
                              )}
                              {memberData.medConditions &&
                                memberData.medConditions
                                  .split(",")
                                  .map((condition, idx) => (
                                    <p
                                      key={idx}
                                      className="text-gray-900 font-medium"
                                    >
                                      • {condition.trim()}
                                    </p>
                                  ))}
                              {memberData.bedridden === "Yes" && (
                                <p className="text-gray-900 font-medium">
                                  • Bedridden
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">
                              None reported
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Non-Transferable Notice */}
                      <div className="mb-1.5 sm:mb-2">
                        <h5 className="text-[7px] sm:text-[8px] md:text-xs font-bold text-gray-900 mb-0.5 leading-tight">
                          THIS CARD IS NON-TRANSFERABLE
                        </h5>
                        <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-700 leading-tight text-justify">
                          This is to certify that the bearer is a bona fide
                          member of Barangay Pinagbuhatan Senior Citizens. If
                          found, please call{" "}
                          <span className="font-bold">0948-789-4396</span>.
                        </p>
                      </div>

                      {/* Emergency Contact */}
                      <div className="mb-1.5 sm:mb-2 flex-1">
                        <h5 className="text-[7px] sm:text-[8px] md:text-xs font-bold text-gray-900 mb-0.5 leading-tight">
                          EMERGENCY CONTACT:
                        </h5>
                        <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-700 leading-tight">
                          <span className="font-semibold">Contact: </span>
                          {memberData.contactNum || "Not provided"}
                        </p>
                        <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-700 leading-tight line-clamp-2">
                          <span className="font-semibold">Address: </span>
                          {memberData.address || "Not provided"}
                        </p>
                      </div>

                      {/* Footer Signature */}
                      <div className="pt-1 sm:pt-2 border-t border-gray-300 text-center">
                        <div className="h-3 sm:h-4 md:h-5 mb-0.5"></div>
                        <p className="text-[7px] sm:text-[8px] md:text-xs font-semibold text-gray-900 leading-tight">
                          Mr. Ricardo H. Tlazon
                        </p>
                        <p className="text-[6px] sm:text-[7px] md:text-xs text-gray-600 leading-tight">
                          President
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowIDCardModal(false);
                    setShowSignatureModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Signature
                </button>
                <button
                  onClick={printSmartID}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => setShowIDCardModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Download Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Your QR Code
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: {memberData.oscaID}
                  </p>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div
                ref={qrRef}
                className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl flex items-center justify-center mb-6"
              >
                <QRCode
                  value={memberData.oscaID.toString()}
                  size={256}
                  level="H"
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={downloadQRCode}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download as PNG
                </button>
                <button
                  onClick={downloadQRCodeSVG}
                  className="w-full px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download as SVG
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Personal Information Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8">
            {/* Header - Sticky */}
            <div className="px-8 py-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 sticky top-0 z-10 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-3xl font-bold mb-1">Edit Profile</h2>
                  <p className="text-purple-100 text-base">
                    Update your personal information
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-3 hover:bg-white/20 rounded-xl transition text-white"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 max-h-[calc(100vh-250px)] overflow-y-auto space-y-6">
              {/* Profile Picture Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  📸 Profile Photo
                </h4>
                <div className="flex gap-6 items-start">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300 flex-shrink-0 border-4 border-white shadow-lg">
                    {editFormData.img &&
                    typeof editFormData.img === "string" ? (
                      <img
                        src={
                          editFormData.img.startsWith("data:")
                            ? editFormData.img
                            : getImagePath(editFormData.img)
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl">
                        {editFormData.firstName?.charAt(0) || "U"}
                        {editFormData.lastName?.charAt(0) || "S"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditFormData((prev) => ({
                              ...prev,
                              img: event.target.result,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  👤 Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={editFormData.middleName || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Suffix
                    </label>
                    <input
                      type="text"
                      name="suffix"
                      value={editFormData.suffix || ""}
                      onChange={handleEditInputChange}
                      placeholder="Jr., Sr., III"
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={editFormData.gender || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Civil Status
                    </label>
                    <select
                      name="civilStat"
                      value={editFormData.civilStat || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Birthday (MM/DD/YYYY)
                    </label>
                    <input
                      type="text"
                      name="birthday"
                      value={editFormData.birthday || ""}
                      onChange={handleEditInputChange}
                      placeholder="10/16/1948"
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={editFormData.age || ""}
                      onChange={handleEditInputChange}
                      min="0"
                      max="150"
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Blood Type
                    </label>
                    <input
                      type="text"
                      name="bloodType"
                      value={editFormData.bloodType || ""}
                      onChange={handleEditInputChange}
                      placeholder="e.g., O+"
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="lg:col-span-3 bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Complete Address *
                    </label>
                    <textarea
                      name="address"
                      value={editFormData.address || ""}
                      onChange={handleEditInputChange}
                      rows="3"
                      className="w-full text-base font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="contactNum"
                      value={editFormData.contactNum || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Health Information Card */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border-2 border-red-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  🏥 Health Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 block">
                      Disabilities
                    </label>
                    <input
                      type="text"
                      name="disabilities"
                      value={editFormData.disabilities || ""}
                      onChange={handleEditInputChange}
                      placeholder="Describe any disabilities"
                      className="w-full text-base font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 block">
                      Bedridden
                    </label>
                    <select
                      name="bedridden"
                      value={editFormData.bedridden || "No"}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 block">
                      Health Facility
                    </label>
                    <input
                      type="text"
                      name="healthFacility"
                      value={editFormData.healthFacility || ""}
                      onChange={handleEditInputChange}
                      placeholder="Primary health facility"
                      className="w-full text-base font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 block">
                      Emergency Hospital
                    </label>
                    <input
                      type="text"
                      name="emergencyHospital"
                      value={editFormData.emergencyHospital || ""}
                      onChange={handleEditInputChange}
                      placeholder="Emergency hospital reference"
                      className="w-full text-base font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-red-600 uppercase tracking-wider">
                        Medical Conditions
                      </label>
                      <button
                        type="button"
                        onClick={addMedCondition}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors text-sm"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                    {editFormData.medConditions &&
                    editFormData.medConditions.length > 0 ? (
                      <div className="space-y-2">
                        {editFormData.medConditions.map((condition, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={condition}
                              onChange={(e) =>
                                updateMedCondition(index, e.target.value)
                              }
                              placeholder="Enter medical condition"
                              className="flex-1 text-base font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeMedCondition(index)}
                              className="inline-flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                              title="Remove condition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic py-2">
                        No medical conditions added yet. Click "Add" to start
                        adding conditions.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border-2 border-cyan-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  🚨 Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2 block">
                      Name
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={editFormData.emergencyContactName || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2 block">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactNum"
                      value={editFormData.emergencyContactNum || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2 block">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRelation"
                      value={editFormData.emergencyContactRelation || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2 block">
                      Address
                    </label>
                    <textarea
                      name="emergencyContactAddress"
                      value={editFormData.emergencyContactAddress || ""}
                      onChange={handleEditInputChange}
                      rows="2"
                      className="w-full text-base font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Government IDs Card */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border-2 border-pink-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  🆔 Government IDs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-2 block">
                      PhilHealth
                    </label>
                    <input
                      type="text"
                      name="philHealth"
                      value={editFormData.philHealth || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-2 block">
                      SSS ID
                    </label>
                    <input
                      type="text"
                      name="sssId"
                      value={editFormData.sssId || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-2 block">
                      TIN
                    </label>
                    <input
                      type="text"
                      name="tin"
                      value={editFormData.tin || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-2 block">
                      National ID
                    </label>
                    <input
                      type="text"
                      name="nationalId"
                      value={editFormData.nationalId || ""}
                      onChange={handleEditInputChange}
                      className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Family Members Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    👨‍👩‍👧‍👦 Family Members
                  </h3>
                </div>

                {/* Existing Family Members List */}
                {editFormData.familyMembers &&
                  editFormData.familyMembers.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {editFormData.familyMembers.map((member, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl p-4 border-2 border-indigo-100 hover:shadow-md transition"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div>
                              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">
                                Name
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {member.name || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">
                                Age
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {member.age || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-indigo-600 uppercase mb-1">
                                Relationship
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {member.relationship || "—"}
                              </p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFamilyIndex(index);
                                  setNewFamilyMember(member);
                                }}
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    familyMembers: prev.familyMembers.filter(
                                      (_, i) => i !== index
                                    ),
                                  }));
                                }}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {member.address && (
                            <div className="mt-3 text-sm text-gray-600">
                              <span className="font-semibold text-indigo-600">
                                Address:{" "}
                              </span>
                              {member.address}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Add/Edit Family Member Form */}
                <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    {editingFamilyIndex !== null
                      ? "Edit Family Member"
                      : "Add Family Member"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newFamilyMember.name || ""}
                        onChange={(e) =>
                          setNewFamilyMember((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter family member name"
                        className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
                        Age
                      </label>
                      <input
                        type="number"
                        value={newFamilyMember.age || ""}
                        onChange={(e) =>
                          setNewFamilyMember((prev) => ({
                            ...prev,
                            age: e.target.value,
                          }))
                        }
                        placeholder="Enter age"
                        className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={newFamilyMember.relationship || ""}
                        onChange={(e) =>
                          setNewFamilyMember((prev) => ({
                            ...prev,
                            relationship: e.target.value,
                          }))
                        }
                        placeholder="e.g., Son, Daughter, Sibling"
                        className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
                        Address
                      </label>
                      <input
                        type="text"
                        value={newFamilyMember.address || ""}
                        onChange={(e) =>
                          setNewFamilyMember((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Enter address"
                        className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          newFamilyMember.name &&
                          newFamilyMember.age &&
                          newFamilyMember.relationship
                        ) {
                          if (editingFamilyIndex !== null) {
                            const updatedMembers = [
                              ...editFormData.familyMembers,
                            ];
                            updatedMembers[editingFamilyIndex] =
                              newFamilyMember;
                            setEditFormData((prev) => ({
                              ...prev,
                              familyMembers: updatedMembers,
                            }));
                          } else {
                            setEditFormData((prev) => ({
                              ...prev,
                              familyMembers: [
                                ...(prev.familyMembers || []),
                                newFamilyMember,
                              ],
                            }));
                          }
                          setNewFamilyMember({
                            name: "",
                            age: "",
                            relationship: "",
                            address: "",
                          });
                          setEditingFamilyIndex(null);
                        } else {
                          alert(
                            "Please fill in Name, Age, and Relationship fields"
                          );
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                      {editingFamilyIndex !== null
                        ? "Update Member"
                        : "Add Member"}
                    </button>
                    {editingFamilyIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewFamilyMember({
                            name: "",
                            age: "",
                            relationship: "",
                            address: "",
                          });
                          setEditingFamilyIndex(null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3 sticky bottom-0 rounded-b-3xl">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 min-w-[150px] px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedInfo}
                disabled={editLoading}
                className="flex-1 min-w-[150px] px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Privacy Consent Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                📋 Data Privacy & Terms
              </h3>
              <p className="text-sm text-gray-600">
                Please review and accept our terms before using ElderEase
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Privacy Policy */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3">
                  Privacy Policy
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto space-y-3">
                  <p>
                    <strong>1. Data Collection:</strong> We collect personal
                    information including your name, age, contact details, and
                    health information for service delivery purposes.
                  </p>
                  <p>
                    <strong>2. Data Usage:</strong> Your data is used solely to
                    provide senior citizen services, benefits tracking, and
                    facial recognition verification for membership validation.
                  </p>
                  <p>
                    <strong>3. Data Protection:</strong> Your information is
                    securely stored and encrypted. We comply with the Data
                    Privacy Act of the Philippines.
                  </p>
                  <p>
                    <strong>4. Data Sharing:</strong> We do not share your
                    personal data with third parties without your consent,
                    except as required by law.
                  </p>
                  <p>
                    <strong>5. Your Rights:</strong> You have the right to
                    access, correct, and delete your personal data by contacting
                    our support team.
                  </p>
                  <p>
                    <strong>6. Facial Recognition:</strong> Your facial
                    biometric data is stored securely and used only for identity
                    verification every 3 months.
                  </p>
                </div>
              </div>

              {/* Terms of Service */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3">
                  Terms of Service
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto space-y-3">
                  <p>
                    <strong>1. Service Agreement:</strong> By using ElderEase,
                    you agree to follow all terms and conditions set by the
                    Barangay Senior Citizens Association.
                  </p>
                  <p>
                    <strong>2. Account Responsibility:</strong> You are
                    responsible for maintaining the confidentiality of your
                    login credentials.
                  </p>
                  <p>
                    <strong>3. Acceptable Use:</strong> You agree not to use
                    this system for illegal activities or to harm other users.
                  </p>
                  <p>
                    <strong>4. Session Timeout:</strong> Your session will
                    automatically expire after 30 minutes of inactivity for
                    security purposes.
                  </p>
                  <p>
                    <strong>5. Support:</strong> For technical assistance,
                    contact the Barangay Health Center or call the provided
                    support number.
                  </p>
                </div>
              </div>

              {/* Checkbox for acceptance */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="privacy_accepted"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="privacy_accepted"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  I have read and agree to the Privacy Policy and Terms of
                  Service
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowLogoutConfirmation(true)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Decline & Logout
                </button>
                <button
                  onClick={handlePrivacyAccept}
                  disabled={!privacyAccepted}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Tutorial */}
      <HelpTutorial
        isOpen={showHelpTutorial}
        onClose={() => setShowHelpTutorial(false)}
        tutorialType={tutorialType}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Confirm Logout?
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirmation(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenHome;
