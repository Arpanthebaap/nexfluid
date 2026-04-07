import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const domainDetector = {
  name: 'domain',
  lookup() {
    if (typeof window === 'undefined') return undefined;
    const host = window.location.hostname;
    if (host === 'nexfluid.com' || host === 'www.nexfluid.com') return 'en';
    if (host === 'nexfluid.it' || host === 'www.nexfluid.it') return 'it';
    return undefined;
  },
  cacheUserLanguage() {},
};

const lngDetector = new LanguageDetector();
lngDetector.addDetector(domainDetector);

const resources = {
  it: {
    translation: {
      nav: {
        home: 'Home',
        products: 'Prodotti',
        about: 'Chi Siamo',
        contact: 'Contatti',
        search: 'Cerca per codice prodotto...',
        requestQuote: 'Richiedi Preventivo',
      },
      hero: {
        title: 'Soluzioni Industriali di Precisione',
        subtitle: 'Valvole, pneumatica e automazione per l\'industria. Oltre 85.000 prodotti dai migliori brand.',
        searchPlaceholder: 'Cerca per codice prodotto o nome...',
        cta: 'Sfoglia il Catalogo',
      },
      categories: {
        title: 'Categorie Prodotto',
        subtitle: 'Esplora la nostra gamma completa di componenti industriali',
        viewAll: 'Vedi Tutti',
      },
      features: {
        title: 'Perché Scegliere Nexfluid',
        catalog: 'Catalogo Completo',
        catalogDesc: 'Oltre 85.000 prodotti industriali dai migliori produttori mondiali.',
        support: 'Supporto Tecnico',
        supportDesc: 'Team di esperti pronti ad assisterti nella scelta del prodotto giusto.',
        delivery: 'Preventivi Rapidi',
        deliveryDesc: 'Risposte in 24 ore con prezzi competitivi e consegna veloce.',
        quality: 'Qualità Garantita',
        qualityDesc: 'Solo prodotti originali con certificazioni e garanzia completa.',
      },
      quote: {
        title: 'Richiedi Preventivo',
        name: 'Nome',
        company: 'Azienda',
        email: 'Email',
        phone: 'Telefono',
        product: 'Prodotto',
        message: 'Messaggio',
        submit: 'Invia Richiesta',
        success: 'Richiesta inviata con successo!',
        successDesc: 'Ti contatteremo entro 24 ore.',
      },
      footer: {
        description: 'Soluzioni industriali di precisione per valvole, pneumatica e automazione.',
        quickLinks: 'Link Rapidi',
        contactUs: 'Contattaci',
        rights: 'Tutti i diritti riservati.',
      },
      product: {
        code: 'Codice Prodotto',
        brand: 'Marca',
        specs: 'Specifiche Tecniche',
        related: 'Prodotti Correlati',
        requestQuote: 'Richiedi Preventivo',
        addToInquiry: 'Aggiungi alla Richiesta',
      },
      search: {
        results: 'Risultati di Ricerca',
        noResults: 'Nessun risultato trovato',
        showing: 'Mostrando',
        of: 'di',
        products: 'prodotti',
      },
    },
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        products: 'Products',
        about: 'About Us',
        contact: 'Contact',
        search: 'Search by product code...',
        requestQuote: 'Request Quote',
      },
      hero: {
        title: 'Precision Industrial Solutions',
        subtitle: 'Valves, pneumatics and automation for industry. Over 85,000 products from leading brands.',
        searchPlaceholder: 'Search by product code or name...',
        cta: 'Browse Catalog',
      },
      categories: {
        title: 'Product Categories',
        subtitle: 'Explore our complete range of industrial components',
        viewAll: 'View All',
      },
      features: {
        title: 'Why Choose Nexfluid',
        catalog: 'Complete Catalog',
        catalogDesc: 'Over 85,000 industrial products from the world\'s leading manufacturers.',
        support: 'Technical Support',
        supportDesc: 'Expert team ready to assist you in choosing the right product.',
        delivery: 'Fast Quotes',
        deliveryDesc: 'Responses within 24 hours with competitive pricing and fast delivery.',
        quality: 'Guaranteed Quality',
        qualityDesc: 'Only original products with full certifications and warranty.',
      },
      quote: {
        title: 'Request a Quote',
        name: 'Name',
        company: 'Company',
        email: 'Email',
        phone: 'Phone',
        product: 'Product',
        message: 'Message',
        submit: 'Submit Request',
        success: 'Request submitted successfully!',
        successDesc: 'We will contact you within 24 hours.',
      },
      footer: {
        description: 'Precision industrial solutions for valves, pneumatics and automation.',
        quickLinks: 'Quick Links',
        contactUs: 'Contact Us',
        rights: 'All rights reserved.',
      },
      product: {
        code: 'Product Code',
        brand: 'Brand',
        specs: 'Technical Specifications',
        related: 'Related Products',
        requestQuote: 'Request Quote',
        addToInquiry: 'Add to Inquiry',
      },
      search: {
        results: 'Search Results',
        noResults: 'No results found',
        showing: 'Showing',
        of: 'of',
        products: 'products',
      },
    },
  },
};

i18n
  .use(lngDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it',
    interpolation: { escapeValue: false },
    detection: {
      order: ['domain', 'querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
    },
  });

export default i18n;
