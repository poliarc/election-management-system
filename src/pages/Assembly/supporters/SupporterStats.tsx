import { useGetSupporterStatsQuery } from '../../../store/api/supportersApi';
import { useAppSelector } from '../../../store/hooks';

export default function SupporterStats() {
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  
  const filters = {
    party_id: user?.partyId || 0,
    state_id: user?.state_id || selectedAssignment?.stateMasterData_id || 0,
    assembly_id: selectedAssignment?.level_id || 0,
  };

  const { data: stats, isLoading, error } = useGetSupporterStatsQuery(filters, {
    skip: !filters.party_id || !filters.state_id || !filters.assembly_id,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load supporter statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Supporters',
      value: stats.overview.total_supporters,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Supporters',
      value: stats.overview.active_supporters,
      icon: '✅',
      color: 'bg-green-500',
    },
    {
      title: 'Inactive Supporters',
      value: stats.overview.inactive_supporters,
      icon: '❌',
      color: 'bg-red-500',
    },
    {
      title: 'With EPIC ID',
      value: stats.overview.supporters_with_epic,
      icon: '🆔',
      color: 'bg-purple-500',
    },
    {
      title: 'With WhatsApp',
      value: stats.overview.supporters_with_whatsapp,
      icon: '📱',
      color: 'bg-green-600',
    },
    {
      title: 'Today',
      value: stats.overview.today_supporters,
      icon: '📅',
      color: 'bg-indigo-500',
    },
    {
      title: 'This Week',
      value: stats.overview.week_supporters,
      icon: '📊',
      color: 'bg-orange-500',
    },
    {
      title: 'This Month',
      value: stats.overview.month_supporters,
      icon: '📈',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3 text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.top_contributors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {stats.top_contributors.slice(0, 5).map((contributor, index) => (
              <div key={contributor.created_by} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{contributor.contributor_name}</span>
                </div>
                <span className="text-sm text-gray-600">{contributor.supporter_count} supporters</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}