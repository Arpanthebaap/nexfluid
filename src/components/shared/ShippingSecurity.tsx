import { useTranslation } from 'react-i18next';
import { Truck, Clock, CheckCircle } from 'lucide-react';

const ShippingSecurity = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const items = [
    {
      icon: Truck,
      title: lang === 'it' ? 'Spedizioni in Italia e UE' : 'Shipping service in Italy and EU',
      desc: lang === 'it'
        ? 'Consegne dirette dal magazzino in Nord Italia e spedizioni in tutta la UE.'
        : 'Direct deliveries throughout Northern Italy and shipments across the EU.',
    },
    {
      icon: Clock,
      title: lang === 'it' ? 'Consegna express in 24h' : 'Express delivery in 24 hours',
      desc: lang === 'it'
        ? 'Consegna 24 ore in tutta Italia e express. Spedizioni in tutta la UE.'
        : '24 hour delivery throughout Italy and express. Shipping within the EU.',
    },
    {
      icon: CheckCircle,
      title: lang === 'it' ? 'Disponibilità immediata' : 'Immediate availability',
      desc: lang === 'it'
        ? 'Ampia disponibilità di prodotti dai migliori brand.'
        : 'Wide availability of products from the best brands.',
    },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold sm:text-3xl font-display uppercase tracking-tight text-foreground">
          {lang === 'it' ? 'Spedizione e Sicurezza' : 'Shipping and Security'}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center rounded-lg border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShippingSecurity;
