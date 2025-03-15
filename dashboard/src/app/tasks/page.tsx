import { getTasks, getFeatures, getApplications } from '../../lib/data-utils';
import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ featureId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { featureId } = resolvedSearchParams;
  const tasks = await getTasks(featureId);
  const features = await getFeatures();
  const applications = await getApplications();
  
  // Find the current feature if filtering
  const currentFeature = featureId 
    ? features.find(feature => feature.id === featureId) 
    : null;
    
  // Find the application for the current feature
  const currentApplication = currentFeature 
    ? applications.find(app => app.id === currentFeature.application_id) 
    : null;

  return (
    <DashboardLayout 
      title={currentFeature ? `Tasks for ${currentFeature.name}` : "Tasks"} 
      description="View and manage tasks across features"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {currentFeature ? (
            <div className="flex items-center gap-2">
              <Link href="/tasks" className="text-blue-600 hover:underline">
                All Tasks
              </Link>
              {currentApplication && (
                <>
                  <span className="text-gray-500">›</span>
                  <Link 
                    href={`/features?applicationId=${currentApplication.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {currentApplication.name}
                  </Link>
                </>
              )}
              <span className="text-gray-500">›</span>
              <span>{currentFeature.name}</span>
            </div>
          ) : (
            <h2 className="text-lg font-medium">All Tasks</h2>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!currentFeature && (
            <div className="relative">
              <select 
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/tasks?featureId=${e.target.value}`;
                  } else {
                    window.location.href = '/tasks';
                  }
                }}
                defaultValue={featureId || ''}
              >
                <option value="">All Features</option>
                {features.map((feature) => {
                  const app = applications.find(a => a.id === feature.application_id);
                  return (
                    <option key={feature.id} value={feature.id}>
                      {app ? `${app.name} - ` : ''}{feature.name}
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
              {currentFeature 
                ? `Tasks for ${currentFeature.name}` 
                : 'All Tasks'}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {tasks.length} Total
            </span>
          </div>
        </div>
        
        {tasks.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {currentFeature 
                ? `No tasks found for ${currentFeature.name}. Please create one using the TaskFlow tools.`
                : 'No tasks found. Please create one using the TaskFlow tools.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  {!currentFeature && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => {
                  const feature = features.find(f => f.id === task.feature_id);
                  
                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{task.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            task.status === 'review' ? 'bg-purple-100 text-purple-800' : 
                            task.status === 'ready' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{task.priority}</div>
                      </td>
                      {!currentFeature && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {feature ? (
                              <Link 
                                href={`/tasks?featureId=${feature.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {feature.name}
                              </Link>
                            ) : 'Unknown'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link 
                          href={`/sessions?taskId=${task.id}`}
                          className="text-blue-600 hover:underline mr-4"
                        >
                          View Sessions
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