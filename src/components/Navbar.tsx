import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import logoIBIME from '@/assets/logo-ibime.png';

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'IBIME', href: '/#ibime' },
  { label: 'Eventos', href: '/#eventos' },
  { label: 'Fondo Editorial', href: '/fondo-editorial' },
  { label: 'Cartelera Informativa', href: '/#cartelera' },
  { label: 'Servicios', href: '/#servicios' },
  {
    label: 'Comunidad IBIME',
    href: '/#comunidad',
    children: [
      { label: 'Sistema de Estudios', href: '/#estudios' },
      { label: 'Experiencia Creditable', href: '/#experiencia' },
      { label: 'Artículos de Interés', href: '/#articulos' },
      { label: 'Videos', href: '/#videos' },
      { label: 'Memoria Fotográfica', href: '/#memoria-foto' },
      { label: 'Memoria Biohistórica', href: '/#memoria-bio' },
      {
        label: 'Otros Artículos de Interés',
        href: '/#otros',
        children: [
          { label: 'Código de Conducta', href: '/#codigo' },
          { label: 'A los Servidores Públicos', href: '/#servidores' },
          { label: 'Gaceta 3363', href: '/#gaceta' },
          { label: 'El Grito Manso', href: '/#grito' },
          { label: 'Capítulo 4 y 5', href: '/#capitulos' },
          { label: 'Fuertes Colab', href: '/#fuertes' },
        ],
      },
    ],
  },
  { label: 'Koha', href: '/koha' },
  { label: 'Libro Hablado', href: '/libro-hablado' },
  { label: 'Contacto', href: '/#contacto' },
];

const DropdownMenu = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <a
        href={item.href}
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md
          ${depth === 0 
            ? 'text-foreground hover:text-secondary hover:bg-secondary/10' 
            : 'text-foreground/80 hover:text-secondary hover:bg-secondary/5'
          }`}
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

const MobileMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
          className={`flex items-center justify-between px-4 py-3 border-b border-border/50
            ${depth > 0 ? 'pl-' + (4 + depth * 4) : ''}`}
        >
          <a
            href={item.href}
            onClick={onClose}
            className="text-foreground font-medium flex-1"
          >
            {item.label}
          </a>
          {hasChildren && (
            <button
              onClick={() => toggleExpand(item.label)}
              className="p-2 text-muted-foreground"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
          <span className="text-lg font-display font-bold text-secondary">IBIME</span>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </div>
    </div>
  );
};

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar-institutional fixed top-0 left-0 right-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            {/* Logo */}
            <a href="#inicio" className="flex items-center gap-3">
              <img 
                src={logoIBIME} 
                alt="IBIME - Instituto de Bibliotecas e Información del Estado Bolivariano de Mérida" 
                className="h-14 w-auto object-contain"
              />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {menuItems.map((item, index) => (
                <DropdownMenu key={index} item={item} />
              ))}
            </div>

            {/* Institutional Block - Reserved space for logo */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-xl font-display font-bold text-gradient">IBIME</p>
                <p className="text-xs text-muted-foreground">Estado Bolivariano de Mérida</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-foreground hover:text-secondary transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
};

export default Navbar;
