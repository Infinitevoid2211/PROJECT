import React from "react";

export function RadialGlowButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative overflow-hidden rounded-xl
        border border-cyan-400/30
        bg-slate-900/80
        px-5 py-2.5
        text-sm font-semibold text-white
        shadow-[0_0_20px_rgba(34,211,238,0.08)]
        transition-all duration-300
        hover:border-cyan-300/60
        hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]
        active:scale-[0.98]
        disabled:pointer-events-none disabled:opacity-50
        ${className}
      `}
    >
      <span
        className="
          pointer-events-none absolute inset-0
          opacity-0 transition-opacity duration-300
          group-hover:opacity-100
          bg-[radial-gradient(circle_at_50%_120%,rgba(34,211,238,0.3),transparent_55%)]
        "
      />

      <span className="relative z-10">{children}</span>
    </button>
  );
}

export default RadialGlowButton;