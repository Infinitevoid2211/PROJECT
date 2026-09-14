import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SelectContext = React.createContext({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
  selectedLabel: "",
  setSelectedLabel: () => {},
});

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState("");

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, "data-testid": testId, ...props }) {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const { selectedLabel, value } = React.useContext(SelectContext);
  return (
    <span className="truncate">
      {selectedLabel || value || <span className="text-slate-400">{placeholder}</span>}
    </span>
  );
}

export function SelectContent({ className, children, ...props }) {
  const { open, setOpen } = React.useContext(SelectContext);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.parentElement.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-800 shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ className, children, value: itemValue, ...props }) {
  const { value, onValueChange, setOpen, setSelectedLabel } = React.useContext(SelectContext);
  const isSelected = value === itemValue;

  React.useEffect(() => {
    if (isSelected && typeof children === "string") {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  const handleSelect = () => {
    if (onValueChange) onValueChange(itemValue);
    if (typeof children === "string") setSelectedLabel(children);
    setOpen(false);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-slate-100 font-semibold text-slate-900",
        className
      )}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}

