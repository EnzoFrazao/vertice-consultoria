import { HowItWorks } from "@/pages/landing/components/HowItWorks";
import { ServiceChoice } from "@/pages/landing/components/ServiceChoice";
import { SiteFooter } from "@/pages/landing/components/SiteFooter";
import { WhatsAppButton } from "@/pages/landing/components/WhatsAppButton";
import { WhatWeDo } from "@/pages/landing/components/WhatWeDo";
import { ZoomParallaxIntro } from "@/pages/landing/components/ZoomParallaxIntro";

export type LandingPageProps = {
  onStartService?: (serviceId: string) => void;
};

function LandingPage({ onStartService }: LandingPageProps) {
  const handleServiceSelect = (serviceId: string) => {
    onStartService?.(serviceId);
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-ivory text-cacao">
      <ZoomParallaxIntro />
      <WhatWeDo />
      <ServiceChoice onSelectService={handleServiceSelect} />
      <HowItWorks />
      <SiteFooter />
      <WhatsAppButton />
    </main>
  );
}

export default LandingPage;
