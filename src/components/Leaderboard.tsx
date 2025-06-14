
import React, { useState, useEffect } from 'react';
import { Trophy, Clock, MapPin, RefreshCw } from 'lucide-react';
import PlayerCard from './PlayerCard';
import { useTournamentData } from '../hooks/useTournamentData';

const Leaderboard: React.FC = () => {
  const { tournament, players, loading, error, syncing, syncLiveData } = useTournamentData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleSyncData = async () => {
    await syncLiveData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading tournament data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Tournament</h2>
          <p className="text-lg mb-4">{error}</p>
          <button 
            onClick={handleSyncData}
            disabled={syncing}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Try Sync Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Tournament</h2>
          <button 
            onClick={handleSyncData}
            disabled={syncing}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Live Data...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-12 h-12 text-yellow-400 mr-4" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {tournament.name}
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400 ml-4" />
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-white/90 mb-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">Live</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">{tournament.location}</span>
            </div>
            <div className="text-lg font-medium">
              {formatDateTime(currentTime)}
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse">
              🔴 LIVE LEADERBOARD
            </div>
            
            <button 
              onClick={handleSyncData}
              disabled={syncing}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-bold text-sm transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Live Data'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Current Standings - ESPN Live Data
          </h2>
          
          {players.length === 0 ? (
            <div className="text-center text-white">
              <p className="text-lg mb-4">No player data available</p>
              <button 
                onClick={handleSyncData}
                disabled={syncing}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Loading Live Data...' : 'Load Live Data'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => (
                <PlayerCard 
                  key={player.id} 
                  player={{
                    id: parseInt(player.id.replace(/-/g, ''), 16), // Convert UUID to number for compatibility
                    name: player.player_name,
                    position: player.position,
                    score: player.current_score,
                    previousPosition: player.previous_position || undefined,
                    isTied: player.isTied
                  }} 
                  index={index} 
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-white/80">
          <p className="text-sm">
            Live data from ESPN API • Real-time updates via Supabase • Scores relative to par • USGA tie system
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
