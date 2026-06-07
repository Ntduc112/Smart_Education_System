"use client";

import { motion } from "framer-motion";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = "" }: SpinnerProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-500/10"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 56, height: 56, top: -4, left: -4 }}
          />
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Spinner size={22} className="text-blue-600" />
          </div>
        </div>
        <motion.p
          className="text-sm text-[rgba(4,14,32,0.4)] tracking-wide"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          Đang tải...
        </motion.p>
      </motion.div>
    </div>
  );
}
