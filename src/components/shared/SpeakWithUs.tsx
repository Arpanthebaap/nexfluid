import { useTranslation } from 'react-i18next';
import { Phone } from 'lucide-react';

const SpeakWithUs = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <section className="bg-primary py-12 md:py-16 text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-xl font-bold sm:text-2xl font-display uppercase tracking-tight">
          Speak With Us
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/60 leading-relaxed">
          {lang === 'it'
            ? 'Contattaci per ricevere un preventivo gratuito e personalizzato, il nostro team può aiutarti a identificare i pezzi esatti di cui hai bisogno in base alla tua specifica applicazione.'
            : 'Contact us to receive a free and personalized quote, our team can help you identify the exact parts you need based on your specific application.'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="tel:+390498016529"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary-foreground/60 bg-transparent px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <Phone className="h-4 w-4" />
            049.8016529
          </a>
          <a
            href="https://wa.me/393338933395"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary-foreground/60 bg-transparent px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <Phone className="h-4 w-4" />
            333.8933395
          </a>
        </div>
      </div>
    </section>
  );
};

export default SpeakWithUs;