import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <a
        href="#top"
        aria-label="Vértice Consultoria"
        className="inline-flex rounded-lg bg-ivory/95 px-2.5 py-1.5 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-bronze"
      >
        <img
          src="/brand/vertice-consultoria.png"
          alt="Vértice Consultoria"
          className="h-14 w-auto object-contain sm:h-16"
        />
      </a>
      <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
        <a className="nav-link" href="#servicos">Serviços</a>
        <a className="nav-link" href="#seguranca">Como funciona</a>
        <a className="nav-link" href="#contato">Contato</a>
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-ivory outline-none backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-bronze sm:px-5"
        >
          Acessar minha conta
        </Link>
        <a href="#servicos" className="glass-button hidden lg:inline-flex">Escolher serviço</a>
      </div>
    </header>
  );
}
