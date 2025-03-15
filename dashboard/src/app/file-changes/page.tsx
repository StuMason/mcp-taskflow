import { getFileChanges, getSessions, getTasks, getFeatures, getApplications } from '../../lib/data-utils';
import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

export default async function FileChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  const fileChanges = await getFileChanges(sessionId);
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

  // Group file changes by file path
  const fileChangesByPath = fileChanges.reduce((acc, change) => {
    if (!acc[change.file_path]) {
      acc[change.file_path] = [];
    }
    acc[change.file_path].push(change);
    return acc;
  }, {} as Record<string, typeof fileChanges>);

  return (
    <DashboardLayout 
      title={currentSession ? `File Changes for Session ${currentSession.id}` : "File Changes"} 
      description="View file changes across sessions"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {currentSession ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/file-changes" className="text-blue-600 hover:underline">
                All File Changes
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
            <h2 className="text-lg font-medium">All File Changes</h2>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!currentSession && (
            <div className="relative">
              <select 
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/file-changes?sessionId=${e.target.value}`;
                  } else {
                    window.location.href = '/file-changes';
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
                ? `File Changes for Session ${currentSession.id}` 
                : 'All File Changes'}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {fileChanges.length} Total
            </span>
          </div>
        </div>
        
        {fileChanges.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {currentSession 
                ? `No file changes found for Session ${currentSession.id}.`
                : 'No file changes found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(fileChangesByPath).map(([filePath, changes]) => (
              <div key={filePath} className="p-6">
                <h3 className="text-lg font-medium mb-4">{filePath}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Change Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        {!currentSession && (
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Session
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {changes.map((change) => {
                        const session = sessions.find(s => s.id === change.session_id);
                        
                        return (
                          <tr key={change.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${change.change_type === 'created' ? 'bg-green-100 text-green-800' : 
                                  change.change_type === 'modified' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-red-100 text-red-800'}`}
                              >
                                {change.change_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(change.timestamp).toLocaleString()}</div>
                            </td>
                            {!currentSession && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {session ? (
                                    <Link 
                                      href={`/file-changes?sessionId=${session.id}`}
                                      className="text-blue-600 hover:underline"
                                    >
                                      Session {session.id}
                                    </Link>
                                  ) : 'Unknown'}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 