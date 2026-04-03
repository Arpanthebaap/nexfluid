import { MessageCircle } from 'lucide-react';

const WhatsAppFAB = () => {
  return (
    <a
      href="https://wa.me/393338933395"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppFAB;
