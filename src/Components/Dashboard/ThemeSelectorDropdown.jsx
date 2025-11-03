import React from "react";

const ThemeSelectorDropdown = ({
  visible,
  cardThemes,
  activeTheme,
  onSelectTheme,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="mt-4 lg:mt-0 lg:absolute lg:top-full lg:right-8 lg:translate-y-3 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-[1000] w-full sm:w-80 max-w-[calc(100vw-2rem)]">
      <div className="mb-3">
        <h3 className="font-bold text-gray-800 mb-1">Choose ID Card Theme</h3>
        <p className="text-xs text-gray-500">
          Select a color theme for your ID card
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(cardThemes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => onSelectTheme(key)}
            className={`p-3 rounded-lg border-2 transition hover:scale-105 ${
              activeTheme === key
                ? `${theme.border} bg-gray-50`
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{theme.icon}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {theme.name}
                </p>
                {activeTheme === key && (
                  <p className="text-xs text-green-600 font-medium">✓ Active</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelectorDropdown;
