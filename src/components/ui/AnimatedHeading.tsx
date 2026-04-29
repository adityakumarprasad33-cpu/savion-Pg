"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  delay?: number;
}

export function AnimatedHeading({ text, className = "", delay = 0 }: AnimatedHeadingProps) {
  // Split text into characters including spaces
  const characters = text.split("");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03, // delay between each letter
        delayChildren: delay,
      },
    },
  };

  const childVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      filter: "blur(10px)" 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9], // spring-like easing
      }
    },
  };

  return (
    <motion.h3
      className={`font-extrabold tracking-tight md:tracking-tighter transition-colors duration-500 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'inline-flex', flexWrap: 'wrap' }}
    >
      {characters.map((char, index) => (
        <motion.span
          key={`${index}-${char}`}
          variants={childVariants}
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.h3>
  );
}
