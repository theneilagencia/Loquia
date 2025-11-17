import Hero from "./components/Hero";
import Era from "./components/Era";
import SeoEnded from "./components/SeoEnded";
import IntentionEra from "./components/IntentionEra";
import HowItWorks from "./components/HowItWorks";
import DashboardPreview from "./components/DashboardPreview";
import Plans from "./components/Plans";

export default function Home() {
  return (
    <main>
      <Hero />
      <Era />
      <SeoEnded />
      <IntentionEra />
      <HowItWorks />
      <DashboardPreview />
      <Plans />
    </main>
  );
}
