import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { LANDING_WHATSAPP_URL } from "@/shared/config/contact";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer id="contato" className="bg-espresso px-5 py-12 text-ivory sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-9 border-b border-white/10 pb-9 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <a href="#top" aria-label="Vértice Consultoria" className="inline-flex rounded-lg bg-ivory/95 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze">
              <img src="/brand/vertice-consultoria.png" alt="Vértice Consultoria" className="h-16 w-auto object-contain" />
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6 text-champagne/70">Clareza para regularizar, avaliar e decidir sobre seu imóvel.</p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
            <a className="footer-link" href="#servicos">Serviços</a>
            <Link className="footer-link" to="/login">Acessar minha conta</Link>
            <a className="footer-link" href="#seguranca">Como funciona</a>
          </nav>
          <a href={LANDING_WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full border border-bronze/50 px-5 font-semibold text-champagne transition-colors hover:border-bronze hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze">
            <MessageCircle className="h-5 w-5 text-bronze" aria-hidden="true" />
            Falar pelo WhatsApp
          </a>
        </div>
        <p className="pt-6 text-sm text-champagne/70">© {currentYear} Vértice Consultoria. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
