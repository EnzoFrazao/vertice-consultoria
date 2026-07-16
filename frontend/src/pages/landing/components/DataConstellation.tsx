export function DataConstellation() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-50 lg:block">
      <svg viewBox="0 0 640 760" className="h-full w-full" fill="none">
        <path d="M80 130L520 260L230 610L570 680" stroke="rgba(224,192,151,0.32)" />
        <path d="M250 80L150 360L510 510" stroke="rgba(15,118,110,0.34)" />
        {[88, 196, 318, 426].map((x, index) => (
          <circle key={x} cx={x} cy={152 + index * 120} r="4" fill="rgba(185,130,70,0.9)" />
        ))}
      </svg>
    </div>
  );
}
