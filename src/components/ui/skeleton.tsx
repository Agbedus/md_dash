"use client";

import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-white/[0.03] rounded-lg ${className}`}
      {...props}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ translateX: "-100%" }}
        animate={{ translateX: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
    </div>
  );
}
