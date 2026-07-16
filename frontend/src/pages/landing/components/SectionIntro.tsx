type SectionIntroProps = {
  eyebrow: string;
  title: string;
  text: string;
  light?: boolean;
};

export function SectionIntro({ eyebrow, title, text, light = false }: SectionIntroProps) {
  return (
    <div className="max-w-3xl">
      <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${light ? "text-bronze" : "text-tealTech"}`}>{eyebrow}</p>
      <h2 className={`mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl ${light ? "text-ivory" : "text-espresso"}`}>{title}</h2>
      <p className={`mt-5 max-w-2xl text-lg leading-8 ${light ? "text-champagne/75" : "text-cacao/75"}`}>{text}</p>
    </div>
  );
}
