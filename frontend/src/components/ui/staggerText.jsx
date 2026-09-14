import React from "react";
import { motion } from "framer-motion";

export default function TextAnimation({
  children,
  divideBy = "word",
  delay = 0.08,
  className = "",
}) {
  const text = String(children);

  const items =
    divideBy === "character"
      ? Array.from(text)
      : text.split(" ");

  return (
    <span
      className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}
      aria-label={text}
    >
      {items.map((item, index) => (
        <motion.span
          key={`${item}-${index}`}
          initial={{
            opacity: 0,
            y: 18,
            filter: "blur(6px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.45,
            delay: index * delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {item === " " ? "\u00A0" : item}
        </motion.span>
      ))}
    </span>
  );
}