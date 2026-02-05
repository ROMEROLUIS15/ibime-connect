import { useState } from 'react';
import { MapPin, Clock, Phone, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import logoIBIME from '@/assets/logo-ibime.png';

export const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: '¡Mensaje enviado!',
      description: 'Gracias por contactarnos. Te responderemos pronto.',
    });
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Dirección',
      content: 'Sector Glorias Patrias, Calle 1 Los Eucaliptos,\nentre Av. Gonzalo Picón y Tulio Febres',
    },
    {
      icon: Clock,
      title: 'Horario de Atención',
      content: 'De Lunes a Viernes\n8:00 a.m a 12:00 p.m\n1:00 p.m a 4:00 p.m',
    },
    {
      icon: Phone,
      title: 'Teléfono',
      content: '0274-2623898',
    },
    {
      icon: Mail,
      title: 'Correo Electrónico',
      content: 'ibimeinformatica@gmail.com',
    },
  ];

  return (
    <section id="contacto" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-institutional mb-4">Contáctanos</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Estamos para <span className="text-gradient">Servirte</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            ¿Tienes alguna pregunta o sugerencia? No dudes en comunicarte con nosotros.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info with Logo */}
          <div className="space-y-6">
            {/* Logo and Institutional Text */}
            <div className="card-institutional text-center p-8 bg-gradient-institutional">
              <img 
                src={logoIBIME} 
                alt="IBIME - Instituto de Bibliotecas e Información del Estado Bolivariano de Mérida" 
                className="h-24 w-auto object-contain mx-auto mb-4 brightness-0 invert"
              />
              <p className="text-primary-foreground font-medium leading-relaxed">
                Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida.
              </p>
              <p className="text-primary-foreground/80 text-sm mt-2">
                Comprometidos con la educación, la cultura y el desarrollo de nuestra comunidad.
              </p>
            </div>
            {contactInfo.map((item, index) => (
              <div
                key={index}
                className="card-institutional flex gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-institutional flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="card-institutional">
            <h3 className="text-2xl font-display font-bold text-foreground mb-6">
              Envíanos un Mensaje
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nombre Completo
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  className="h-12"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  className="h-12"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="¿En qué podemos ayudarte?"
                  required
                  rows={5}
                />
              </div>
              <Button type="submit" className="w-full h-12 btn-hero">
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensaje
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
