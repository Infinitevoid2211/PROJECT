import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-[#0B3B60] text-white hover:bg-[#082a45]",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  ghost: "hover:bg-slate-100 text-slate-700",
  link: "text-blue-600 underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8 text-base",
  icon: "h-9 w-9 p-0",
};

const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
        buttonVariants[variant] || buttonVariants.default,
        buttonSizes[size] || buttonSizes.default,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };

