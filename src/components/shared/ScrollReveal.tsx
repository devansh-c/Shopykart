
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
          // Once visible, we can disconnect if we don't need re-reveal
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -20px 0px'
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
      case 'up': return isVisible ? 'translate-y-0' : 'translate-y-8';
      case 'down': return isVisible ? 'translate-y-0' : '-translate-y-8';
      case 'left': return isVisible ? 'translate-x-0' : 'translate-x-8';
      case 'right': return isVisible ? 'translate-x-0' : '-translate-x-8';
      default: return 'translate-y-0';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-premium will-change-transform",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
        getDirectionClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}
