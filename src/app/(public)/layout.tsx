import PublicHeader from "../components/ui/PublicHeader";
import Footer from "../components/ui/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
      <Footer />
    </>
  );
}
