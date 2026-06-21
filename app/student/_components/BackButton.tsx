"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

// Cozy-blue secondary back button. Defaults to the student home hub.
export function BackButton({ href = "/student/home", label = "Quay lại" }: { href?: string; label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.96 }}
      className="mb-5 w-fit"
    >
      <Link
        href={href}
        className="group flex items-center gap-2 rounded-xl bg-white py-2 pl-2.5 pr-4 text-sm font-medium transition-colors hover:text-[#254fad]"
        style={{ border: "1px solid #DCE6F4", color: "#1b61c9", boxShadow: "rgba(27,60,120,0.05) 0px 6px 18px" }}
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        {label}
      </Link>
    </motion.div>
  );
}
