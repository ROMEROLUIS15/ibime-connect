import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const FloatingButtons = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`floating-btn right-6 bottom-20 transition-all duration-300 ${
          showScrollTop
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Ir al inicio"
      >
        <ChevronUp className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Scroll to Bottom */}
      <button
        onClick={scrollToBottom}
        className={`floating-btn right-6 bottom-6 transition-all duration-300 ${
          showScrollTop
            ? 'opacity-0 -translate-y-10 pointer-events-none'
            : 'opacity-100 translate-y-0'
        }`}
        aria-label="Ir al final"
      >
        <ChevronDown className="w-6 h-6 text-primary-foreground" />
      </button>
    </>
  );
};

export default FloatingButtons;
