import CustomNavbar from "./components/CustomNavbar";
import CustomHero from "./components/CustomHero";
import CustomEra from "./components/CustomEra";
import CustomHowItWorks from "./components/CustomHowItWorks";
import CustomPaidAds from "./components/CustomPaidAds";
import CustomPlans from "./components/CustomPlans";
import CustomFinal from "./components/CustomFinal";
import CustomFooter from "./components/CustomFooter";

export default function Home() {
  return (
    <>
      <CustomNavbar />
      <main>
        <CustomHero />
        <CustomEra />
        <CustomHowItWorks />
        <CustomPaidAds />
        <CustomPlans />
        <CustomFinal />
      </main>
      <CustomFooter />
    </>
  );
}
