import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children, ...props }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  return (
    <div onClick={() => setOpen(!open)} className="cursor-pointer inline-flex" {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuContent({ className, align = "end", children, ...props }) {
  const { open } = React.useContext(DropdownMenuContext);
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-800 shadow-md",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className, children, onClick, "data-testid": testId, ...props }) {
  const { setOpen } = React.useContext(DropdownMenuContext);
  return (
    <div
      data-testid={testId}
      onClick={(e) => {
        if (onClick) onClick(e);
        setOpen(false);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2.5 py-1.5 text-xs font-medium outline-none hover:bg-slate-100 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

