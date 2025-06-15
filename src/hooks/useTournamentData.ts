
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tournament {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface TournamentScore {
  id: string;
  tournament_id: string;
  player_name: string;
  current_score: number;
  position: number;
  previous_position: number | null;
  rounds_played: number;
  country?: string;
  isTied?: boolean;
}

export const useTournamentData = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const calculateTies = (players: TournamentScore[]): TournamentScore[] => {
    // Sort by current score (lower is better in golf)
    const sortedPlayers = [...players].sort((a, b) => a.current_score - b.current_score);
    
    const playersWithTies: TournamentScore[] = [];
    let currentPosition = 1;
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      
      // Check if this player is tied with the previous player
      const prevPlayer = sortedPlayers[i - 1];
      const nextPlayer = sortedPlayers[i + 1];
      
      const isTiedWithPrev = prevPlayer && prevPlayer.current_score === player.current_score;
      const isTiedWithNext = nextPlayer && nextPlayer.current_score === player.current_score;
      
      // If not tied with previous player, update position
      if (!isTiedWithPrev) {
        currentPosition = i + 1;
      }
      
      playersWithTies.push({
        ...player,
        position: currentPosition,
        isTied: isTiedWithPrev || isTiedWithNext
      });
    }
    
    return playersWithTies;
  };

  const fetchTournamentData = async () => {
    try {
      // Fetch active tournaments (get the most recent one if multiple exist)
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tournamentError) {
        throw tournamentError;
      }

      if (!tournamentData) {
        console.log('No active tournament found');
        setTournament(null);
        setPlayers([]);
        setLoading(false);
        return;
      }

      setTournament(tournamentData);

      // Fetch tournament scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('tournament_scores')
        .select('*')
        .eq('tournament_id', tournamentData.id)
        .order('current_score', { ascending: true }); // Order by score for tie calculation

      if (scoresError) {
        throw scoresError;
      }

      // Calculate ties and set players
      const playersWithTies = calculateTies(scoresData || []);
      setPlayers(playersWithTies);
    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const syncLiveData = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      console.log('Manually syncing tournament data...');
      
      const { data, error } = await supabase.functions.invoke('sync-tournament-data');
      
      if (error) {
        throw error;
      }
      
      console.log('Sync response:', data);
      
      // Refresh local data after sync
      await fetchTournamentData();
      
    } catch (err) {
      console.error('Error syncing live data:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync live data');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();

    // Set up real-time subscription for tournament scores
    const channel = supabase
      .channel('tournament-scores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_scores'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Refetch data when there's a change
          fetchTournamentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    tournament, 
    players, 
    loading, 
    error, 
    syncing, 
    syncLiveData 
  };
};
