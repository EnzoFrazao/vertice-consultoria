export const WHATSAPP_NUMBER = "5500000000000";

export function createWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const LANDING_WHATSAPP_URL = createWhatsAppUrl(
  "Olá! Tenho interesse em regularização ou avaliação imobiliária."
);
