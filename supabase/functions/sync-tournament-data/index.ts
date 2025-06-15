
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ESPNPlayer {
  id: string;
  athlete: {
    displayName: string;
    fullName: string;
    flag?: {
      alt: string;
    };
  };
  score: string;
  status?: string;
}

interface ESPNTournament {
  id: string;
  name: string;
  status: {
    type: {
      description: string;
    };
  };
  competitions: Array<{
    venue: {
      fullName: string;
    };
    competitors: ESPNPlayer[];
    status: {
      type: {
        description: string;
      };
    };
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting tournament data sync...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current PGA Tour events from ESPN
    console.log('Fetching ESPN data...');
    const espnResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard');
    
    if (!espnResponse.ok) {
      console.error(`ESPN API error: ${espnResponse.status} - ${espnResponse.statusText}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `ESPN API returned ${espnResponse.status}: ${espnResponse.statusText}` 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const espnData = await espnResponse.json();
    console.log('ESPN data fetched successfully');

    if (!espnData.events || !Array.isArray(espnData.events) || espnData.events.length === 0) {
      console.error('No events found in ESPN data');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No tournament events found in ESPN data' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the US Open specifically or any active tournament
    let activeTournament = espnData.events.find((event: ESPNTournament) => 
      event.name && (
        event.name.toLowerCase().includes('u.s. open') || 
        event.name.toLowerCase().includes('us open')
      )
    );

    // If no US Open found, look for any live tournament
    if (!activeTournament) {
      activeTournament = espnData.events.find((event: ESPNTournament) => 
        event.status?.type?.description === 'In Progress' || 
        event.status?.type?.description === 'Live'
      );
    }

    // Fallback to first available tournament
    if (!activeTournament) {
      activeTournament = espnData.events[0];
    }

    if (!activeTournament || !activeTournament.name) {
      console.error('No valid tournament data found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No valid tournament data found in ESPN response' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const competition = activeTournament.competitions?.[0];
    if (!competition) {
      console.error('No competition data found in tournament');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No competition data found in tournament' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing tournament: ${activeTournament.name}`);
    console.log(`Tournament status: ${activeTournament.status?.type?.description || 'Unknown'}`);

    // Update or create tournament
    const { data: existingTournament, error: tournamentSelectError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('name', activeTournament.name)
      .maybeSingle();

    if (tournamentSelectError) {
      console.error('Error checking existing tournament:', tournamentSelectError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database error while checking tournament' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let tournamentId: string;

    if (existingTournament) {
      tournamentId = existingTournament.id;
      console.log('Using existing tournament:', tournamentId);
    } else {
      // Create new tournament
      const { data: newTournament, error: tournamentInsertError } = await supabase
        .from('tournaments')
        .insert({
          name: activeTournament.name,
          location: competition.venue?.fullName || 'TBD',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
          status: 'active'
        })
        .select('id')
        .single();

      if (tournamentInsertError || !newTournament) {
        console.error('Error creating tournament:', tournamentInsertError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to create tournament in database' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      tournamentId = newTournament.id;
      console.log('Created new tournament:', tournamentId);
    }

    // Process players with corrected data structure
    const players = competition.competitors || [];
    console.log(`Processing ${players.length} players from ESPN`);

    if (players.length === 0) {
      console.warn('No players found in competition data');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No players found in tournament data' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log first few players to understand the data structure
    console.log('Sample player data:', JSON.stringify(players.slice(0, 2), null, 2));

    const playerUpdates = players
      .filter((player: ESPNPlayer) => {
        // Check if player has valid athlete data
        const hasName = player.athlete?.displayName && player.athlete.displayName.trim().length > 0;
        if (!hasName) {
          console.log('Skipping player without name:', player.athlete?.displayName || 'No name');
        }
        return hasName;
      })
      .map((player: ESPNPlayer, index: number) => {
        // Use the player's order in the array as position (ESPN sorts by position)
        let position = index + 1;
        
        // Parse score from the score string
        let score = 0;
        if (player.score) {
          const scoreStr = player.score.trim();
          console.log(`Player ${player.athlete.displayName} score string: "${scoreStr}"`);
          
          if (scoreStr === 'E' || scoreStr === 'EVEN') {
            score = 0;
          } else if (scoreStr.startsWith('+')) {
            score = parseInt(scoreStr.substring(1)) || 0;
          } else if (scoreStr.startsWith('-')) {
            score = parseInt(scoreStr) || 0; // Already has negative sign
          } else if (scoreStr.toLowerCase().includes('cut')) {
            position = 999; // Set high number for missed cut
            score = 999;
          } else if (scoreStr.toLowerCase().includes('wd')) {
            position = 998; // Set high number for withdrawal
            score = 998;
          } else {
            // Try to parse as a direct number
            const numScore = parseInt(scoreStr.replace(/[^\-\d]/g, ''));
            if (!isNaN(numScore)) {
              score = numScore;
            }
          }
        }

        // Extract country information from the flag
        const country = player.athlete?.flag?.alt || null;
        console.log(`Player ${player.athlete.displayName} country: "${country}"`);

        console.log(`Processed player: ${player.athlete.displayName}, Position: ${position}, Score: ${score}, Country: ${country}`);

        return {
          tournament_id: tournamentId,
          player_name: player.athlete.displayName,
          current_score: score,
          position: position,
          rounds_played: 2, // Default assumption
          previous_position: null,
          country: country
        };
      })
      .slice(0, 50); // Get top 50 players

    console.log(`Processed ${playerUpdates.length} valid players for database update`);

    if (playerUpdates.length === 0) {
      console.log('Warning: No valid player data to update - this might indicate a data format issue');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No valid player data to update - possible data format issue',
        tournament: activeTournament.name,
        rawPlayersCount: players.length,
        samplePlayer: players[0] || null
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clear existing scores for this tournament
    const { error: deleteError } = await supabase
      .from('tournament_scores')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteError) {
      console.error('Error clearing existing scores:', deleteError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to clear existing tournament scores' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert new scores
    const { error: insertError } = await supabase
      .from('tournament_scores')
      .insert(playerUpdates);

    if (insertError) {
      console.error('Error inserting player scores:', insertError);
      console.error('Sample player update:', playerUpdates[0]);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to insert tournament scores into database' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully updated ${playerUpdates.length} player scores with country information`);

    return new Response(JSON.stringify({ 
      success: true,
      tournament: activeTournament.name,
      tournamentStatus: activeTournament.status?.type?.description || 'Unknown',
      playersUpdated: playerUpdates.length,
      location: competition.venue?.fullName,
      totalPlayersFromESPN: players.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-tournament-data function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
