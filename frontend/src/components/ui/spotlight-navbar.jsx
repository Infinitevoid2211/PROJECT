import React from "react";

export function SpotlightNavbar({ items = [] }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a
          href="#"
          className="text-sm font-bold tracking-[0.18em] text-white"
        >
          BHU-RAKSHAK
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href || "#"}
              className="
                relative rounded-lg px-3 py-2
                text-sm font-medium text-slate-400
                transition-colors duration-200
                hover:bg-white/5
                hover:text-white
              "
            >
              {item.label}

              <span
                className="
                  pointer-events-none absolute inset-x-3 bottom-1
                  h-px scale-x-0 bg-cyan-400
                  transition-transform duration-200
                  hover:scale-x-100
                "
              />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            System Online
          </span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href || "#"}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default SpotlightNavbar;