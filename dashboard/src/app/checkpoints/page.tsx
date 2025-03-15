import { getCheckpoints, getSessions, getTasks, getFeatures, getApplications } from '../../lib/data-utils';
import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

export default async function CheckpointsPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { sessionId } = resolvedSearchParams;
  const checkpoints = await getCheckpoints(sessionId);
  const sessions = await getSessions();
  const tasks = await getTasks();
  const features = await getFeatures();
  const applications = await getApplications();
  
  // Find the current session if filtering
  const currentSession = sessionId 
    ? sessions.find(session => session.id === sessionId) 
    : null;
    
  // Find the task for the current session
  const currentTask = currentSession && currentSession.task_id
    ? tasks.find(task => task.id === currentSession.task_id) 
    : null;
    
  // Find the feature for the current task
  const currentFeature = currentTask 
    ? features.find(feature => feature.id === currentTask.feature_id) 
    : null;
    
  // Find the application for the current feature
  const currentApplication = currentFeature 
    ? applications.find(app => app.id === currentFeature.application_id) 
    : null;

  return (
    <DashboardLayout 
      title={currentSession ? `Checkpoints for Session ${currentSession.id}` : "Checkpoints"} 
      description="View progress checkpoints across sessions"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {currentSession ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/checkpoints" className="text-blue-600 hover:underline">
                All Checkpoints
              </Link>
              {currentApplication && currentFeature && currentTask && (
                <>
                  <span className="text-gray-500">›</span>
                  <Link 
                    href={`/features?applicationId=${currentApplication.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {currentApplication.name}
                  </Link>
                  <span className="text-gray-500">›</span>
                  <Link 
                    href={`/tasks?featureId=${currentFeature.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {currentFeature.name}
                  </Link>
                  <span className="text-gray-500">›</span>
                  <Link 
                    href={`/sessions?taskId=${currentTask.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {currentTask.name}
                  </Link>
                </>
              )}
              <span className="text-gray-500">›</span>
              <span>Session {currentSession.id}</span>
            </div>
          ) : (
            <h2 className="text-lg font-medium">All Checkpoints</h2>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!currentSession && (
            <div className="relative">
              <select 
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/checkpoints?sessionId=${e.target.value}`;
                  } else {
                    window.location.href = '/checkpoints';
                  }
                }}
                defaultValue={sessionId || ''}
              >
                <option value="">All Sessions</option>
                {sessions.map((session) => {
                  const task = session.task_id ? tasks.find(t => t.id === session.task_id) : null;
                  return (
                    <option key={session.id} value={session.id}>
                      {task ? `${task.name} - ` : ''}Session {session.id}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {currentSession 
                ? `Checkpoints for Session ${currentSession.id}` 
                : 'All Checkpoints'}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {checkpoints.length} Total
            </span>
          </div>
        </div>
        
        {checkpoints.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {currentSession 
                ? `No checkpoints found for Session ${currentSession.id}.`
                : 'No checkpoints found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {checkpoints.map((checkpoint) => {
              const session = sessions.find(s => s.id === checkpoint.session_id);
              const task = session && session.task_id 
                ? tasks.find(t => t.id === session.task_id) 
                : null;
              
              return (
                <div key={checkpoint.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        Checkpoint at {new Date(checkpoint.timestamp).toLocaleString()}
                      </h3>
                      {!currentSession && session && (
                        <p className="text-sm text-gray-500 mt-1">
                          <Link 
                            href={`/checkpoints?sessionId=${session.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Session {session.id}
                          </Link>
                          {task && (
                            <span> - {task.name}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Progress</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{checkpoint.progress}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Changes Description</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{checkpoint.changes_description}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Current Thinking</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{checkpoint.current_thinking}</p>
                  </div>
                  
                  {checkpoint.next_steps && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Next Steps</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{checkpoint.next_steps}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 