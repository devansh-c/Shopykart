'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';

export default function NotFound() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scaleY, setScaleY] = useState(1);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateScale = () => {
      if (textRef.current) {
        const height = textRef.current.offsetHeight;
        const vh = window.innerHeight;
        // Divide window height by text height and multiply by 1.4
        setScaleY((vh / height) * 1.4);
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const navLinks = ["About Us", "Programs", "Reviews", "FAQ", "Contacts"];

  return (
    <main className="w-full h-screen overflow-hidden flex flex-col relative font-sans text-white selection:bg-white/30" style={{ background: 'linear-gradient(to bottom, #FF8233, #FDAC55)' }}>
      
      {/* Background "404" Text Effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
        style={{ 
          opacity: 0.8,
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 95%)'
        }}
      >
        <div className="relative flex items-center justify-center">
          <div 
            ref={textRef}
            className="text-white font-black leading-none tracking-tighter whitespace-nowrap"
            style={{ 
              fontSize: 'clamp(200px, 48vw, 800px)',
              transform: `scale(1.15, ${scaleY})`,
              transformOrigin: 'center'
            }}
          >
            404
          </div>
          
          {/* Oval Shape */}
          <div 
            className="absolute bg-white rounded-full"
            style={{ 
              height: 'clamp(100px, 50vh, 600px)',
              width: 'clamp(120px, 20vw, 400px)',
              transform: `scale(1, ${scaleY})`,
              transformOrigin: 'center'
            }}
          />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 flex flex-row items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-5">
        {/* Logo */}
        <div className="flex items-center">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full" />
          </div>
          <span className="text-white font-bold text-lg sm:text-xl ml-2">ShopyKart</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a 
              key={link} 
              href="#" 
              className="px-4 py-1.5 text-sm font-medium rounded-full bg-white text-[#F16524] hover:opacity-90 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-white bg-[#F16524] hover:opacity-90 transition-colors group"
        >
          <Menu className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span className="text-sm font-medium hidden sm:inline">Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Panel */}
        <div 
          className={`absolute top-0 right-0 h-full w-full sm:w-[380px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #FF9642 100%)' }}
        >
          <div className="flex flex-col h-full p-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
                <span className="text-white font-bold text-lg ml-2">ShopyKart</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col gap-3">
              {navLinks.map((link, i) => (
                <a 
                  key={link} 
                  href="#" 
                  className={`px-6 py-4 text-lg font-semibold text-white rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 transform ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: isMenuOpen ? `${150 + i * 60}ms` : '0ms' }}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className={`absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: isMenuOpen ? '450ms' : '0ms' }}>
              <a 
                href="/" 
                className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-white text-[#F16524] font-semibold text-base transition-transform hover:scale-[1.02]"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Center Video Container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ marginTop: 'calc(-6vh - 40px)' }}>
        <div className="w-[120vw] h-[85vh] sm:w-[70vw] sm:h-[70vh] md:w-[62vw] md:h-[78vh]">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-contain mix-blend-darken"
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="relative z-30 mt-auto pb-8 sm:pb-16 flex flex-col items-center text-center px-4">
        <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4">
          Oops, something went wrong!
        </h1>
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-white font-semibold text-sm sm:text-base bg-[#F16524] hover:scale-105 hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Home
        </a>
      </div>

      <style jsx global>{`
        body {
          overflow: ${isMenuOpen ? 'hidden' : 'auto'};
        }
      `}</style>
    </main>
  );
}
