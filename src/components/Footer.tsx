import { Twitter, Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import logoIBIME from '@/assets/logo-ibime.png';

const quickLinks = [
  { label: 'IBIME', href: '#ibime' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Cartelera', href: '#cartelera' },
];

const socialLinks = [
  { icon: Twitter,    href: '#', label: 'Twitter' },
  { icon: Facebook,   href: '#', label: 'Facebook' },
  { icon: Instagram,  href: 'https://www.instagram.com/ibimegob?igsh=bTBoN3JrNHRsaDBk', label: 'Instagram' },
  { icon: Linkedin,   href: '#', label: 'LinkedIn' },
];

export const Footer = () => {
  return (
    <footer id="footer-ibime" className="w-full bg-footer-navy text-primary-foreground">
      <div className="container mx-auto px-6">

        {/* ── Grid principal ── */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Columna Brand — 5/12 */}
          <div className="md:col-span-5 flex flex-col">
            {/* Logo + nombre en fila, separados semánticamente */}
            <a href="#inicio" className="inline-flex items-center gap-4 mb-4 w-fit">
              <div
                className="bg-white rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ width: 64, height: 64, padding: 8 }}
              >
                <img
                  src={logoIBIME}
                  alt="Logo IBIME"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <span
                className="font-display font-bold text-white leading-tight"
                style={{ fontSize: 15 }}
              >
                IBIME
                <span
                  className="block font-sans font-normal text-primary-foreground/60"
                  style={{ fontSize: 11, marginTop: 2 }}
                >
                  Estado Bolivariano de Mérida
                </span>
              </span>
            </a>

            {/* Descripción institucional */}
            <p
              className="text-primary-foreground/75 leading-relaxed mb-6"
              style={{ fontSize: 13.5, maxWidth: 340 }}
            >
              Instituto Autónomo de Servicios de Bibliotecas e Información del
              Estado Bolivariano de Mérida. Comprometidos con la educación, la
              cultura y el desarrollo de nuestra comunidad.
            </p>

            {/* Redes sociales */}
            <div className="flex gap-2.5">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full border transition-all duration-200 hover:bg-ibime-green hover:border-ibime-green hover:text-white hover:scale-110"
                  style={{
                    width: 36, height: 36,
                    borderColor: 'rgba(255,255,255,0.25)',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <social.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Columna Enlaces — 3/12 */}
          <div className="md:col-span-3">
            <h3
              className="font-display font-bold text-white mb-5"
              style={{ fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-ibime-green transition-colors"
                    style={{ fontSize: 13.5 }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna Datos — 4/12 */}
          <div className="md:col-span-4">
            <h3
              className="font-display font-bold text-white mb-5"
              style={{ fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              Datos Institucionales
            </h3>
            <address className="not-italic space-y-3" style={{ fontSize: 13.5 }}>
              {/* Dirección agrupada en un solo bloque */}
              <div className="flex items-start gap-2.5 text-primary-foreground/70">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-ibime-green/80" />
                <span className="leading-relaxed">
                  Sector Glorias Patrias, Calle 1 Los Eucaliptos,
                  entre Av. Gonzalo Picón y Tulio Febres
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-primary-foreground/70">
                <Phone size={15} className="flex-shrink-0 text-ibime-green/80" />
                <span>0274-2623898</span>
              </div>
              <div className="flex items-center gap-2.5 text-primary-foreground/70">
                <Mail size={15} className="flex-shrink-0 text-ibime-green/80" />
                <a
                  href="mailto:ibimeinformatica@gmail.com"
                  className="hover:text-ibime-green transition-colors break-all"
                >
                  ibimeinformatica@gmail.com
                </a>
              </div>
            </address>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="w-full border-t border-primary-foreground/10 py-5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>
            <p>© {new Date().getFullYear()} IBIME. Todos los derechos reservados.</p>
            <div className="flex gap-5">
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
