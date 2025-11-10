import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Globe,
} from "lucide-react";

const HelpTutorial = ({ isOpen, onClose, tutorialType = "dashboard" }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState(null);
  const [highlightPosition, setHighlightPosition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("english"); // "english" or "tagalog"
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
          titleTL: "Maligayang Pagdating sa Iyong Dashboard",
          description:
            "This is your personal dashboard. Here you can see your membership information, upcoming events, and quick access to important features.",
          descriptionTL:
            "Ito ang iyong personal na dashboard. Dito makikita mo ang iyong impormasyon sa pagiging miyembro, mga darating na kaganapan, at mabilis na access sa mahalagang features.",
          target: ".dashboard-welcome",
          position: "bottom",
        },
        {
          title: "Your Smart ID Card",
          titleTL: "Ang Iyong Smart ID Card",
          description:
            "Click here to view your official Senior Citizen ID card. You can customize the theme and download it for printing.",
          descriptionTL:
            "Mag-click dito upang makita ang iyong opisyal na Senior Citizen ID card. Maaari mong i-customize ang tema at i-download ito para sa pag-print.",
          target: ".floating-id-button",
          position: "top",
        },
        {
          title: "Check Your Payments",
          titleTL: "Tingnan ang Iyong Mga Bayad",
          description:
            "Navigate to the Payments tab to view your payment history, transaction records, and download receipts.",
          descriptionTL:
            "Pumunta sa Payments tab upang makita ang iyong kasaysayan ng pagbabayad, mga record ng transaksyon, at mag-download ng mga resibo.",
          target: "button:has-text('Payments')",
          position: "bottom",
        },
        {
          title: "Membership Status",
          titleTL: "Status ng Pagiging Miyembro",
          description:
            "Keep track of your membership expiration date here. Your membership is valid until the displayed date.",
          descriptionTL:
            "Subaybayan ang iyong petsa ng pag-expire ng membership dito. Ang iyong membership ay valid hanggang sa ipinakitang petsa.",
          target: ".membership-status",
          position: "bottom",
        },
        {
          title: "Notifications",
          titleTL: "Mga Abiso",
          description:
            "Click the bell icon to check important notifications from your barangay, such as events, updates, and reminders.",
          descriptionTL:
            "Mag-click sa bell icon upang tingnan ang mahalagang mga abiso mula sa iyong barangay, tulad ng mga kaganapan, mga update, at mga paalala.",
          target: ".notification-bell",
          position: "bottom",
        },
        {
          title: "Account Settings",
          titleTL: "Mga Setting ng Account",
          description:
            "Update your profile information, change password, and manage account preferences.",
          descriptionTL:
            "I-update ang iyong profile na impormasyon, baguhin ang password, at pamahalaan ang mga kagustuhan ng account.",
          target: ".profile-edit-button",
          position: "bottom",
        },
      ],
      payments: [
        {
          title: "Payment History",
          titleTL: "Kasaysayan ng Pagbabayad",
          description:
            "View all your payments in detail. See payment dates, amounts, modes of payment, and status.",
          descriptionTL:
            "Tingnan ang lahat ng iyong mga pagbabayad nang detalyado. Makita ang mga petsa ng pagbabayad, halaga, mga paraan ng pagbabayad, at status.",
          target: ".payments-table",
          position: "top",
        },
        {
          title: "Payment Status",
          titleTL: "Status ng Pagbabayad",
          description:
            "Green indicates paid, yellow indicates pending. Keep track of your payment status easily.",
          descriptionTL:
            "Ang berde ay nangangahulugang nabayaran, ang dilaw ay nangangahulugang naghihintay. Sundin nang madali ang iyong status ng pagbabayad.",
          target: ".status-badge",
          position: "left",
        },
        {
          title: "Mode of Payment",
          titleTL: "Paraan ng Pagbabayad",
          description:
            "See how you paid - whether through GCash, over-the-counter, or other methods.",
          descriptionTL:
            "Tingnan kung paano ka nagbayad - kung sa pamamagitan ng GCash, over-the-counter, o ibang mga paraan.",
          target: ".mode-payment",
          position: "left",
        },
      ],
      verification: [
        {
          title: "Facial Recognition Verification",
          titleTL: "Pagpapatunay ng Facial Recognition",
          description:
            "This is our verification process. Please allow camera access and ensure good lighting.",
          descriptionTL:
            "Ito ang aming proseso ng pagpapatunay. Mangyaring payagan ang access sa camera at tiyakin ang mahusay na liwanag.",
          target: ".verification-camera",
          position: "bottom",
        },
        {
          title: "Capture Your Photo",
          titleTL: "Kunin ang Iyong Larawan",
          description:
            "Click this button to capture your photo for verification. Your face will be compared with your ID photo.",
          descriptionTL:
            "Mag-click sa button na ito upang kunin ang iyong larawan para sa pagpapatunay. Ang iyong mukha ay ikukumpara sa iyong ID photo.",
          target: ".capture-button",
          position: "top",
        },
        {
          title: "Verification Result",
          titleTL: "Resulta ng Pagpapatunay",
          description:
            "After verification, you'll see if your identity matches our records. High similarity scores indicate a successful match.",
          descriptionTL:
            "Pagkatapos ng pagpapatunay, makikita mo kung ang iyong pagkakakilanlan ay tumutugma sa aming mga record. Ang mataas na similarity scores ay nagpapakita ng matagumpay na match.",
          target: ".verification-result",
          position: "top",
        },
      ],
      events: [
        {
          title: "Community Events",
          titleTL: "Mga Kaganapan sa Komunidad",
          description:
            "Here you can view all upcoming community events organized by your barangay. Stay updated and participate!",
          descriptionTL:
            "Dito makikita mo ang lahat ng darating na mga kaganapan sa komunidad na inayos ng iyong barangay. Manatiling updated at sumali!",
          target: ".events-list",
          position: "top",
        },
        {
          title: "Event Categories",
          titleTL: "Mga Kategorya ng Kaganapan",
          description:
            "Filter events by status: Past events you've attended, Today's events, Upcoming events, or Future events.",
          descriptionTL:
            "I-filter ang mga kaganapan ayon sa status: Mga nakaraang kaganapan na iyong nadalo, Mga kaganapang ngayon, Mga darating na kaganapan, o Mga kaganapang sa hinaharap.",
          target: ".event-filters",
          position: "bottom",
        },
        {
          title: "Event Details",
          titleTL: "Mga Detalye ng Kaganapan",
          description:
            "Click on any event to see more details including the date, time, location, and your attendance status.",
          descriptionTL:
            "Mag-click sa anumang kaganapan upang makita ang higit pang mga detalye kabilang ang petsa, oras, lokasyon, at iyong status ng pagdaluhan.",
          target: ".event-card",
          position: "top",
        },
        {
          title: "Check-In Information",
          titleTL: "Impormasyon ng Check-In",
          description:
            "View when you checked in to events. See if you attended via QR code or manual check-in.",
          descriptionTL:
            "Tingnan kung kailan ka nag-check-in sa mga kaganapan. Tingnan kung dumalo ka sa pamamagitan ng QR code o manual check-in.",
          target: ".event-checkin-info",
          position: "bottom",
        },
      ],
      documents: [
        {
          title: "Submit Your Documents",
          titleTL: "Ipadala ang Iyong mga Dokumento",
          description:
            "Upload important documents by selecting from available categories such as ID, Birth Certificate, or other required documents.",
          descriptionTL:
            "I-upload ang mahalagang mga dokumento sa pamamagitan ng pagpili mula sa available na mga kategorya tulad ng ID, Birth Certificate, o iba pang kinakailangang mga dokumento.",
          target: ".document-upload-button",
          position: "bottom",
        },
        {
          title: "Document Categories",
          titleTL: "Mga Kategorya ng Dokumento",
          description:
            "Browse available document categories. Each category is for specific types of documents you may need to submit.",
          descriptionTL:
            "Tingnan ang available na mga kategorya ng dokumento. Ang bawat kategorya ay para sa mga specific na uri ng mga dokumentong maaari mong kailangang ipadala.",
          target: ".document-categories",
          position: "top",
        },
        {
          title: "Upload Modal",
          titleTL: "Modal ng Upload",
          description:
            "Select a category and choose a file from your device. You can upload images, PDFs, and other document formats.",
          descriptionTL:
            "Pumili ng kategorya at piliin ang isang file mula sa iyong device. Maaari kang mag-upload ng mga larawan, PDFs, at iba pang mga format ng dokumento.",
          target: ".document-upload-modal",
          position: "left",
        },
        {
          title: "Your Documents",
          titleTL: "Ang Iyong mga Dokumento",
          description:
            "View all documents you've submitted. Check the category, file size, and upload date. Download anytime.",
          descriptionTL:
            "Tingnan ang lahat ng mga dokumentong iyong ipinadala. Tingnan ang kategorya, laki ng file, at petsa ng upload. I-download anumang oras.",
          target: ".submitted-documents",
          position: "top",
        },
      ],
      login: [
        {
          title: "Welcome to ElderEase",
          titleTL: "Maligayang Pagdating sa ElderEase",
          description:
            "Welcome to ElderEase, your Senior Citizen Portal. Enter your credentials to login securely.",
          descriptionTL:
            "Maligayang pagdating sa ElderEase, ang iyong Senior Citizen Portal. Ilagay ang iyong mga kredensyal upang mag-login nang secure.",
          target: ".login-form",
          position: "bottom",
        },
        {
          title: "Username",
          titleTL: "Pangalan ng Gumagamit",
          description:
            "Enter your username that was provided during registration.",
          descriptionTL:
            "Ilagay ang iyong pangalan ng gumagamit na ibinigay sa panahon ng pagpaparehistro.",
          target: "input[type='text']",
          position: "bottom",
        },
        {
          title: "Password",
          titleTL: "Hintunay",
          description:
            "Enter your password. Keep it secure and don't share with anyone.",
          descriptionTL:
            "Ilagay ang iyong hintunay. Panatilihin itong secure at huwag ibahagi sa sinuman.",
          target: "input[type='password']",
          position: "bottom",
        },
        {
          title: "Login Button",
          titleTL: "Button ng Login",
          description: "Click here to log in to your account.",
          descriptionTL: "Mag-click dito upang mag-login sa iyong account.",
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
          const title =
            language === "english" ? nextStep.title : nextStep.titleTL;
          const description =
            language === "english"
              ? nextStep.description
              : nextStep.descriptionTL;
          const text = `${title}. ${description}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.lang = language === "english" ? "en-US" : "fil-PH";
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
          const title =
            language === "english" ? prevStep.title : prevStep.titleTL;
          const description =
            language === "english"
              ? prevStep.description
              : prevStep.descriptionTL;
          const text = `${title}. ${description}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.lang = language === "english" ? "en-US" : "fil-PH";
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
      const title = language === "english" ? step.title : step.titleTL;
      const description =
        language === "english" ? step.description : step.descriptionTL;
      const text = `${title}. ${description}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.lang = language === "english" ? "en-US" : "fil-PH";
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

          {/* Language Toggle Button */}
          <button
            onClick={() =>
              setLanguage(language === "english" ? "tagalog" : "english")
            }
            className="absolute top-4 right-16 px-3 py-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm font-medium"
            title="Toggle Language"
          >
            <Globe className="w-4 h-4" />
            {language === "english" ? "TL" : "EN"}
          </button>

          {/* Content */}
          <div className="mb-6 pr-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === "english" ? step.title : step.titleTL}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {language === "english" ? step.description : step.descriptionTL}
            </p>
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
