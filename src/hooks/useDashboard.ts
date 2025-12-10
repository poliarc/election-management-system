import { useState, useEffect } from 'react';
import { fetchDashboardLevel, type DashboardCard, type LevelInfo, type DashboardLevelParams } from '../services/dashboardApi';

interface UseDashboardResult {
    cards: DashboardCard[];
    levelInfo: LevelInfo | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useDashboard = (params: DashboardLevelParams): UseDashboardResult => {
    const [cards, setCards] = useState<DashboardCard[]>([]);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!params.state_id || !params.party_id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetchDashboardLevel(params);

            if (response.success) {
                // Show all cards from API response - dynamic based on what API returns
                setCards(response.data.cards);
                setLevelInfo(response.data.levelInfo);
            } else {
                setError(response.message || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.state_id, params.party_id, params.level_id, params.level_type]);

    return {
        cards,
        levelInfo,
        loading,
        error,
        refetch: fetchData,
    };
};