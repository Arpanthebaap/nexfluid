import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const content = {
  it: {
    title: 'Informativa sulla Privacy',
    metaTitle: 'Informativa sulla Privacy | Nexfluid',
    metaDesc: 'Informativa sulla privacy di Nexfluid ai sensi del GDPR e del D.Lgs. 196/2003.',
    lastUpdated: 'Ultimo aggiornamento: Aprile 2026',
    sections: [
      {
        heading: '1. Titolare del Trattamento',
        body: `Il Titolare del trattamento dei dati personali è Nexfluid, con sede in Via De Gasperi 6, Zona Industriale, 35030 Saccolongo (PD), Italia.\n\nEmail: info@nexfluid.it\nTelefono: 049.8016529\nFax: 049.8016551`,
      },
      {
        heading: '2. Dati Raccolti',
        body: `Raccogliamo i seguenti dati personali forniti volontariamente dall'utente tramite il modulo di richiesta preventivo:\n\n• Nome e cognome\n• Indirizzo email\n• Numero di telefono\n• Nome dell'azienda\n• Codice prodotto e messaggio di richiesta\n\nRaccogliamo inoltre dati tecnici in forma anonima durante la navigazione (indirizzo IP anonimizzato, tipo di browser, pagine visitate).`,
      },
      {
        heading: '3. Finalità e Base Giuridica',
        body: `I dati personali vengono trattati per le seguenti finalità:\n\n• Elaborazione delle richieste di preventivo — base giuridica: esecuzione di misure precontrattuali (Art. 6(1)(b) GDPR)\n• Risposta alle comunicazioni dell'utente — base giuridica: legittimo interesse (Art. 6(1)(f) GDPR)\n• Miglioramento del servizio e analisi aggregate — base giuridica: legittimo interesse (Art. 6(1)(f) GDPR)\n\nI dati non vengono utilizzati per finalità di marketing diretto senza il consenso esplicito dell'utente.`,
      },
      {
        heading: '4. Conservazione dei Dati',
        body: `I dati personali relativi alle richieste di preventivo vengono conservati per un periodo massimo di 24 mesi dalla data di ricezione, salvo obblighi di legge che ne richiedano una conservazione più lunga.\n\nI dati tecnici di navigazione vengono conservati in forma anonima per un massimo di 12 mesi.`,
      },
      {
        heading: '5. Comunicazione a Terzi',
        body: `I dati personali non vengono venduti, ceduti o condivisi con terze parti per finalità di marketing.\n\nI dati possono essere comunicati a:\n\n• Fornitori di servizi tecnologici (hosting, database) necessari al funzionamento del sito, che agiscono in qualità di responsabili del trattamento\n• Autorità competenti, se richiesto dalla legge`,
      },
      {
        heading: '6. Diritti dell\'Interessato',
        body: `Ai sensi degli articoli 15-22 del GDPR, l'utente ha diritto di:\n\n• Accedere ai propri dati personali\n• Rettificare dati inesatti o incompleti\n• Richiedere la cancellazione dei dati (diritto all'oblio)\n• Limitare il trattamento\n• Richiedere la portabilità dei dati\n• Opporsi al trattamento\n• Proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it)\n\nPer esercitare i propri diritti, contattare: info@nexfluid.it`,
      },
      {
        heading: '7. Sicurezza',
        body: `Adottiamo misure tecniche e organizzative appropriate per proteggere i dati personali da accesso non autorizzato, perdita, distruzione o alterazione, in conformità con l'Art. 32 del GDPR.`,
      },
      {
        heading: '8. Modifiche alla Presente Informativa',
        body: `Ci riserviamo il diritto di aggiornare la presente informativa. Eventuali modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.`,
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | Nexfluid',
    metaDesc: 'Nexfluid privacy policy in compliance with GDPR and Italian privacy regulations.',
    lastUpdated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. Data Controller',
        body: `The Data Controller is Nexfluid, located at Via De Gasperi 6, Industrial Zone, 35030 Saccolongo (PD), Italy.\n\nEmail: info@nexfluid.it\nPhone: 049.8016529\nFax: 049.8016551`,
      },
      {
        heading: '2. Data Collected',
        body: `We collect the following personal data voluntarily provided by the user through the quote request form:\n\n• Full name\n• Email address\n• Phone number\n• Company name\n• Product code and request message\n\nWe also collect anonymous technical data during browsing (anonymized IP address, browser type, pages visited).`,
      },
      {
        heading: '3. Purpose and Legal Basis',
        body: `Personal data is processed for the following purposes:\n\n• Processing quote requests — legal basis: performance of pre-contractual measures (Art. 6(1)(b) GDPR)\n• Responding to user communications — legal basis: legitimate interest (Art. 6(1)(f) GDPR)\n• Service improvement and aggregate analysis — legal basis: legitimate interest (Art. 6(1)(f) GDPR)\n\nData is not used for direct marketing purposes without the user's explicit consent.`,
      },
      {
        heading: '4. Data Retention',
        body: `Personal data related to quote requests is retained for a maximum period of 24 months from the date of receipt, unless legal obligations require longer retention.\n\nAnonymous technical browsing data is retained for a maximum of 12 months.`,
      },
      {
        heading: '5. Third-Party Disclosure',
        body: `Personal data is not sold, transferred, or shared with third parties for marketing purposes.\n\nData may be disclosed to:\n\n• Technology service providers (hosting, database) necessary for site operation, acting as data processors\n• Competent authorities, if required by law`,
      },
      {
        heading: '6. User Rights',
        body: `Under Articles 15-22 of the GDPR, users have the right to:\n\n• Access their personal data\n• Rectify inaccurate or incomplete data\n• Request data erasure (right to be forgotten)\n• Restrict processing\n• Request data portability\n• Object to processing\n• Lodge a complaint with the Italian Data Protection Authority (Garante per la Protezione dei Dati Personali — www.garanteprivacy.it)\n\nTo exercise your rights, contact: info@nexfluid.it`,
      },
      {
        heading: '7. Security',
        body: `We implement appropriate technical and organizational measures to protect personal data from unauthorized access, loss, destruction, or alteration, in accordance with Art. 32 of the GDPR.`,
      },
      {
        heading: '8. Changes to This Policy',
        body: `We reserve the right to update this privacy policy. Any changes will be published on this page with the date of the last update.`,
      },
    ],
  },
};

const PrivacyPolicy = () => {
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

export default PrivacyPolicy;
