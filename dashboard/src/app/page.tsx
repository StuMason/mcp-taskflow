import { getApplications, getFeatures, getTasks, getSessions, getFileChanges, getCheckpoints, getSnapshots, getDecisions } from '../lib/data-utils';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import AllInOneDashboard from '../components/AllInOneDashboard';

export default async function Home() {
  // Fetch all data for the dashboard
  const applications = await getApplications();
  const features = await getFeatures();
  const tasks = await getTasks();
  const sessions = await getSessions();
  const fileChanges = await getFileChanges();
  const checkpoints = await getCheckpoints();
  const snapshots = await getSnapshots();
  const decisions = await getDecisions();

  return (
    <DashboardLayout 
      title="TaskFlow Dashboard" 
      description="Comprehensive overview of your development progress"
      darkMode={true}
    >
      <AllInOneDashboard 
        applications={applications}
        features={features}
        tasks={tasks}
        sessions={sessions}
        fileChanges={fileChanges}
        checkpoints={checkpoints}
        snapshots={snapshots}
        decisions={decisions}
      />
    </DashboardLayout>
  );
}
