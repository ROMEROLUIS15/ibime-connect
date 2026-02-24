import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import logoIBIME from '@/assets/logo-ibime.png';

const quickLinks = [
  { label: 'IBIME', href: '#ibime' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Cartelera', href: '#cartelera' },
  {
    label: 'Catálogo Koha',
    href: 'http://www.ibime.gob.ve',
    external: true,
    ariaLabel: 'Acceso al Catálogo de Biblioteca Koha',
  },
];

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  {
    icon: Instagram,
    href: 'https://www.instagram.com/ibimegob?igsh=bTBoN3JrNHRsaDBk',
    label: 'Instagram',
  },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export const Footer = () => {
  return (
    <footer className="bg-footer-navy text-primary-foreground">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand with Logo */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <a href="#inicio" className="inline-flex items-center mb-6">
              <div className="bg-white rounded-lg p-3 w-20 h-20 flex items-center justify-center mr-4">
                <img
                  src={logoIBIME}
                  alt="IBIME - Instituto de Bibliotecas e Información del Estado Bolivariano de Mérida"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-primary-foreground/90 leading-relaxed text-base sm:text-lg max-w-xl">
                <strong>Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.</strong>
                <br />
                <span className="text-primary-foreground/80">
                  Comprometidos con la educación, la cultura y el desarrollo de nuestra comunidad.
                </span>
              </p>
            </a>
            {/* Social Links */}
            <div className="flex gap-3 mt-2">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-primary-foreground/30 text-primary-foreground/80 hover:bg-ibime-green hover:border-ibime-green hover:text-white hover:scale-110 transition-colors transition-transform"
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
                    className="text-primary-foreground/90 hover:text-ibime-green transition-colors"
                    {...(link.external
                      ? {
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          'aria-label': link.ariaLabel,
                        }
                      : {})}
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
            <address className="not-italic text-primary-foreground/85 space-y-3">
              <p>Sector Glorias Patrias</p>
              <p>Calle 1 Los Eucaliptos</p>
              <p>Entre Av. Gonzalo Picón y Tulio Febres</p>
              <p className="pt-2">Tel: 0274-2623898</p>
              <p>Email: ibimeinformatica@gmail.com</p>
            </address>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-4 py-6 border-t border-primary-foreground/15 bg-black/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/75">
            <p>
              © Copyright IBIME. All Rights Reserved
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-ibime-green transition-colors">
                Políticas de Privacidad
              </a>
              <a href="#" className="hover:text-ibime-green transition-colors">
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
