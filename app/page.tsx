import {
  Hero3D,
  StandardsMarquee,
  ServicesOverview,
  StatStrip,
  ProcessTimeline,
  LatestProjects,
  CtaBand,
} from './components/sections';
import { getSettings } from '@/lib/settings';

export default async function Home() {
  const { stats, qualifications } = await getSettings();
  return (
    <>
      <Hero3D />
      <StandardsMarquee />
      <ServicesOverview />
      <StatStrip stats={stats} qualifications={qualifications} />
      <ProcessTimeline />
      <LatestProjects />
      <CtaBand />
    </>
  );
}
