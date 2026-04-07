import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const content = {
  it: {
    title: 'Cookie Policy',
    metaTitle: 'Cookie Policy | Nexfluid',
    metaDesc: 'Informativa sull\'utilizzo dei cookie sul sito Nexfluid.',
    lastUpdated: 'Ultimo aggiornamento: Aprile 2026',
    sections: [
      {
        heading: '1. Cosa Sono i Cookie',
        body: `I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente durante la navigazione di un sito web. Vengono utilizzati per migliorare l'esperienza di navigazione, memorizzare le preferenze e raccogliere informazioni aggregate sull'utilizzo del sito.`,
      },
      {
        heading: '2. Cookie Tecnici (Necessari)',
        body: `Il nostro sito utilizza cookie tecnici essenziali per il corretto funzionamento del servizio. Questi cookie non richiedono il consenso dell'utente in quanto strettamente necessari.\n\n• Cookie di sessione — gestiscono l'autenticazione e la sessione di navigazione\n• Cookie di preferenza lingua — memorizzano la lingua selezionata dall'utente (italiano o inglese)\n• Cookie di sicurezza — proteggono da attività fraudolente`,
      },
      {
        heading: '3. Cookie Funzionali',
        body: `Utilizziamo cookie funzionali per migliorare l'esperienza dell'utente:\n\n• Memorizzazione delle preferenze di navigazione\n• Ottimizzazione della visualizzazione dei contenuti`,
      },
      {
        heading: '4. Cookie di Terze Parti',
        body: `Il sito può includere servizi di terze parti che installano propri cookie:\n\n• WhatsApp (Meta Platforms, Inc.) — il pulsante di contatto WhatsApp presente sul sito può installare cookie per il funzionamento del servizio di messaggistica. Per maggiori informazioni: https://www.whatsapp.com/legal/privacy-policy\n\nNon utilizziamo cookie di profilazione o di tracciamento pubblicitario.`,
      },
      {
        heading: '5. Come Gestire i Cookie',
        body: `L'utente può gestire le preferenze sui cookie attraverso le impostazioni del proprio browser:\n\n• Google Chrome: Impostazioni → Privacy e sicurezza → Cookie\n• Mozilla Firefox: Impostazioni → Privacy e sicurezza\n• Safari: Preferenze → Privacy\n• Microsoft Edge: Impostazioni → Cookie e autorizzazioni sito\n\nLa disattivazione dei cookie tecnici potrebbe compromettere il corretto funzionamento del sito.`,
      },
      {
        heading: '6. Contatti',
        body: `Per qualsiasi domanda relativa all'utilizzo dei cookie, contattare:\n\nNexfluid\nVia De Gasperi 6, Z.I., 35030 Saccolongo (PD), Italia\nEmail: info@nexfluid.it\nTelefono: 049.8016529`,
      },
    ],
  },
  en: {
    title: 'Cookie Policy',
    metaTitle: 'Cookie Policy | Nexfluid',
    metaDesc: 'Information about cookie usage on the Nexfluid website.',
    lastUpdated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: `Cookies are small text files stored on the user's device while browsing a website. They are used to improve the browsing experience, store preferences, and collect aggregate information about site usage.`,
      },
      {
        heading: '2. Technical Cookies (Necessary)',
        body: `Our site uses essential technical cookies required for proper service operation. These cookies do not require user consent as they are strictly necessary.\n\n• Session cookies — manage authentication and browsing session\n• Language preference cookies — store the user's selected language (Italian or English)\n• Security cookies — protect against fraudulent activity`,
      },
      {
        heading: '3. Functional Cookies',
        body: `We use functional cookies to enhance the user experience:\n\n• Storing browsing preferences\n• Optimizing content display`,
      },
      {
        heading: '4. Third-Party Cookies',
        body: `The site may include third-party services that install their own cookies:\n\n• WhatsApp (Meta Platforms, Inc.) — the WhatsApp contact button on the site may install cookies for the messaging service to function. For more information: https://www.whatsapp.com/legal/privacy-policy\n\nWe do not use profiling or advertising tracking cookies.`,
      },
      {
        heading: '5. How to Manage Cookies',
        body: `Users can manage cookie preferences through their browser settings:\n\n• Google Chrome: Settings → Privacy and security → Cookies\n• Mozilla Firefox: Settings → Privacy & Security\n• Safari: Preferences → Privacy\n• Microsoft Edge: Settings → Cookies and site permissions\n\nDisabling technical cookies may affect the proper functioning of the site.`,
      },
      {
        heading: '6. Contact',
        body: `For any questions regarding cookie usage, contact:\n\nNexfluid\nVia De Gasperi 6, Z.I., 35030 Saccolongo (PD), Italy\nEmail: info@nexfluid.it\nPhone: 049.8016529`,
      },
    ],
  },
};

const CookiePolicy = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'en' ? 'en' : 'it') as 'it' | 'en';
  const c = content[lang];

  return (
    <>
      <Helmet>
        <title>{c.metaTitle}</title>
        <meta name="description" content={c.metaDesc} />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary mb-2">{c.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{c.lastUpdated}</p>
        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-display font-semibold text-foreground mb-3">{s.heading}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
};

export default CookiePolicy;
