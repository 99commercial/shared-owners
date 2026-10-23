import HeroSection from '../../sections/home/HeroSection';
import StatsBar from '../../sections/home/StatsBar';
import PropertiesScroll from '../../sections/home/PropertiesScroll';
import DevelopmentsScroll from '../../sections/home/DevelopmentsScroll';
import CompaniesScroll from '../../sections/home/CompaniesScroll';
import HowItWorks from '../../sections/home/HowItWorks';
import CtaSection from '../../sections/home/CtaSection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <StatsBar />
      <PropertiesScroll />
      <DevelopmentsScroll />
      <CompaniesScroll />
      <HowItWorks />
      <CtaSection />
    </div>
  );
}
