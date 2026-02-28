import { useGetSupporterStatsQuery } from '../../../store/api/supportersApi';
import { useAppSelector } from '../../../store/hooks';

export default function SupporterStats() {
  const { user } = useAppSelector((s) => s.auth);

  // Get user ID from localStorage if not available in Redux state
  const getUserId = () => {
    if (user?.id) return user.id;

    // Fallback to localStorage
    const authData = localStorage.getItem('auth_user');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        return parsedAuth.id || 1;
      } catch (e) {
        console.error('Failed to parse auth data from localStorage:', e);
      }
    }

    // Try alternative localStorage keys
    const altAuthData = localStorage.getItem('user') || localStorage.getItem('authUser');
    if (altAuthData) {
      try {
        const parsedAuth = JSON.parse(altAuthData);
        return parsedAuth.id || parsedAuth.user_id || 1;
      } catch (e) {
        console.error('Failed to parse alternative auth data:', e);
      }
    }

    return 1;
  };

  const currentUserId = getUserId();

  // Use the proper stats API endpoint that returns aggregated stats
  const { data: statsResponse, isLoading, error } = useGetSupporterStatsQuery(
    {
      created_by: currentUserId,
    },
    {
      skip: !currentUserId,
    }
  );

  // Extract stats from the API response
  const stats = statsResponse?.overview || {
    total_supporters: 0,
    active_supporters: 0,
    inactive_supporters: 0,
    supporters_with_epic: 0,
    supporters_with_whatsapp: 0,
    today_supporters: 0,
    week_supporters: 0,
    month_supporters: 0,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load supporter statistics</p>
        <p className="text-sm text-gray-600 mt-1">
          {error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'Unable to fetch supporter data. Please try refreshing the page.'}
        </p>
      </div>
    );
  }

  // If no error and no loading, but also no data, show empty stats
  if (!isLoading && !error && !statsResponse) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            ℹ️ No supporter data found. Start by adding some supporters.
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Supporters</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="bg-blue-500 rounded-full p-3 text-white text-xl">
                👥
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Today',
      value: stats.today_supporters,
      icon: '📅',
      color: 'bg-indigo-500',
    },
    {
      title: 'This Week',
      value: stats.week_supporters,
      icon: '📊',
      color: 'bg-orange-500',
    },
    {
      title: 'This Month',
      value: stats.month_supporters,
      icon: '📈',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* All Stats Cards in One Row - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Supporters Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Supporters</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_supporters.toLocaleString()}</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-xl">
              👥
            </div>
          </div>
        </div>

        {/* Time-based Stats Cards */}
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
    </div>
  );
}