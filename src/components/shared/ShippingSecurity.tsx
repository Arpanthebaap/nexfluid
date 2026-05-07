import { useTranslation } from 'react-i18next';
import truckIcon from '@/assets/icon-shipping-truck.png';
import h24Icon from '@/assets/icon-24h.png';
import boxIcon from '@/assets/icon-box.png';

const ShippingSecurity = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const items = [
    {
      icon: truckIcon,
      title: lang === 'it' ? 'Spedizione in Italia e UE' : 'Shipping service in Italy and EU',
      desc: lang === 'it'
        ? 'Servizi di spedizione via Northern Express ed altri corrieri su tutto il territorio nazionale e UE.'
        : 'Shipping services via Northern Express and other couriers throughout Italy and the EU.',
    },
    {
      icon: h24Icon,
      title: lang === 'it' ? 'Consegna Express in 24 ore' : 'Express delivery in 24 hours',
      desc: lang === 'it'
        ? 'Servizio di consegna urgente disponibile per ordini espressi.'
        : '24-hour delivery throughout Italy and express orders shipping worldwide.',
    },
    {
      icon: boxIcon,
      title: lang === 'it' ? 'Disponibilità immediata' : 'Immediate availability',
      desc: lang === 'it'
        ? 'Alta disponibilità di prodotti per le tue esigenze con consegna immediata.'
        : 'High availability of products from our warehouse, ready for immediate dispatch.',
    },
  ];

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight text-center mb-8 text-primary">
          {lang === 'it' ? 'Spedizione e Sicurezza' : 'Shipping and Security'}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-6 text-center space-y-3"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center">
                <img src={item.icon} alt={item.title} className="h-16 w-16 object-contain" loading="lazy" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShippingSecurity;
