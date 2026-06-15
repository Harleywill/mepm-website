import {
  Hero3D,
  StandardsMarquee,
  ServicesOverview,
  StatStrip,
  ProcessTimeline,
  LatestProjects,
  CtaBand,
} from './components/sections';

export default function Home() {
  return (
    <>
      <Hero3D />
      <StandardsMarquee />
      <ServicesOverview />
      <StatStrip />
      <ProcessTimeline />
      <LatestProjects />
      <CtaBand />
    </>
  );
}
