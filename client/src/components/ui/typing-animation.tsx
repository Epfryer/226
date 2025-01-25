
"use client"

import React, { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"

interface TypingAnimationProps {
  text: string
  className?: string
  speed?: number
  delay?: number
}

export function TypingAnimation({
  text,
  className = "",
  speed = 50,
  delay = 0,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const controls = useAnimation()

  useEffect(() => {
    let currentIndex = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(interval)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [text, speed, delay])

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        |
      </motion.span>
    </motion.span>
  )
}
