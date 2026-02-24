import { useState } from 'react';
import { MapPin, Clock, Phone, Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        });

      if (error) throw error;

      toast({
        title: '¡Mensaje enviado!',
        description: 'Gracias por contactarnos. Te responderemos pronto.',
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast({
        title: 'Error al enviar',
        description: 'Hubo un problema al enviar tu mensaje. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <section id="contacto" className="pt-24 md:pt-28 pb-28 md:pb-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <button
            type="button"
            className="inline-flex items-center px-6 py-2.5 mb-4 text-sm md:text-base font-semibold rounded-full bg-ibime-green text-white shadow-md hover:bg-ibime-green/90 hover:shadow-lg transition-colors transition-shadow"
          >
            Contáctanos
          </button>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-4">
            Estamos para <span className="text-gradient">Servirte</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg font-medium text-[#374151]">
            ¿Tienes alguna pregunta o sugerencia? No dudes en comunicarte con nosotros.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          {/* Contact Info */}
          <div className="space-y-6 flex flex-col justify-center h-full">
            {contactInfo.map((item, index) => (
              <div
                key={index}
                className="card-institutional flex gap-4 shadow-md hover:shadow-lg"
              >
                <div className="w-16 h-16 rounded-xl bg-ibime-green flex items-center justify-center flex-shrink-0 shadow-md">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[#374151] whitespace-pre-line">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="card-institutional flex flex-col justify-center h-full">
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
                  className="h-12 bg-[#F8FAFC] border border-border/80 focus-visible:border-ibime-green focus-visible:ring-2 focus-visible:ring-ibime-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  className="h-12 bg-[#F8FAFC] border border-border/80 focus-visible:border-ibime-green focus-visible:ring-2 focus-visible:ring-ibime-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  className="bg-[#F8FAFC] border border-border/80 focus-visible:border-ibime-green focus-visible:ring-2 focus-visible:ring-ibime-green/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 inline-flex items-center justify-center rounded-full bg-ibime-green text-white font-semibold shadow-md hover:bg-ibime-green/90 hover:shadow-lg transform hover:-translate-y-0.5 transition-colors transition-transform"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
