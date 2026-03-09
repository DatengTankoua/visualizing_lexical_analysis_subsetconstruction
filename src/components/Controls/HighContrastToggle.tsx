import { useState, useEffect } from "react";

export default function HighContrastToggle() {
  const [active, setActive] = useState<boolean>(() =>
    document.documentElement.classList.contains("high-contrast")
  );

  useEffect(() => {
    if (active) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [active]);

  return (
    <button
      aria-pressed={active}
      aria-label={active ? "Disable high contrast mode" : "Enable high contrast mode"}
      title={active ? "High contrast: ON" : "High contrast: OFF"}
      onClick={() => setActive((prev) => !prev)}
      className={`px-2 py-1 border rounded text-sm transition font-medium ${
        active
          ? "bg-yellow-300 text-black border-yellow-500"
          : "hover:bg-gray-100 border-gray-300"
      }`}
    >
      ◑ HC
    </button>
  );
}
