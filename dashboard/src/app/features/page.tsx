import { getFeatures, getApplications } from '../../lib/data-utils';
import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { applicationId } = resolvedSearchParams;
  const features = await getFeatures(applicationId);
  const applications = await getApplications();
  
  // Find the current application if filtering
  const currentApplication = applicationId 
    ? applications.find(app => app.id === applicationId) 
    : null;

  return (
    <DashboardLayout 
      title={currentApplication ? `Features for ${currentApplication.name}` : "Features"} 
      description="View and manage features across applications"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {currentApplication ? (
            <div className="flex items-center gap-2">
              <Link href="/features" className="text-blue-600 hover:underline">
                All Features
              </Link>
              <span className="text-gray-500">›</span>
              <span>{currentApplication.name}</span>
            </div>
          ) : (
            <h2 className="text-lg font-medium">All Features</h2>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!currentApplication && (
            <div className="relative">
              <select 
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/features?applicationId=${e.target.value}`;
                  } else {
                    window.location.href = '/features';
                  }
                }}
                defaultValue={applicationId || ''}
              >
                <option value="">All Applications</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {currentApplication 
                ? `Features for ${currentApplication.name}` 
                : 'All Features'}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {features.length} Total
            </span>
          </div>
        </div>
        
        {features.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {currentApplication 
                ? `No features found for ${currentApplication.name}. Please create one using the TaskFlow tools.`
                : 'No features found. Please create one using the TaskFlow tools.'}
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
                  {!currentApplication && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {features.map((feature) => {
                  const app = applications.find(a => a.id === feature.application_id);
                  
                  return (
                    <tr key={feature.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{feature.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${feature.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            feature.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            feature.status === 'abandoned' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {feature.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{feature.priority}</div>
                      </td>
                      {!currentApplication && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {app ? (
                              <Link 
                                href={`/features?applicationId=${app.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {app.name}
                              </Link>
                            ) : 'Unknown'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link 
                          href={`/tasks?featureId=${feature.id}`}
                          className="text-blue-600 hover:underline mr-4"
                        >
                          View Tasks
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