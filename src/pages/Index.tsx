import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import MissionVisionSection from '@/components/MissionVisionSection';
import NewsSection from '@/components/NewsSection';
import GallerySection from '@/components/GallerySection';
import EventsSection from '@/components/EventsSection';
import ServicesSection from '@/components/ServicesSection';
import ContactSection from '@/components/ContactSection';
import VisitorCounter from '@/components/VisitorCounter';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <MissionVisionSection />
        <NewsSection />
        <GallerySection />
        <EventsSection />
        <ServicesSection />
        <VisitorCounter />
        <ContactSection />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
