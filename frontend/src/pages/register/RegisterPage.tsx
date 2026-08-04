import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import type {
  AuthErrorCode,
  AuthResult,
  AuthenticatedUser,
  SignUpInput
} from "@/features/auth/auth";

export interface RegisterPageProps {
  pendingServiceName?: string;
  onSignUp: (input: SignUpInput) => Promise<AuthResult<AuthenticatedUser | null>>;
}

function getSignUpErrorMessage(error: AuthErrorCode): string {
  switch (error) {
    case "email_already_registered":
      return "Este e-mail já está cadastrado.";
    case "weak_password":
      return "A senha informada não atende aos requisitos de segurança.";
    case "network_error":
      return "Não foi possível conectar ao servidor. Tente novamente.";
    case "configuration_error":
      return "O cadastro está temporariamente indisponível.";
    default:
      return "Não foi possível criar sua conta. Tente novamente.";
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterPage({ pendingServiceName, onSignUp }: RegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setNotice("");

    if (!normalizedName || !normalizedEmail || !password || !passwordConfirmation) {
      setError("Preencha todos os campos para continuar.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSignUp({
        name: normalizedName,
        email: normalizedEmail,
        password
      });

      if (!result.ok) {
        setError(getSignUpErrorMessage(result.error));
      } else if (!result.data) {
        setNotice("Cadastro realizado. Verifique seu e-mail para confirmar a conta.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "min-h-12 w-full rounded-xl border border-cacao/55 bg-ivory/[0.45] py-3 pl-12 pr-4 text-base text-espresso outline-none transition-colors focus:border-bronze focus:ring-2 focus:ring-bronze/25";

  return (
    <main className="min-h-screen bg-mist text-cacao lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#20130d_0%,#0d2926_100%)] p-12 text-ivory lg:flex lg:min-h-screen lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full border border-bronze/25" />
        <div className="absolute -right-6 top-44 h-96 w-96 rounded-full border border-tealTech/25" />
        <Link
          to="/"
          className="relative z-10 inline-flex w-fit rounded-lg bg-ivory/95 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-bronze"
        >
          <img
            src="/brand/vertice-consultoria.png"
            alt="Vértice Consultoria"
            className="h-20 w-auto object-contain"
          />
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-bronze">
            Portal do cliente
          </p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[1.05] xl:text-6xl">
            Seu imóvel, seus documentos e cada decisão no mesmo lugar.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-champagne/[0.76]">
            Crie seu acesso para iniciar solicitações e acompanhar o trabalho da consultoria.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-champagne/70">
          <ShieldCheck className="h-5 w-5 text-bronze" aria-hidden="true" />
          Seu cadastro público sempre recebe acesso de cliente.
        </div>
      </section>

      <section className="flex min-h-screen items-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 lg:hidden">
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
          </div>

          <Link
            to="/login"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cacao/70 outline-none hover:text-espresso focus-visible:ring-2 focus-visible:ring-bronze"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Já tenho uma conta
          </Link>

          <div className="mt-7">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-tealTech">
              Cadastro de cliente
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-espresso sm:text-5xl">
              Crie sua conta
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-cacao/[0.72]">
              Informe seus dados para acessar o portal e acompanhar suas solicitações.
            </p>
          </div>

          {pendingServiceName ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-bronze/30 bg-champagne/[0.55] p-4">
              <LockKeyhole className="mt-0.5 h-5 w-5 flex-none text-bronze" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-espresso">Serviço selecionado</p>
                <p className="mt-1 text-sm text-cacao/[0.72]">
                  {pendingServiceName} será mantido após o cadastro.
                </p>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-7 rounded-2xl border border-cacao/25 bg-white p-5 shadow-glass sm:p-7"
          >
            <label htmlFor="register-name" className="text-sm font-semibold text-espresso">
              Nome completo
            </label>
            <div className="relative mt-2">
              <UserRound
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/[0.45]"
                aria-hidden="true"
              />
              <input
                id="register-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClassName}
                placeholder="Seu nome completo"
              />
            </div>

            <label
              htmlFor="register-email"
              className="mt-5 block text-sm font-semibold text-espresso"
            >
              E-mail
            </label>
            <div className="relative mt-2">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/[0.45]"
                aria-hidden="true"
              />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                placeholder="voce@exemplo.com"
              />
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="register-password" className="text-sm font-semibold text-espresso">
                  Senha
                </label>
                <div className="relative mt-2">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/[0.45]"
                    aria-hidden="true"
                  />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClassName} pr-12`}
                    placeholder="Mínimo de 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"}
                    className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-cacao/60 outline-none focus-visible:ring-2 focus-visible:ring-bronze"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="register-confirmation"
                  className="text-sm font-semibold text-espresso"
                >
                  Confirmar senha
                </label>
                <div className="relative mt-2">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cacao/[0.45]"
                    aria-hidden="true"
                  />
                  <input
                    id="register-confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    className={inputClassName}
                    placeholder="Repita sua senha"
                  />
                </div>
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm text-teal-900">
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-espresso px-6 font-semibold text-ivory shadow-glow outline-none hover:bg-cacao focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 disabled:cursor-wait"
            >
              {isSubmitting ? (
                "Criando conta..."
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
