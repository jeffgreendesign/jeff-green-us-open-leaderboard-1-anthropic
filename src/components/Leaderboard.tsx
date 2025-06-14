
import React, { useState, useEffect } from 'react';
import { Trophy, Clock, MapPin } from 'lucide-react';
import PlayerCard from './PlayerCard';

interface Player {
  id: number;
  name: string;
  position: number;
  score: number;
  previousPosition?: number;
}

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Tiger Woods', position: 1, score: -8 },
    { id: 2, name: 'Rory McIlroy', position: 2, score: -6 },
    { id: 3, name: 'Jordan Spieth', position: 3, score: -5 },
    { id: 4, name: 'Justin Thomas', position: 4, score: -4 },
    { id: 5, name: 'Dustin Johnson', position: 5, score: -3 },
    { id: 6, name: 'Brooks Koepka', position: 6, score: -2 },
    { id: 7, name: 'Patrick Cantlay', position: 7, score: -1 },
    { id: 8, name: 'Xander Schauffele', position: 8, score: 0 },
    { id: 9, name: 'Jon Rahm', position: 9, score: +1 },
    { id: 10, name: 'Scottie Scheffler', position: 10, score: +2 },
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(player => ({
          ...player,
          previousPosition: player.position,
          score: player.score + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)
        }));

        // Sort by score (lower is better in golf)
        updatedPlayers.sort((a, b) => a.score - b.score);
        
        // Update positions
        updatedPlayers.forEach((player, index) => {
          player.position = index + 1;
        });

        return updatedPlayers;
      });
    }, 5000);

    return () => clearInterval(interval);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-12 h-12 text-yellow-400 mr-4" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              US Open Championship
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400 ml-4" />
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-white/90">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">Live</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">Pebble Beach</span>
            </div>
            <div className="text-lg font-medium">
              {formatDateTime(currentTime)}
            </div>
          </div>
          
          <div className="mt-4 inline-block bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse">
            🔴 LIVE LEADERBOARD
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Current Standings
          </h2>
          
          <div className="space-y-2">
            {players.map((player, index) => (
              <PlayerCard key={player.id} player={player} index={index} />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-white/80">
          <p className="text-sm">
            Leaderboard updates every 5 seconds • Scores are relative to par
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
