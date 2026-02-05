import { useGetSupportersByCreatedByQuery } from '../../../store/api/supportersApi';
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

  // Use the same query as the listing to get supporters data
  const { data: supportersData, isLoading, error } = useGetSupportersByCreatedByQuery(
    {
      createdBy: currentUserId,
      page: 1,
      limit: 100, // API maximum limit is 100
    },
    {
      skip: !currentUserId,
    }
  );

  console.log('SupportersData for stats:', supportersData);
  console.log('Stats loading state:', isLoading);
  console.log('Stats error:', error);
  console.log('Current user ID:', currentUserId);
  console.log('Skip query?', !currentUserId);
  console.log('Auth user from Redux:', user);
  console.log('localStorage auth_user:', localStorage.getItem('auth_user'));

  // Calculate stats from the supporters data
  const calculateStats = () => {
    if (!supportersData?.data || !Array.isArray(supportersData.data)) {
      return {
        total_supporters: 0,
        active_supporters: 0,
        inactive_supporters: 0,
        supporters_with_epic: 0,
        supporters_with_whatsapp: 0,
        today_supporters: 0,
        week_supporters: 0,
        month_supporters: 0,
      };
    }

    const supporters = supportersData.data;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total_supporters: supporters.length,
      active_supporters: supporters.filter(s => s.isActive).length,
      inactive_supporters: supporters.filter(s => !s.isActive).length,
      supporters_with_epic: supporters.filter(s => s.voter_epic_id && s.voter_epic_id.trim()).length,
      supporters_with_whatsapp: supporters.filter(s => s.whatsapp_no && s.whatsapp_no.trim()).length,
      today_supporters: supporters.filter(s => {
        try {
          const createdDate = new Date(s.created_at);
          return createdDate.toDateString() === today.toDateString();
        } catch (e) {
          return false;
        }
      }).length,
      week_supporters: supporters.filter(s => {
        try {
          const createdDate = new Date(s.created_at);
          return createdDate >= weekAgo;
        } catch (e) {
          return false;
        }
      }).length,
      month_supporters: supporters.filter(s => {
        try {
          const createdDate = new Date(s.created_at);
          return createdDate >= monthAgo;
        } catch (e) {
          return false;
        }
      }).length,
    };
  };

  const stats = calculateStats();

  // Add debug info to see what's happening
  console.log('Final stats calculated:', stats);
  console.log('Has supporters data:', !!supportersData?.data);
  console.log('Supporters count:', supportersData?.data?.length || 0);

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
    console.error('Stats API Error:', error);

    // If we have some data despite the error, show stats with a warning
    if (supportersData?.data) {
      const stats = calculateStats();
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ Stats loaded with warnings. Some data may be incomplete.
            </p>
          </div>
          {/* Show stats normally */}
          <div className="space-y-6">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
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
            </div>
          </div>
        </div>
      );
    }

    // Only show error if we have no data at all
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

  // If no error and no loading, but also no data, show empty stats instead of error
  if (!isLoading && !error && (!supportersData || !supportersData.data)) {
    console.log('No data available, showing empty stats');
    const emptyStats = calculateStats(); // This will return zeros

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
                <p className="text-3xl font-bold text-gray-900">{emptyStats.total_supporters.toLocaleString()}</p>
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
      {/* Show pagination info if there are more supporters */}
      {supportersData?.pagination && supportersData.pagination.total > 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            ℹ️ Showing stats for first 100 supporters out of {supportersData.pagination.total.toLocaleString()} total.
          </p>
        </div>
      )}

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