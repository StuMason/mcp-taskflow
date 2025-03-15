import { getSessions, getTasks, getFeatures, getApplications } from '../../lib/data-utils';
import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { taskId } = await searchParams;
  const sessions = await getSessions(taskId);
  const tasks = await getTasks();
  const features = await getFeatures();
  const applications = await getApplications();
  
  // Find the current task if filtering
  const currentTask = taskId 
    ? tasks.find(task => task.id === taskId) 
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
      title={currentTask ? `Sessions for ${currentTask.name}` : "Sessions"} 
      description="View and manage AI assistant sessions"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {currentTask ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/sessions" className="text-blue-600 hover:underline">
                All Sessions
              </Link>
              {currentApplication && currentFeature && (
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
                </>
              )}
              <span className="text-gray-500">›</span>
              <span>{currentTask.name}</span>
            </div>
          ) : (
            <h2 className="text-lg font-medium">All Sessions</h2>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!currentTask && (
            <div className="relative">
              <select 
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/sessions?taskId=${e.target.value}`;
                  } else {
                    window.location.href = '/sessions';
                  }
                }}
                defaultValue={taskId || ''}
              >
                <option value="">All Tasks</option>
                {tasks.map((task) => {
                  const feature = features.find(f => f.id === task.feature_id);
                  const app = feature ? applications.find(a => a.id === feature.application_id) : null;
                  return (
                    <option key={task.id} value={task.id}>
                      {app ? `${app.name} - ` : ''}{feature ? `${feature.name} - ` : ''}{task.name}
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
              {currentTask 
                ? `Sessions for ${currentTask.name}` 
                : 'All Sessions'}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {sessions.length} Total
            </span>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {currentTask 
                ? `No sessions found for ${currentTask.name}.`
                : 'No sessions found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  {!currentTask && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => {
                  const task = tasks.find(t => t.id === session.task_id);
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{session.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{session.task_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${session.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            session.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{new Date(session.start_time).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {session.end_time ? new Date(session.end_time).toLocaleString() : 'Ongoing'}
                        </div>
                      </td>
                      {!currentTask && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {task ? (
                              <Link 
                                href={`/sessions?taskId=${task.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {task.name}
                              </Link>
                            ) : 'Unknown'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link 
                          href={`/file-changes?sessionId=${session.id}`}
                          className="text-blue-600 hover:underline mr-4"
                        >
                          File Changes
                        </Link>
                        <Link 
                          href={`/checkpoints?sessionId=${session.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Checkpoints
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 