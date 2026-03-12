import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoIBIME from '@/assets/logo-ibime.png';
import gobernadorLogo from '@/assets/gobernador-logo.png';

const useHashNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (href: string, e: React.MouseEvent) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    } else if (href.startsWith('#') && location.pathname !== '/') {
      e.preventDefault();
      navigate('/' + href);
    }
  };
};

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Inicio',                href: '#inicio' },
  { label: 'IBIME',                 href: '#ibime' },
  { label: 'Eventos',               href: '#eventos' },
  { label: 'Fondo Editorial',       href: '/fondo-editorial' },
  { label: 'Cartelera Informativa', href: '#cartelera' },
  { label: 'Servicios',             href: '#servicios' },
  {
    label: 'Comunidad IBIME',
    href: '#comunidad',
    children: [
      { label: 'Sistema de Estudios',      href: '#estudios' },
      { label: 'Experiencia Creditable',   href: '#experiencia' },
      { label: 'Artículos de Interés',     href: '#articulos' },
      { label: 'Videos',                   href: '#videos' },
      { label: 'Memoria Fotográfica',      href: '#memoria-foto' },
      { label: 'Memoria Biohistórica',     href: '#memoria-bio' },
      {
        label: 'Otros Artículos de Interés',
        href: '#otros',
        children: [
          { label: 'Código de Conducta',        href: '#codigo' },
          { label: 'A los Servidores Públicos', href: '#servidores' },
          { label: 'Gaceta 3363',               href: '#gaceta' },
          { label: 'El Grito Manso',            href: '#grito' },
          { label: 'Capítulo 4 y 5',            href: '#capitulos' },
          { label: 'Fuertes Colab',             href: '#fuertes' },
        ],
      },
    ],
  },
  { label: 'Koha',          href: '/koha' },
  { label: 'Libro Hablado', href: '/libro-hablado' },
  { label: 'Contacto',      href: '#contacto' },
];

const useActiveNav = () => {
  const location = useLocation();
  return (href: string) => {
    if (href.startsWith('/')) return location.pathname === href;
    if (href.startsWith('#')) return location.hash === href;
    return false;
  };
};

// Paleta de estilos — sutil mint, nunca verde sólido
const NAV_STYLES = {
  // Estado normal
  default:  { color: '#374151', bg: 'transparent' },
  // Hover — mint muy claro, texto verde oscuro (como imagen 2)
  hover:    { color: '#15803d', bg: 'rgba(21,128,61,0.08)' },
  // Activo — mismo mint pero con borde sutil
  active:   { color: '#15803d', bg: 'rgba(21,128,61,0.10)', fontWeight: 600 },
  // Dropdown children hover
  childHover: { color: '#15803d', bg: 'rgba(21,128,61,0.06)' },
};

const DropdownMenu = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
  const [isOpen,  setIsOpen]  = useState(false);
  const [hovered, setHovered] = useState(false);
  const handleNavClick        = useHashNavigation();
  const isActive              = useActiveNav();
  const hasChildren           = !!(item.children?.length);
  const active                = isActive(item.href);

  const getStyle = (): React.CSSProperties => {
    const s = active
      ? NAV_STYLES.active
      : hovered
        ? (depth === 0 ? NAV_STYLES.hover : NAV_STYLES.childHover)
        : NAV_STYLES.default;

    return {
      color:           s.color,
      backgroundColor: s.bg,
      fontWeight:      active ? 600 : 500,
      borderRadius:    6,
      display:         'flex',
      alignItems:      'center',
      gap:             4,
      padding:         depth === 0 ? '6px 11px' : '7px 14px',
      fontSize:        13.5,
      textDecoration:  'none',
      transition:      'color 0.15s, background-color 0.15s',
      whiteSpace:      'nowrap' as const,
      cursor:          'pointer',
    };
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <a
        href={item.href}
        onClick={(e) => handleNavClick(item.href, e)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={getStyle()}
      >
        {item.label}
        {hasChildren && (
          <ChevronDown
            size={13}
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.7,
            }}
          />
        )}
      </a>

      {hasChildren && isOpen && (
        <div style={{
          position:     'absolute',
          zIndex:       50,
          minWidth:     220,
          padding:      '6px 0',
          background:   '#ffffff',
          borderRadius: 10,
          boxShadow:    '0 8px 24px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)',
          border:       '1px solid rgba(0,0,0,0.07)',
          ...(depth === 0
            ? { top: '100%', left: 0, marginTop: 4 }
            : { left: '100%', top: 0, marginLeft: 4 }),
        }}>
          {item.children!.map((child, i) => (
            <DropdownMenu key={i} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile menu — SIN hover verde, estilos neutros/naturales
const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const handleNavClick = useHashNavigation();
  const isActive       = useActiveNav();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (label: string) =>
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );

  const renderItem = (item: MenuItem, depth = 0) => {
    const hasChildren = !!(item.children?.length);
    const isExp       = expanded.includes(item.label);
    const active      = isActive(item.href);
    const paddingLeft = [16, 28, 40, 52][depth] ?? 52;

    return (
      <div key={item.label}>
        <div style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          paddingLeft,
          paddingRight:    16,
          paddingTop:      11,
          paddingBottom:   11,
          borderBottom:    '1px solid rgba(0,0,0,0.06)',
          // Sin hover verde — fondo transparente siempre
          background:      'transparent',
        }}>
          <a
            href={item.href}
            onClick={(e) => { handleNavClick(item.href, e); onClose(); }}
            style={{
              flex:           1,
              fontSize:       14,
              fontWeight:     active ? 600 : 400,
              // Activo → solo texto verde, sin fondo
              color:          active ? '#15803d' : '#374151',
              background:     'transparent',
              textDecoration: 'none',
              padding:        '2px 0',
            }}
          >
            {item.label}
          </a>
          {hasChildren && (
            <button
              onClick={() => toggle(item.label)}
              style={{
                padding:    8,
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                color:      isExp ? '#15803d' : '#9ca3af',
                flexShrink: 0,
              }}
            >
              <ChevronDown
                size={16}
                style={{
                  transition: 'transform 0.2s',
                  transform:  isExp ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>
          )}
        </div>

        {hasChildren && isExp && (
          <div style={{ background: 'rgba(0,0,0,0.015)' }}>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div
        className={`absolute inset-0 bg-foreground/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header del panel móvil */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 16px',
          borderBottom:   '1px solid rgba(0,0,0,0.08)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>
            Menú IBIME
          </span>
          <button
            onClick={onClose}
            style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', height: 'calc(100% - 56px)' }}>
          {menuItems.map(item => renderItem(item))}
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

            {/* Logo IBIME */}
            <a
              href="/#inicio"
              onClick={(e) => handleNavClick('#inicio', e)}
              className="flex-shrink-0 flex items-center"
            >
              <img src={logoIBIME} alt="IBIME" className="h-14 w-auto object-contain" />
            </a>

            {/* Menú desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center gap-0.5">
                {menuItems.map((item, i) => (
                  <DropdownMenu key={i} item={item} />
                ))}
              </div>
            </div>

            {/* Logo Gobernación + botón móvil */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block flex-shrink-0 pl-4 border-l border-border/50">
                <img
                  src={gobernadorLogo}
                  alt="Gobernación de Mérida"
                  className="h-10 md:h-12 lg:h-14 w-auto object-contain"
                />
              </div>
              <button
                className="lg:hidden p-2 text-gray-600 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu size={22} />
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
