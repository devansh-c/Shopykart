
"use client"

import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ScrollReveal({ 
  children, 
  className, 
  delay = 0, 
  direction = 'up' 
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { 
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const getDirectionClasses = () => {
    switch (direction) {
      case 'up': return isVisible ? 'translate-y-0' : 'translate-y-12';
      case 'down': return isVisible ? 'translate-y-0' : '-translate-y-12';
      case 'left': return isVisible ? 'translate-x-0' : 'translate-x-12';
      case 'right': return isVisible ? 'translate-x-0' : '-translate-x-12';
      default: return 'translate-y-0';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
        getDirectionClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}
