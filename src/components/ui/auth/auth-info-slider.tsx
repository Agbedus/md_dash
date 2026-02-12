'use client';

import { useState, useEffect } from 'react';
import { FiTarget, FiZap, FiShield, FiTrendingUp, FiCpu, FiLock } from 'react-icons/fi';

const slides = [
  {
    title: "Bespoke Productivity",
    description: "Experience a platform tailored to your specific workflow needs.",
    icon: <FiTarget className="w-12 h-12 text-emerald-400" />
  },
  {
    title: "Intelligent Insights",
    description: "Leverage AI-driven analytics to boost your daily performance.",
    icon: <FiZap className="w-12 h-12 text-amber-400" />
  },
  {
    title: "Secure & Unified",
    description: "Your data is protected with enterprise-grade security across all tools.",
    icon: <FiShield className="w-12 h-12 text-indigo-400" />
  }
];

export default function AuthInfoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full flex flex-col justify-center text-white overflow-hidden bg-zinc-900/50">
      {/* Background Decorative Icons - larger and more spread out */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <FiTrendingUp className="absolute top-[5%] left-[5%] w-48 h-48 rotate-12 animate-pulse-soft" />
        <FiCpu className="absolute bottom-[5%] right-[5%] w-64 h-64 -rotate-12 animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <FiLock className="absolute top-[35%] right-[-5%] w-40 h-40 rotate-[35deg] animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <FiZap className="absolute bottom-[25%] left-[-5%] w-32 h-32 -rotate-12 animate-pulse-soft" style={{ animationDelay: '3s' }} />
        <FiTarget className="absolute top-[60%] left-[40%] w-24 h-24 rotate-12 opacity-50 animate-pulse-soft" />
      </div>

      <div className="relative z-10 w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`transition-all duration-1000 absolute inset-0 flex flex-col justify-center px-12 lg:px-20 ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {/* Staggered Animations */}
            <div className="flex flex-col gap-2">
               {/* Line 1: Icon Box */}
               <div 
                 className={`mb-8 w-20 h-20 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-700 delay-[100ms] ${
                   index === currentSlide ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
                 }`}
               >
                 {slide.icon}
               </div>

               {/* Line 2: Title */}
               <h2 
                 className={`text-7xl lg:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/30 mb-8 leading-[0.9] tracking-tighter transition-all duration-700 delay-[300ms] ${
                   index === currentSlide ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
                 }`}
               >
                 {slide.title}
               </h2>

               {/* Line 3: Description */}
               <p 
                 className={`text-3xl text-zinc-400 leading-tight max-w-2xl font-medium tracking-tight transition-all duration-700 delay-[500ms] ${
                   index === currentSlide ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
                 }`}
               >
                 {slide.description}
               </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Slide Indicators - Moved to corner for more space */}
      <div className="absolute bottom-12 right-12 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-500 hover:bg-white/30 ${
              index === currentSlide ? 'w-16 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'w-4 bg-white/10'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
