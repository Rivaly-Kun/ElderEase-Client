import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, CheckCircle, XCircle, Video, AlertCircle } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";
import { db, storage } from "../Services/firebase";
import { ref as dbRef, get, update, push } from "firebase/database";
import { ref as storageRef, getDownloadURL } from "firebase/storage";

const Verification = ({ memberData, getImagePath }) => {
  const [step, setStep] = useState("camera");
  const [profileImage, setProfileImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [facialData, setFacialData] = useState(null);
  const [activeTab, setActiveTab] = useState("verify");
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [lastAttemptAt, setLastAttemptAt] = useState(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [nextVerificationDue, setNextVerificationDue] = useState(null);
  const [isCurrentlyVerified, setIsCurrentlyVerified] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const defaultProfileImage = "/img/testimg.jpg";

  const parseDateValue = useCallback((value) => {
    if (!value && value !== 0) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "number") {
      const fromNumber = new Date(value);
      return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const asNumber = Number(trimmed);
      if (!Number.isNaN(asNumber) && trimmed.length >= 10) {
        const numericDate = new Date(asNumber);
        if (!Number.isNaN(numericDate.getTime())) {
          return numericDate;
        }
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }, []);

  const formatDisplayDateTime = useCallback(
    (value, fallback = "") => {
      const parsed = parseDateValue(value);
      if (!parsed) return fallback;

      return parsed.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [parseDateValue]
  );

  const calculateNextVerification = useCallback(
    (value) => {
      const parsed = parseDateValue(value);
      if (!parsed) return null;

      const next = new Date(parsed);
      next.setMonth(next.getMonth() + 3);
      return Number.isNaN(next.getTime()) ? null : next;
    },
    [parseDateValue]
  );

  const formatRelativeTime = useCallback(
    (value) => {
      const parsed = parseDateValue(value);
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
    },
    [parseDateValue]
  );

  const updateVerificationInsights = useCallback(
    (logs = []) => {
      if (!Array.isArray(logs) || logs.length === 0) {
        setLastAttemptAt(null);
        setLastVerifiedAt(null);
        setNextVerificationDue(null);
        setIsCurrentlyVerified(false);
        return;
      }

      const sorted = [...logs].sort((a, b) => {
        const aTime = parseDateValue(a.timestamp)?.getTime() ?? 0;
        const bTime = parseDateValue(b.timestamp)?.getTime() ?? 0;
        return bTime - aTime;
      });

      const latestAttempt = sorted[0] ?? null;
      const latestSuccess = sorted.find((item) => item.passed) ?? null;

      setLastAttemptAt(latestAttempt?.timestamp ?? null);
      setLastVerifiedAt(latestSuccess?.timestamp ?? null);

      if (latestSuccess?.timestamp) {
        const nextDue = calculateNextVerification(latestSuccess.timestamp);
        setNextVerificationDue(nextDue);
        setIsCurrentlyVerified(
          nextDue ? nextDue.getTime() > Date.now() : false
        );
      } else {
        setNextVerificationDue(null);
        setIsCurrentlyVerified(false);
      }
    },
    [calculateNextVerification, parseDateValue]
  );

  // Resolve a persisted profile image reference into a browser-usable URL
  const resolveImageUrl = useCallback(
    async (rawPath, memberId) => {
      if (!rawPath && !memberId) return null;

      if (typeof rawPath === "string") {
        if (
          rawPath.startsWith("data:") ||
          rawPath.startsWith("http") ||
          rawPath.startsWith("blob:")
        ) {
          return rawPath;
        }

        if (rawPath.includes("firebasestorage.googleapis.com")) {
          return rawPath.startsWith("http") ? rawPath : `https://${rawPath}`;
        }
      }

      const candidatePaths = new Set();

      if (typeof rawPath === "string" && rawPath.trim()) {
        let sanitized = rawPath.trim();

        if (sanitized.startsWith("gs://")) {
          const gsMatch = sanitized.match(/^gs:\/\/[^/]+\/(.+)$/);
          if (gsMatch?.[1]) {
            sanitized = gsMatch[1];
          }
        }

        sanitized = sanitized.replace(/^\/+/, "");

        if (sanitized.includes("%2F") && !sanitized.includes("/")) {
          sanitized = sanitized.replace(/%2F/g, "/");
        }

        candidatePaths.add(sanitized);

        if (sanitized.startsWith("profile--") && memberId) {
          candidatePaths.add(`member-photos/${memberId}.jpg`);
          candidatePaths.add(`member-photos/${memberId}.jpeg`);
          candidatePaths.add(`member-photos/${memberId}.png`);
        }
      }

      if (memberId) {
        candidatePaths.add(`member-photos/${memberId}.jpg`);
        candidatePaths.add(`member-photos/${memberId}.jpeg`);
        candidatePaths.add(`member-photos/${memberId}.png`);
      }

      for (const candidate of candidatePaths) {
        if (
          !candidate ||
          candidate.startsWith("http") ||
          candidate.startsWith("data:")
        ) {
          continue;
        }

        try {
          const downloadUrl = await getDownloadURL(
            storageRef(storage, candidate)
          );
          if (downloadUrl) {
            return downloadUrl;
          }
        } catch (lookupError) {
          if (
            lookupError?.code &&
            lookupError.code !== "storage/object-not-found"
          ) {
            console.warn(
              "resolveImageUrl storage lookup failed",
              candidate,
              lookupError
            );
          }
        }
      }

      if (typeof rawPath === "string" && getImagePath) {
        const fallback = getImagePath(rawPath);
        if (fallback) {
          return fallback;
        }
      }

      return null;
    },
    [getImagePath]
  );

  // Fetch profile image from Firebase using member ID
  const fetchProfileImageFromFirebase = useCallback(
    async (memberId) => {
      try {
        const memberRef = dbRef(db, `members/${memberId}`);
        const snapshot = await get(memberRef);
        if (snapshot.exists()) {
          const memberInfo = snapshot.val();
          if (memberInfo?.img) {
            const resolved = await resolveImageUrl(memberInfo.img, memberId);
            if (resolved) {
              return resolved;
            }
          }
        }

        // Attempt to fall back to storage naming conventions even if img is missing
        return await resolveImageUrl(null, memberId);
      } catch (err) {
        console.error("Error fetching profile image from Firebase:", err);
        return null;
      }
    },
    [resolveImageUrl]
  );

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelLoaded(true);
        console.log("✅ Face API models loaded");
      } catch (err) {
        console.error("Error loading face-api models:", err);
        setError("Failed to load AI model");
      }
    };
    loadModels();

    // Load profile image from Firebase or memberData
    const loadProfileImage = async () => {
      try {
        let imgPath = null;

        // Try to fetch from Firebase first if member ID is available
        if (memberData?.firebaseKey || memberData?.id) {
          const memberId = memberData.firebaseKey || memberData.id;
          imgPath = await fetchProfileImageFromFirebase(memberId);
        }

        // Fallback to memberData.img
        if (!imgPath && memberData?.img) {
          if (memberData.img instanceof File) {
            imgPath = URL.createObjectURL(memberData.img);
          } else {
            imgPath = await resolveImageUrl(
              memberData.img,
              memberData.firebaseKey || memberData.id
            );
          }
        }

        setProfileImage(imgPath || defaultProfileImage);
      } catch (err) {
        console.error("Error loading profile image:", err);
        setProfileImage(defaultProfileImage);
      }
    };

    loadProfileImage();
  }, [
    memberData,
    getImagePath,
    fetchProfileImageFromFirebase,
    resolveImageUrl,
  ]);

  useEffect(() => {
    const memberId = memberData?.firebaseKey || memberData?.id;
    const memberOscaId = memberData?.oscaID || memberData?.oscaNumber;

    if (!memberId && !memberOscaId) {
      return;
    }

    let isMounted = true;

    const loadVerificationLogs = async () => {
      setLogsLoading(true);
      try {
        const snapshot = await get(dbRef(db, "verifications"));

        if (!snapshot.exists()) {
          if (isMounted) {
            setVerificationLogs([]);
            updateVerificationInsights([]);
          }
          return;
        }

        const data = snapshot.val();
        const collection = Array.isArray(data)
          ? data
              .map((entry, index) =>
                entry
                  ? {
                      id: entry.id ?? `verification-${index}`,
                      ...entry,
                    }
                  : null
              )
              .filter(Boolean)
          : Object.entries(data)
              .map(([key, value]) =>
                value
                  ? {
                      id: key,
                      ...value,
                    }
                  : null
              )
              .filter(Boolean);

        const filtered = collection.filter((entry) => {
          if (!entry) return false;
          const entryMemberId = entry.memberId;
          const entryOscaId = entry.memberOscaId || entry.oscaId;

          return (
            (memberId && entryMemberId === memberId) ||
            (memberOscaId && entryOscaId === memberOscaId)
          );
        });

        filtered.sort((a, b) => {
          const aTime = parseDateValue(a.timestamp)?.getTime() ?? 0;
          const bTime = parseDateValue(b.timestamp)?.getTime() ?? 0;
          return bTime - aTime;
        });

        if (isMounted) {
          setVerificationLogs(filtered);
          updateVerificationInsights(filtered);
        }
      } catch (err) {
        console.error("Error loading verification logs:", err);
        if (isMounted) {
          setVerificationLogs([]);
          updateVerificationInsights([]);
        }
      } finally {
        if (isMounted) {
          setLogsLoading(false);
        }
      }
    };

    loadVerificationLogs();

    return () => {
      isMounted = false;
    };
  }, [memberData, parseDateValue, updateVerificationInsights]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (activeTab !== "verify" && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [activeTab, stream]);

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
      console.error("Camera error:", err);
    }
  };

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.error(err));
    }
  }, [stream]);

  // Capture photo
  const capturePhoto = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageData);

    // stop stream
    if (stream) stream.getTracks().forEach((t) => t.stop());

    setStep("comparing");
    await compareFaces(imageData);
  };

  // Save verification data to Firebase
  const saveVerificationToDatabase = async (verificationData) => {
    try {
      const memberId = memberData?.firebaseKey || memberData?.id;
      const memberOscaId = memberData?.oscaID || memberData?.oscaNumber || null;

      if (!memberId) {
        throw new Error("Member ID not found");
      }

      const timestampIso = new Date().toISOString();
      const nextDueDateObj = verificationData.passed
        ? calculateNextVerification(timestampIso)
        : null;
      const nextDueIso = nextDueDateObj
        ? nextDueDateObj.toISOString()
        : memberData?.nextFacialVerificationDue ?? null;

      const verificationRecord = {
        memberId,
        memberOscaId,
        timestamp: timestampIso,
        similarity: verificationData.similarity,
        distance: verificationData.distance,
        passed: verificationData.passed,
        facialDescriptor: verificationData.facialDescriptor,
        profileDescriptor: verificationData.profileDescriptor,
        nextVerificationDue: nextDueIso,
      };

      const verificationsRef = dbRef(db, "verifications");
      const newLogRef = await push(verificationsRef, verificationRecord);
      const savedRecord = { id: newLogRef.key, ...verificationRecord };

      const memberRef = dbRef(db, `members/${memberId}`);
      const updatePayload = {
        lastVerificationAttempt: timestampIso,
        lastVerificationPassed: verificationData.passed,
        lastVerificationSimilarity: parseFloat(verificationData.similarity),
        memberOscaId,
      };

      if (verificationData.passed) {
        updatePayload.lastVerification = timestampIso;
        updatePayload.lastFacialRecognition = timestampIso;
        updatePayload.lastFacialRecognitionSimilarity = parseFloat(
          verificationData.similarity
        );
        updatePayload.nextFacialVerificationDue = nextDueIso;
        updatePayload.isVerified = true;
        updatePayload.verifiedAt = timestampIso;
      } else {
        updatePayload.isVerified = false;
        if (memberData?.nextFacialVerificationDue) {
          updatePayload.nextFacialVerificationDue =
            memberData.nextFacialVerificationDue;
        }
      }

      await update(memberRef, updatePayload);

      setVerificationLogs((prevLogs) => {
        const nextLogs = [savedRecord, ...prevLogs];
        nextLogs.sort((a, b) => {
          const aTime = parseDateValue(a.timestamp)?.getTime() ?? 0;
          const bTime = parseDateValue(b.timestamp)?.getTime() ?? 0;
          return bTime - aTime;
        });
        updateVerificationInsights(nextLogs);
        return nextLogs;
      });

      console.log("✅ Verification saved to database");
      return true;
    } catch (err) {
      console.error("Error saving verification data:", err);
      setError("Failed to save verification data to database");
      return false;
    }
  };

  // Convert image URL to data URL to avoid CORS issues
  const imageUrlToDataUrl = async (imageUrl) => {
    if (!imageUrl) {
      throw new Error("Image URL is missing");
    }

    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
      return imageUrl;
    }

    try {
      // For Firebase Storage URLs with download tokens, they should work with credentials
      const corsUrl = imageUrl.includes("?")
        ? imageUrl
        : `${imageUrl}?alt=media`;

      const response = await fetch(corsUrl, {
        method: "GET",
        credentials: "omit", // Don't send credentials for CORS
      });

      if (!response.ok) {
        console.warn(
          `Response status ${response.status}, but proceeding with blob conversion`
        );
      }

      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error converting image URL to data URL:", err);
      throw new Error(
        "Unable to read the profile image bytes. Please verify your Firebase Storage CORS configuration."
      );
    }
  };

  const compareFaces = async (capturedImageData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!profileImage || profileImage.endsWith("/null")) {
        throw new Error(
          "No valid profile image found. Please make sure your profile picture is set."
        );
      }

      if (!capturedImageData) {
        throw new Error("No captured image available for comparison.");
      }

      // Fetch and validate images
      let profileImg;
      try {
        const profileImageForFaceAPI = await imageUrlToDataUrl(profileImage);

        profileImg = await faceapi.fetchImage(profileImageForFaceAPI);
      } catch (err) {
        console.error("Profile image fetch error:", err);
        throw new Error(
          "Failed to load profile image. Please ensure your profile picture is valid."
        );
      }

      let capturedImg;
      try {
        capturedImg = await faceapi.fetchImage(capturedImageData);
      } catch (err) {
        console.error("Captured image fetch error:", err);
        throw new Error("Failed to process captured image. Please try again.");
      }

      const profileDesc = await faceapi
        .detectSingleFace(profileImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const capturedDesc = await faceapi
        .detectSingleFace(capturedImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!profileDesc || !capturedDesc) {
        throw new Error("No face detected in one of the images.");
      }

      const distance = faceapi.euclideanDistance(
        profileDesc.descriptor,
        capturedDesc.descriptor
      );

      const similarity = Math.max(0, (1 - distance) * 100);
      const passed = distance < 0.4;

      const verificationData = {
        passed,
        similarity: similarity.toFixed(1),
        distance: distance.toFixed(4),
        facialDescriptor: Array.from(capturedDesc.descriptor),
        profileDescriptor: Array.from(profileDesc.descriptor),
        message: passed
          ? "✓ Verification Successful! Face matches profile."
          : "✗ Verification Failed. Face does not match profile.",
      };

      setFacialData(verificationData);
      setVerificationResult(verificationData);

      await saveVerificationToDatabase(verificationData);

      setIsLoading(false);
      setStep("result");
    } catch (err) {
      console.error("Comparison error:", err);
      setError(err.message || "Failed to compare faces. Try again.");
      setIsLoading(false);
      setStep("camera");
    }
  };

  // Reset
  const retakePhoto = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError(null);
    setStep("camera");
    startCamera();
  };

  const latestAttempt =
    verificationLogs.length > 0 ? verificationLogs[0] : null;
  const lastAttemptLabel = latestAttempt
    ? latestAttempt.passed
      ? "Passed"
      : "Failed"
    : "No attempts yet";
  const lastAttemptRelative = latestAttempt
    ? formatRelativeTime(latestAttempt.timestamp)
    : "";
  const nextDueDisplay = nextVerificationDue
    ? nextVerificationDue.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not scheduled";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Facial Verification
              </h2>
              <p className="text-gray-600">
                Verify your identity using AI-powered facial recognition
              </p>
            </div>
            {modelLoaded && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>AI Ready</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-600 mb-2">
                Current Status
              </p>
              <div className="flex items-center gap-2">
                {isCurrentlyVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={`text-lg font-semibold ${
                    isCurrentlyVerified ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isCurrentlyVerified ? "Verified" : "Needs Verification"}
                </span>
              </div>
              {lastVerifiedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Last verified {formatRelativeTime(lastVerifiedAt)}
                </p>
              )}
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-600 mb-2">
                Last Attempt
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {lastAttemptLabel}
              </p>
              {latestAttempt ? (
                <p className="text-xs text-gray-500 mt-1">
                  {formatDisplayDateTime(latestAttempt.timestamp)}
                  {lastAttemptRelative && ` • ${lastAttemptRelative}`}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">No attempts yet</p>
              )}
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-600 mb-2">
                Next Verification Due
              </p>
              <p className="text-lg font-semibold text-gray-800">
                {nextDueDisplay}
              </p>
              {!isCurrentlyVerified && (
                <p className="text-xs text-red-500 mt-1">
                  Please complete verification as soon as possible.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("verify")}
              className={`px-4 py-2 font-semibold transition -mb-px border-b-2 ${
                activeTab === "verify"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Live Verification
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 font-semibold transition -mb-px border-b-2 ${
                activeTab === "logs"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Verification History
            </button>
          </div>

          {activeTab === "verify" ? (
            <>
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {step === "camera" && (
                <>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        1. Profile Picture
                      </h3>
                      <div className="border-4 border-purple-300 rounded-xl overflow-hidden bg-gray-100 aspect-video mb-3">
                        {profileImage && !profileImage.endsWith("/null") ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No profile image available
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        2. Live Camera
                      </h3>
                      <div className="border-4 border-blue-300 rounded-xl overflow-hidden bg-gray-900 aspect-video">
                        {!stream ? (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <div className="text-center">
                              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Camera not started</p>
                            </div>
                          </div>
                        ) : (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex gap-4 justify-center">
                    {!stream && (
                      <button
                        onClick={startCamera}
                        disabled={
                          !profileImage ||
                          !modelLoaded ||
                          profileImage.endsWith("/null")
                        }
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Video className="w-5 h-5" />
                        Start Camera
                      </button>
                    )}
                    {stream && (
                      <button
                        onClick={capturePhoto}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition animate-pulse"
                      >
                        <Camera className="w-5 h-5" />
                        Capture & Verify
                      </button>
                    )}
                  </div>
                </>
              )}

              {step === "comparing" && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-6"></div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Analyzing Faces with AI...
                  </h3>
                  <p className="text-gray-600">
                    Using Face API to compare facial features
                  </p>
                </div>
              )}

              {step === "result" && verificationResult && (
                <div className="py-8 text-center">
                  {verificationResult.passed ? (
                    <>
                      <CheckCircle className="w-24 h-24 mx-auto text-green-500 mb-4 animate-bounce" />
                      <h3 className="text-3xl font-bold text-green-600 mb-2">
                        Verification Successful!
                      </h3>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-24 h-24 mx-auto text-red-500 mb-4 animate-pulse" />
                      <h3 className="text-3xl font-bold text-red-600 mb-2">
                        Verification Failed
                      </h3>
                    </>
                  )}

                  <p className="text-gray-600 mb-6">
                    {verificationResult.message}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-purple-50 border rounded-lg p-4">
                      <p className="text-sm text-purple-700 mb-1">Similarity</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {verificationResult.similarity}%
                      </p>
                    </div>
                    <div className="bg-blue-50 border rounded-lg p-4">
                      <p className="text-sm text-blue-700 mb-1">
                        Euclidean Distance
                      </p>
                      <p className="text-xl font-bold text-blue-900">
                        {verificationResult.distance}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Verify Again
                    </button>
                    {verificationResult.passed && (
                      <button
                        onClick={() => setActiveTab("logs")}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        View History
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-lg border ${
                  isCurrentlyVerified
                    ? "border-green-200 bg-green-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCurrentlyVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {isCurrentlyVerified
                        ? "Verification is up to date"
                        : "Verification required"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isCurrentlyVerified
                        ? `Next verification is due by ${nextDueDisplay}.`
                        : "Please complete a new facial verification to stay compliant."}
                    </p>
                  </div>
                </div>
              </div>

              {logsLoading ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                  Loading verification history...
                </div>
              ) : verificationLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Date & Time
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Result
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Similarity
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Distance
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Next Due
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {verificationLogs.map((log) => {
                        const nextDueForLog = log.nextVerificationDue
                          ? formatDisplayDateTime(log.nextVerificationDue, "—")
                          : log.passed
                          ? formatDisplayDateTime(
                              calculateNextVerification(log.timestamp),
                              "—"
                            )
                          : "—";

                        return (
                          <tr
                            key={log.id ?? log.timestamp}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-gray-700">
                              {formatDisplayDateTime(log.timestamp, "—")}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                  log.passed
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {log.passed ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {log.passed ? "Passed" : "Failed"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {log.similarity ? `${log.similarity}%` : "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {log.distance ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {nextDueForLog}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  No verification history recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verification;
