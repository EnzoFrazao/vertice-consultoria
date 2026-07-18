import { LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { usePortalData } from "@/features/portal-data/PortalDataProvider";
import { PageHeader } from "@/shared/ui/portal";

const fieldClass =
  "min-h-12 w-full rounded-xl border border-espresso/20 bg-white px-3.5 py-2.5 text-base text-espresso outline-none transition-colors focus:border-tealTech focus:ring-2 focus:ring-tealTech/20 disabled:cursor-not-allowed disabled:bg-espresso/5 disabled:text-cacao/60";
const labelClass = "mb-2 block text-sm font-semibold text-espresso";

export function ClientProfilePage() {
  const { currentUser, updateUserProfile } = usePortalData();
  const [phone, setPhone] = useState(() => currentUser?.phone ?? "");
  const [address, setAddress] = useState(() => currentUser?.address ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => setSaved(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  if (!currentUser) return null;
  const currentUserId = currentUser.id;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUserProfile(currentUserId, { phone: phone.trim(), address: address.trim() });
    setSaved(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sua conta"
        title="Perfil"
        description="Mantenha seus dados de contato atualizados para facilitar as orientações sobre cada processo."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-espresso/10 bg-ivory p-5 shadow-[0_16px_48px_rgba(32,19,13,0.06)] sm:p-7"
        >
          <div className="flex items-center gap-4 border-b border-espresso/10 pb-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tealTech/10 text-tealTech">
              <UserRound aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-espresso">Dados pessoais</h2>
              <p className="mt-1 text-sm text-cacao/60">
                Conta demonstrativa de {currentUser.name}.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Nome completo
              </label>
              <input id="profile-name" value={currentUser.name} disabled className={fieldClass} />
            </div>
            <div>
              <label htmlFor="profile-email" className={labelClass}>
                E-mail
              </label>
              <input id="profile-email" value={currentUser.email} disabled className={fieldClass} />
            </div>
            <div>
              <label htmlFor="profile-cpf" className={labelClass}>
                CPF
              </label>
              <input id="profile-cpf" value={currentUser.cpf} disabled className={fieldClass} />
            </div>
            <div>
              <label htmlFor="profile-phone" className={labelClass}>
                Telefone
              </label>
              <input
                id="profile-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="profile-address" className={labelClass}>
                Endereço
              </label>
              <input
                id="profile-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-espresso/10 pt-6">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-bronze px-5 py-3 text-sm font-bold text-espresso transition-colors hover:bg-[#c99050] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealTech focus-visible:ring-offset-2"
            >
              <Save aria-hidden="true" className="h-4 w-4" /> Salvar alterações
            </button>
            {saved ? (
              <p
                role="status"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-tealTech"
              >
                <ShieldCheck aria-hidden="true" className="h-5 w-5" /> Perfil atualizado com
                sucesso.
              </p>
            ) : null}
          </div>
        </form>

        <aside className="h-fit rounded-3xl bg-espresso p-6 text-ivory shadow-glass">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-bronze">
            <LockKeyhole aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">Dados protegidos</h2>
          <p className="mt-2 text-sm leading-6 text-ivory/60">
            E-mail e CPF identificam a conta demo. A edição desses campos dependerá de validação
            segura quando houver backend.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-ivory/50">
            Nenhuma alteração feita aqui é enviada para sistemas externos.
          </div>
        </aside>
      </div>
    </div>
  );
}
