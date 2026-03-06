import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';

export const VisitorCounter = () => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const targetCount = 125847;

  useEffect(() => {
    if (!sectionRef.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          const duration = 2000;
          const steps = 80;
          const increment = targetCount / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= targetCount) {
              setCount(targetCount);
              clearInterval(timer);
              setHasAnimated(true);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);

          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated, targetCount]);

  return (
    // ── FIX: añadido id="visitantes" para que useFloatingButtonsTheme lo detecte
    <section
      ref={sectionRef}
      id="visitantes"
      className="py-14 md:py-16 bg-gradient-institutional"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 rounded-full bg-ibime-green/80 border border-white/40 flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-5xl md:text-6xl font-sans font-extrabold text-white mb-1">
              {count.toLocaleString()}
            </p>
            <p className="text-white text-lg md:text-xl font-medium">
              Visitantes a nuestro portal
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitorCounter;
