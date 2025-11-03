import React from "react";
import { Camera } from "lucide-react";

const FacialRecognitionReminder = ({ visible, onVerifyNow, onDismiss }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-2xl p-6 z-[999] max-w-sm animate-pulse">
      <div className="flex items-start gap-4">
        <Camera className="w-6 h-6 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">Facial Recognition Required</h3>
          <p className="text-sm mt-2 opacity-90">
            It's been 3 months since your last facial verification. Please
            complete the facial recognition process to verify you're active.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={onVerifyNow}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Verify Now
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacialRecognitionReminder;
