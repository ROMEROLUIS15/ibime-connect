import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

export const VisitorCounter = () => {
  const [count, setCount] = useState(0);
  const targetCount = 125847;

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = targetCount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetCount) {
        setCount(targetCount);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 bg-gradient-institutional">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-5xl md:text-6xl font-display font-bold text-primary-foreground mb-2">
              {count.toLocaleString()}
            </p>
            <p className="text-primary-foreground/70 text-lg">
              Visitantes a nuestro portal
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitorCounter;
