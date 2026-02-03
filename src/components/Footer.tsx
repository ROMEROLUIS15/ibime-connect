import { BookOpen, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

const quickLinks = [
  { label: 'Editorial', href: '#editorial' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Noticias', href: '#cartelera' },
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
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#inicio" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-accent-foreground" />
              </div>
              <div>
                <span className="text-2xl font-display font-bold">eBIMe</span>
                <p className="text-xs text-primary-foreground/60">Red de Bibliotecas Metropolitanas</p>
              </div>
            </a>
            <p className="text-primary-foreground/70 max-w-md leading-relaxed mb-6">
              Comprometidos con la educación, la cultura y el desarrollo de nuestra comunidad. 
              Acercando el conocimiento a todos los ciudadanos a través de nuestra red de bibliotecas públicas.
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
              <p>Av. Principal #123</p>
              <p>Centro Histórico</p>
              <p>Edificio Institucional, Piso 3</p>
              <p className="pt-2">Tel: +58 (212) 555-0123</p>
              <p>Email: info@ebime.gob.ve</p>
            </address>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>
              © {new Date().getFullYear()} eBIMe - Red de Bibliotecas Metropolitanas. Todos los derechos reservados.
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
