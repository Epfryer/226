import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  inverted?: boolean;
}

export const GradientSection = React.forwardRef<HTMLDivElement, GradientSectionProps>(
  ({ className, children, inverted = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative min-h-screen w-full",
          inverted ? "bg-gradient-to-b from-black via-gray-900 to-white" : "bg-white",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        {...props}
      >
        <div className={cn(
          "relative z-10",
          inverted && "mix-blend-difference"
        )}>
          {children}
        </div>
      </motion.div>
    );
  }
);

GradientSection.displayName = "GradientSection";
