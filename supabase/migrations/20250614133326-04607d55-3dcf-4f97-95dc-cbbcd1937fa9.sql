
-- Create a table for tournament information
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for player scores in tournaments
CREATE TABLE public.tournament_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  current_score INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  previous_position INTEGER,
  rounds_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_name)
);

-- Make the tables publicly readable (no authentication required)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tournaments
CREATE POLICY "Anyone can view tournaments" 
  ON public.tournaments 
  FOR SELECT 
  USING (true);

-- Allow public read access to tournament scores
CREATE POLICY "Anyone can view tournament scores" 
  ON public.tournament_scores 
  FOR SELECT 
  USING (true);

-- Insert sample tournament data
INSERT INTO public.tournaments (name, location, start_date, end_date, status)
VALUES ('US Open Championship', 'Pebble Beach', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 'active');

-- Insert sample player data for the tournament
INSERT INTO public.tournament_scores (tournament_id, player_name, current_score, position, previous_position, rounds_played)
SELECT 
  t.id,
  player_data.name,
  player_data.score,
  player_data.pos,
  player_data.prev_pos,
  2
FROM public.tournaments t,
(VALUES 
  ('Tiger Woods', -8, 1, 2),
  ('Rory McIlroy', -6, 2, 1),
  ('Jordan Spieth', -5, 3, 4),
  ('Justin Thomas', -4, 4, 3),
  ('Dustin Johnson', -3, 5, 6),
  ('Brooks Koepka', -2, 6, 5),
  ('Patrick Cantlay', -1, 7, 8),
  ('Xander Schauffele', 0, 8, 7),
  ('Jon Rahm', 1, 9, 10),
  ('Scottie Scheffler', 2, 10, 9)
) AS player_data(name, score, pos, prev_pos)
WHERE t.name = 'US Open Championship';

-- Enable realtime for live updates
ALTER TABLE public.tournament_scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_scores;
