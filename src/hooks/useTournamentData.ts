
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
}

export const useTournamentData = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        // Fetch active tournament
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('status', 'active')
          .single();

        if (tournamentError) {
          throw tournamentError;
        }

        setTournament(tournamentData);

        // Fetch tournament scores
        const { data: scoresData, error: scoresError } = await supabase
          .from('tournament_scores')
          .select('*')
          .eq('tournament_id', tournamentData.id)
          .order('position', { ascending: true });

        if (scoresError) {
          throw scoresError;
        }

        setPlayers(scoresData || []);
      } catch (err) {
        console.error('Error fetching tournament data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

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

  return { tournament, players, loading, error };
};
