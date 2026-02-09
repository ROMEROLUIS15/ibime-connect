import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import logoIBIME from '@/assets/logo-ibime.png';

const quickLinks = [
  { label: 'IBIME', href: '#ibime' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Cartelera', href: '#cartelera' },
];

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand with Logo */}
          <div className="lg:col-span-2">
            <a href="#inicio" className="inline-block mb-6">
              <img 
                src={logoIBIME} 
                alt="IBIME - Instituto de Bibliotecas e Información del Estado Bolivariano de Mérida" 
                className="h-20 w-auto object-contain brightness-0 invert"
              />
            </a>
            <p className="text-primary-foreground/80 max-w-md leading-relaxed mb-6 text-lg">
              <strong>Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.</strong>
              <br />
              <span className="text-primary-foreground/60">Comprometidos con la educación, la cultura y el desarrollo de nuestra comunidad.</span>
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-lg mb-6">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-lg mb-6">Datos Institucionales</h3>
            <address className="not-italic text-primary-foreground/70 space-y-3">
              <p>Sector Glorias Patrias</p>
              <p>Calle 1 Los Eucaliptos</p>
              <p>Entre Av. Gonzalo Picón y Tulio Febres</p>
              <p className="pt-2">Tel: 0274-2623898</p>
              <p>Email: ibimeinformatica@gmail.com</p>
            </address>
          </div>
        </div>

        {/* Logo Box & Bottom Footer */}
        <div className="py-8 border-t border-primary-foreground/10">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-card rounded-xl p-4 mb-4">
              <img 
                src={logoIBIME} 
                alt="IBIME - Instituto de Bibliotecas e Información del Estado Bolivariano de Mérida" 
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>
              © Copyright IBIME. All Rights Reserved
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-accent transition-colors">
                Políticas de Privacidad
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Términos de Uso
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
