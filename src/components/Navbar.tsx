import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoIBIME from '@/assets/logo-ibime.png';
import gobernadorLogo from '@/assets/gobernador-logo.png';

// Unified Primary Green (forest green brand): Hex #15803d
const IBIME_GREEN = "#15803d";

/**
 * Handles smooth scroll and navigation for hash/route links.
 */
const useHashNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    } else if (href.startsWith('#')) {
      // If not on homepage, navigate with hash
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate('/' + href);
      }
      // else default anchor behavior works
    }
  };

  return handleNavClick;
};

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'IBIME', href: '#ibime' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Fondo Editorial', href: '/fondo-editorial' },
  { label: 'Cartelera Informativa', href: '#cartelera' },
  { label: 'Servicios', href: '#servicios' },
  {
    label: 'Comunidad IBIME',
    href: '#comunidad',
    children: [
      { label: 'Sistema de Estudios', href: '#estudios' },
      { label: 'Experiencia Creditable', href: '#experiencia' },
      { label: 'Artículos de Interés', href: '#articulos' },
      { label: 'Videos', href: '#videos' },
      { label: 'Memoria Fotográfica', href: '#memoria-foto' },
      { label: 'Memoria Biohistórica', href: '#memoria-bio' },
      {
        label: 'Otros Artículos de Interés',
        href: '#otros',
        children: [
          { label: 'Código de Conducta', href: '#codigo' },
          { label: 'A los Servidores Públicos', href: '#servidores' },
          { label: 'Gaceta 3363', href: '#gaceta' },
          { label: 'El Grito Manso', href: '#grito' },
          { label: 'Capítulo 4 y 5', href: '#capitulos' },
          { label: 'Fuertes Colab', href: '#fuertes' },
        ],
      },
    ],
  },
  { label: 'Koha', href: '/koha' },
  { label: 'Libro Hablado', href: '/libro-hablado' },
  { label: 'Contacto', href: '#contacto' },
];

// Returns true if the (root) item is "active" for current hash
const useActiveNav = () => {
  const location = useLocation();
  return (href: string) => {
    // For now, just match hash for anchors or path for pages
    if (href.startsWith('/')) {
      return location.pathname === href;
    }
    if (href.startsWith('#')) {
      return location.hash === href;
    }
    return false;
  };
};

/**
 * Brand-aware DropdownMenu.
 */
const DropdownMenu = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleNavClick = useHashNavigation();
  const isActive = useActiveNav();
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    handleNavClick(item.href, e);
  };

  // Brand hover/active styles:
  const hoverBase =
    'transition-colors rounded-md';
  const base =
    depth === 0
      ? 'text-foreground'
      : 'text-foreground/80';

  // For hover/active: brand green text and subtle green bg
  const hover =
    depth === 0
      ? `hover:text-white hover:bg-[${IBIME_GREEN}]`
      : `hover:text-[${IBIME_GREEN}] hover:bg-[${IBIME_GREEN}] hover:bg-opacity-10`;

  // If item is active, brand green text & bold
  const active =
    isActive(item.href)
      ? `text-[${IBIME_GREEN}] font-bold bg-[${IBIME_GREEN}] bg-opacity-10`
      : '';

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <a
        href={item.href}
        onClick={handleClick}
        className={`
          flex items-center gap-1 px-3 py-2 text-sm font-medium
          ${hoverBase}
          ${base}
          ${hover}
          ${active}
        `}
        style={{
          color: isActive(item.href)
            ? IBIME_GREEN
            : undefined,
          fontWeight: isActive(item.href)
            ? 700
            : undefined,
          backgroundColor: isActive(item.href) && depth === 0
            ? '#15803d20'
            : undefined,
        }}
      >
        {item.label}
        {hasChildren && <ChevronDown className="w-4 h-4" />}
      </a>
      
      {hasChildren && isOpen && (
        <div
          className={`absolute z-50 min-w-[220px] py-2 bg-card rounded-lg shadow-lg border border-border
            ${depth === 0 ? 'top-full left-0 mt-1' : 'left-full top-0 ml-1'}`}
        >
          {item.children!.map((child, index) => (
            <DropdownMenu key={index} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Mobile menu with unified brand hover & active styles.
 */
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const handleNavClick = useHashNavigation();
  const isActive = useActiveNav();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);

    return (
      <div key={item.label}>
        <div
          className={`
            flex items-center justify-between px-4 py-3 border-b border-border/50
            ${depth === 0 ? '' : depth === 1 ? 'pl-8' : depth === 2 ? 'pl-12' : 'pl-16'}
            group
          `}
        >
          <a
            href={item.href}
            onClick={(e) => {
              handleNavClick(item.href, e);
              onClose();
            }}
            className={`
              font-medium flex-1 
              transition-colors rounded-md
              ${isActive(item.href)
                ? 'text-white font-bold bg-[${IBIME_GREEN}]'
                : 'text-foreground'
              }
              hover:bg-[${IBIME_GREEN}] hover:text-white
            `}
            style={{
              background: isActive(item.href) ? IBIME_GREEN : undefined,
              color: isActive(item.href) ? '#fff' : undefined,
              fontWeight: isActive(item.href) ? 700 : undefined,
            }}
          >
            {item.label}
          </a>
          {hasChildren && (
            <button
              onClick={() => toggleExpand(item.label)}
              className="p-2 text-muted-foreground hover:text-[${IBIME_GREEN}] focus:outline-none"
              type="button"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                style={{
                  color: isExpanded ? IBIME_GREEN : undefined,
                }}
              />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="bg-muted/30">
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      <div
        className={`absolute inset-0 bg-foreground/50 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 right-0 w-full max-w-sm h-full bg-card shadow-xl transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span
            className="text-lg font-display font-bold"
            style={{ color: IBIME_GREEN }}
          >
            IBIME
          </span>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-[${IBIME_GREEN}] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-64px)] flex flex-col">
          <div>
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleNavClick = useHashNavigation();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 gap-4">
            {/* Logo IBIME - left */}
            <a
              href="/#inicio"
              onClick={(e) => handleNavClick('#inicio', e)}
              className="flex-shrink-0 flex items-center"
            >
              <img 
                src={logoIBIME} 
                alt="IBIME" 
                className="h-14 w-auto object-contain"
              />
            </a>

            {/* Navigation - centered */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center gap-1">
                {menuItems.map((item, index) => (
                  <DropdownMenu key={index} item={item} />
                ))}
              </div>
            </div>

            {/* Logo Gobernación - right */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block flex-shrink-0 pl-4 border-l border-border/50">
                <img
                  src={gobernadorLogo}
                  alt="Gobernación de Mérida"
                  className="h-10 md:h-12 lg:h-14 w-auto object-contain"
                />
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-foreground hover:text-[${IBIME_GREEN}] transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
};

export default Navbar;
