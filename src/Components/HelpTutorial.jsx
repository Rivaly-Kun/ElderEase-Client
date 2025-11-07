import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { X, ChevronRight, ChevronLeft, Volume2, VolumeX } from "lucide-react";

const HelpTutorial = ({ isOpen, onClose, tutorialType = "dashboard" }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState(null);
  const [highlightPosition, setHighlightPosition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const overlayRef = useRef(null);

  // Reset currentStep when tutorial opens
  useEffect(() => {
    console.log("=== RESET EFFECT ===");
    console.log("isOpen:", isOpen);
    if (isOpen) {
      console.log("Resetting currentStep to 0");
      setCurrentStep(0);
    }
  }, [isOpen]);

  const tutorials = useMemo(
    () => ({
      dashboard: [
        {
          title: "Welcome to Your Dashboard",
          description:
            "This is your personal dashboard. Here you can see your membership information, upcoming events, and quick access to important features.",
          target: ".dashboard-welcome",
          position: "bottom",
        },
        {
          title: "Your Smart ID Card",
          description:
            "Click here to view your official Senior Citizen ID card. You can customize the theme and download it for printing.",
          target: ".floating-id-button",
          position: "top",
        },
        {
          title: "Check Your Payments",
          description:
            "Navigate to the Payments tab to view your payment history, transaction records, and download receipts.",
          target: "button:has-text('Payments')",
          position: "bottom",
        },
        {
          title: "Membership Status",
          description:
            "Keep track of your membership expiration date here. Your membership is valid until the displayed date.",
          target: ".membership-status",
          position: "bottom",
        },
        {
          title: "Notifications",
          description:
            "Click the bell icon to check important notifications from your barangay, such as events, updates, and reminders.",
          target: ".notification-bell",
          position: "bottom",
        },
        {
          title: "Account Settings",
          description:
            "Update your profile information, change password, and manage account preferences.",
          target: ".profile-edit-button",
          position: "bottom",
        },
      ],
      payments: [
        {
          title: "Payment History",
          description:
            "View all your payments in detail. See payment dates, amounts, modes of payment, and status.",
          target: ".payments-table",
          position: "top",
        },
        {
          title: "Payment Status",
          description:
            "Green indicates paid, yellow indicates pending. Keep track of your payment status easily.",
          target: ".status-badge",
          position: "left",
        },
        {
          title: "Mode of Payment",
          description:
            "See how you paid - whether through GCash, over-the-counter, or other methods.",
          target: ".mode-payment",
          position: "left",
        },
      ],
      verification: [
        {
          title: "Facial Recognition Verification",
          description:
            "This is our verification process. Please allow camera access and ensure good lighting.",
          target: ".verification-camera",
          position: "bottom",
        },
        {
          title: "Capture Your Photo",
          description:
            "Click this button to capture your photo for verification. Your face will be compared with your ID photo.",
          target: ".capture-button",
          position: "top",
        },
        {
          title: "Verification Result",
          description:
            "After verification, you'll see if your identity matches our records. High similarity scores indicate a successful match.",
          target: ".verification-result",
          position: "top",
        },
      ],
      events: [
        {
          title: "Community Events",
          description:
            "Here you can view all upcoming community events organized by your barangay. Stay updated and participate!",
          target: ".events-list",
          position: "top",
        },
        {
          title: "Event Categories",
          description:
            "Filter events by status: Past events you've attended, Today's events, Upcoming events, or Future events.",
          target: ".event-filters",
          position: "bottom",
        },
        {
          title: "Event Details",
          description:
            "Click on any event to see more details including the date, time, location, and your attendance status.",
          target: ".event-card",
          position: "top",
        },
        {
          title: "Check-In Information",
          description:
            "View when you checked in to events. See if you attended via QR code or manual check-in.",
          target: ".event-checkin-info",
          position: "bottom",
        },
      ],
      documents: [
        {
          title: "Submit Your Documents",
          description:
            "Upload important documents by selecting from available categories such as ID, Birth Certificate, or other required documents.",
          target: ".document-upload-button",
          position: "bottom",
        },
        {
          title: "Document Categories",
          description:
            "Browse available document categories. Each category is for specific types of documents you may need to submit.",
          target: ".document-categories",
          position: "top",
        },
        {
          title: "Upload Modal",
          description:
            "Select a category and choose a file from your device. You can upload images, PDFs, and other document formats.",
          target: ".document-upload-modal",
          position: "left",
        },
        {
          title: "Your Documents",
          description:
            "View all documents you've submitted. Check the category, file size, and upload date. Download anytime.",
          target: ".submitted-documents",
          position: "top",
        },
      ],
      login: [
        {
          title: "Welcome to ElderEase",
          description:
            "Welcome to ElderEase, your Senior Citizen Portal. Enter your credentials to login securely.",
          target: ".login-form",
          position: "bottom",
        },
        {
          title: "Username",
          description:
            "Enter your username that was provided during registration.",
          target: "input[type='text']",
          position: "bottom",
        },
        {
          title: "Password",
          description:
            "Enter your password. Keep it secure and don't share with anyone.",
          target: "input[type='password']",
          position: "bottom",
        },
        {
          title: "Login Button",
          description: "Click here to log in to your account.",
          target: "button:contains('Login')",
          position: "top",
        },
      ],
    }),
    []
  );

  const steps = useMemo(
    () => tutorials[tutorialType] || tutorials.dashboard,
    [tutorials, tutorialType]
  );

  const highlightStep = useCallback(
    (stepIndex) => {
      console.log("=== HIGHLIGHT STEP ===");
      console.log("Highlighting step:", stepIndex);
      console.log("Steps available:", steps?.length);

      const step = steps[stepIndex];
      if (!step) {
        console.log("Step not found at index:", stepIndex);
        return;
      }

      console.log("Looking for element with target:", step.target);
      let element = null;
      const requiresTextFallback =
        step.target.includes("has-text") || step.target.includes("contains(");

      if (!requiresTextFallback) {
        try {
          element = document.querySelector(step.target);
        } catch (error) {
          console.warn(
            "Invalid selector provided to help tutorial:",
            step.target,
            error
          );
        }
      }

      if (!element && step.target.includes("has-text")) {
        console.log("Trying fallback for has-text selector");
        const text = step.target.match(/'([^']*)'/)?.[1];
        if (text) {
          element = Array.from(
            document.querySelectorAll("button, a, div")
          ).find((el) => el.textContent.includes(text));
        }
      }

      if (!element && step.target.includes("contains(")) {
        console.log("Trying fallback for contains selector");
        const text = step.target.match(/'([^']*)'/)?.[1];
        if (text) {
          element = Array.from(
            document.querySelectorAll("button, a, div")
          ).find((el) => el.textContent.includes(text));
        }
      }

      if (element) {
        console.log("Element found, getting bounding rect");
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        setHighlightElement(element);
      } else {
        console.log("Element not found for target:", step.target);
      }
    },
    [steps]
  );

  useEffect(() => {
    console.log("=== MAIN EFFECT ===");
    console.log("isOpen:", isOpen);
    console.log("currentStep:", currentStep);

    if (isOpen) {
      console.log("Tutorial is open, hiding overflow and highlighting step");
      document.body.style.overflow = "hidden";
      highlightStep(currentStep);
    } else {
      console.log("Tutorial is closed, restoring overflow");
      document.body.style.overflow = "auto";
    }

    return () => {
      console.log("Main effect cleanup");
      document.body.style.overflow = "auto";
    };
  }, [isOpen, currentStep, highlightStep]);

  const handleNext = () => {
    console.log("=== NEXT BUTTON CLICKED ===");
    console.log("Current Step:", currentStep);
    console.log("Steps Array Length:", steps?.length);
    console.log("Steps Array:", steps);

    if (!steps || steps.length === 0) {
      console.log("Steps is empty or null, closing tutorial");
      onClose();
      return;
    }

    console.log("Checking if currentStep < steps.length - 1");
    console.log(
      `${currentStep} < ${steps.length - 1} = ${currentStep < steps.length - 1}`
    );

    // Stop current speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    if (currentStep < steps.length - 1) {
      console.log("Moving to next step:", currentStep + 1);
      setCurrentStep(currentStep + 1);

      // Automatically speak the next step
      setTimeout(() => {
        const nextStep = steps[currentStep + 1];
        if (nextStep && "speechSynthesis" in window) {
          const text = `${nextStep.title}. ${nextStep.description}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
        }
      }, 100);
    } else {
      console.log("At last step, closing tutorial");
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      // Stop current speech
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);

      setCurrentStep(currentStep - 1);

      // Automatically speak the previous step
      setTimeout(() => {
        const prevStep = steps[currentStep - 1];
        if (prevStep && "speechSynthesis" in window) {
          const text = `${prevStep.title}. ${prevStep.description}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
        }
      }, 100);
    }
  };

  const speakText = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const step = steps[currentStep];
      const text = `${step.title}. ${step.description}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);

      utterance.onend = () => setIsSpeaking(false);
    }
  };

  const handleClose = () => {
    // Stop any ongoing speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    onClose();
  };

  if (!isOpen) {
    console.log("=== RENDER CHECK: Not open, returning null ===");
    return null;
  }

  const step = steps[currentStep];

  console.log("=== RENDER CHECK: Rendering ===");
  console.log("Current step object:", step);
  console.log("currentStep index:", currentStep);
  console.log("steps.length:", steps.length);

  // Safety check - if step doesn't exist, close the tutorial
  if (!step) {
    console.log("Step is undefined! Closing tutorial");
    onClose();
    return null;
  }

  return (
    <>
      {/* Dark Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 z-[9990]"
        onClick={onClose}
        ref={overlayRef}
      >
        {/* Highlight Circle */}
        {highlightPosition && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${highlightPosition.top - 8}px`,
              left: `${highlightPosition.left - 8}px`,
              width: `${highlightPosition.width + 16}px`,
              height: `${highlightPosition.height + 16}px`,
              border: "3px solid #a78bfa",
              borderRadius: "12px",
              boxShadow:
                "0 0 0 2px rgba(167, 139, 250, 0.3), 0 0 20px rgba(167, 139, 250, 0.5)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        )}

        {/* Tutorial Card */}
        <div
          className="fixed bottom-8 left-8 right-8 bg-white rounded-2xl shadow-2xl p-8 z-[9991] max-w-lg"
          style={{
            animation: "slideUp 0.3s ease-out",
          }}
          onClick={(event) => {
            // Prevent clicks inside the tutorial card from closing the overlay
            event.stopPropagation();
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="mb-6 pr-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={speakText}
                className={`p-2 rounded-lg transition ${
                  isSpeaking
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Speak"
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? "Done" : "Next"}
              {currentStep < steps.length - 1 && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Skip Tutorial */}
          <button
            onClick={handleClose}
            className="w-full mt-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Skip Tutorial
          </button>
        </div>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default HelpTutorial;
