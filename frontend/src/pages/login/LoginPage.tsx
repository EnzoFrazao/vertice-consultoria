import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import type {
  AuthenticatedUser,
  AuthErrorCode,
  AuthResult,
} from "@/features/auth/auth";

export type LoginPageProps = {
  pendingServiceName?: string;
  onLogin: (
    email: string,
    password: string,
  ) => Promise<AuthResult<AuthenticatedUser>>;
  onResetDemo: () => void;
};

function getLoginErrorMessage(error: AuthErrorCode): string {
  switch (error) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar.";
    case "profile_unavailable":
      return "Seu acesso ainda não está configurado. Entre em contato com o suporte.";
    case "network_error":
      return "Não foi possível conectar ao servidor. Tente novamente.";
    case "configuration_error":
      return "O acesso está temporariamente indisponível.";
    case "email_already_registered":
      return "Este e-mail já está cadastrado.";
    case "unexpected_error":
      return "Não foi possível entrar. Tente novamente.";
  }
}

const demoAccounts = [
  {
    role: "Cliente",
    email: "cliente@demo.com",
    password: "cliente123",
    description: "Acompanhe processos, documentos e pendências."
  },
  {
    role: "Administrador",
    email: "admin@demo.com",
    password: "admin123",
    description: "Analise solicitações e organize a fila de trabalho."
  }
] as const;

export function LoginPage({ pendingServiceName, onLogin, onResetDemo }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");

    if (isSubmitting) return;

    if (!email.trim() || !password) {
      setError("Preencha o e-mail e a senha para continuar.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await onLogin(email, password);

      if (!result.ok) {
        setError(getLoginErrorMessage(result.error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (account: (typeof demoAccounts)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setNotice(`Conta ${account.role.toLocaleLowerCase("pt-BR")} preenchida.`);
  };

  const resetDemo = () => {
    onResetDemo();
    setError("");
    setNotice("Demonstração reiniciada com os dados originais.");
  };

  return (
    <main className="min-h-screen bg-mist text-cacao lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#20130d_0%,#0d2926_100%)] p-12 text-ivory lg:flex lg:min-h-screen lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full border border-bronze/25" />
        <div className="absolute -right-6 top-44 h-96 w-96 rounded-full border border-tealTech/25" />
        <div className="absolute bottom-12 left-12 h-48 w-48 rounded-full bg-bronze/10 blur-3xl" />
        <Link
          to="/"
          className="relative z-10 inline-flex w-fit rounded-lg bg-ivory/95 px-3 py-2 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-bronze"
        >
          <img
            src="/brand/vertice-consultoria.png"
            alt="Vértice Consultoria"
            className="h-20 w-auto object-contain"
          />
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-bronze">
            Ambiente demonstrativo
          </p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[1.05] xl:text-6xl">
            Acompanhe cada decisão sem perder o contexto.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-champagne/[0.76]">
            Um protótipo completo para visualizar solicitações, documentos, pendências e andamento
            do atendimento imobiliário.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-champagne/70">
          <ShieldCheck className="h-5 w-5 text-bronze" aria-hidden="true" />
          Os dados e documentos exibidos são inteiramente fictícios.
        </div>
      </section>

      <section className="flex min-h-screen items-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <Link
              to="/"
              className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-bronze"
            >
              <img
                src="/brand/vertice-consultoria.png"
                alt="Vértice Consultoria"
                className="h-14 w-auto object-contain sm:h-16"
              />
            </Link>
            <span className="rounded-full border border-tealTech/20 bg-white px-3 py-1.5 text-xs font-semibold uppercase text-tealTech">
              Demo
            </span>
          </div>

          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cacao/70 outline-none transition-colors hover:text-espresso focus-visible:ring-2 focus-visible:ring-bronze"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para o site
          </Link>

          <div className="mt-7">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-tealTech">
              Portal de acompanhamento
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-espresso sm:text-5xl">
              Acesse sua jornada
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-cacao/[0.72]">
              Entre com uma conta demonstrativa para conhecer a experiência do cliente ou a rotina
              administrativa.
            </p>
          </div>

          {pendingServiceName ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-bronze/30 bg-champagne/[0.55] p-4">
              <LockKeyhole className="mt-0.5 h-5 w-5 flex-none text-bronze" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-espresso">Serviço selecionado</p>
                <p className="mt-1 text-sm text-cacao/[0.72]">
                  {pendingServiceName} será mantido ao entrar como cliente.
                </p>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mt-7 rounded-2xl border border-cacao/25 bg-white p-5 shadow-glass sm:p-7"
          >
            <div>
              <label htmlFor="login-email" className="text-sm font-semibold text-espresso">
                E-mail
              </label>
              <div className="relative mt-2">
                <UserRound
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/[0.45]"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-cacao/55 bg-ivory/[0.45] py-3 pl-12 pr-4 text-base text-espresso outline-none transition-colors focus:border-bronze focus:ring-2 focus:ring-bronze/25"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="login-password" className="text-sm font-semibold text-espresso">
                Senha
              </label>
              <div className="relative mt-2">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/[0.45]"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-cacao/55 bg-ivory/[0.45] py-3 pl-12 pr-12 text-base text-espresso outline-none transition-colors focus:border-bronze focus:ring-2 focus:ring-bronze/25"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-cacao/60 outline-none hover:text-espresso focus-visible:ring-2 focus-visible:ring-bronze"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {error}
              </p>
            ) : null}
            {notice ? (
              <p
                role="status"
                className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm font-medium text-teal-900"
              >
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-espresso px-6 font-semibold text-ivory shadow-glow outline-none transition-colors duration-200 hover:bg-cacao focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                "Entrando..."
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm font-semibold text-espresso">Preencher uma conta demo</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  aria-label={`Usar conta ${account.role}`}
                  className="min-h-28 cursor-pointer rounded-xl border border-cacao/25 bg-white p-4 text-left outline-none transition-colors duration-200 hover:border-bronze/60 hover:bg-champagne/[0.35] focus-visible:ring-2 focus-visible:ring-bronze"
                >
                  <span className="block text-sm font-semibold text-espresso">{account.role}</span>
                  <span className="mt-1 block text-sm text-tealTech">{account.email}</span>
                  <span className="mt-2 block text-xs leading-5 text-cacao/75">
                    {account.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={resetDemo}
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-cacao/[0.65] outline-none transition-colors hover:text-espresso focus-visible:ring-2 focus-visible:ring-bronze"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reiniciar demonstração
          </button>
        </div>
      </section>
    </main>
  );
}
