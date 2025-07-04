import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position: number;
  score: number;
  previousPosition?: number;
  isTied?: boolean;
  country?: string;
}

interface PlayerCardProps {
  player: Player;
  index: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, index }) => {
  const getPositionChange = () => {
    if (!player.previousPosition) return null;
    if (player.position < player.previousPosition) return 'up';
    if (player.position > player.previousPosition) return 'down';
    return 'same';
  };

  const getPositionIcon = () => {
    const change = getPositionChange();
    if (change === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (change === 'same') return <Minus className="w-4 h-4 text-gray-400" />;
    return null;
  };

  const getCardGradient = () => {
    if (player.position === 1) return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600';
    if (player.position === 2) return 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500';
    if (player.position === 3) return 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800';
    return 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500';
  };

  const getTextColor = () => {
    if (player.position <= 3) return 'text-white';
    return 'text-white';
  };

  const formatPosition = () => {
    if (player.position === 1) return '#1';
    return player.isTied ? `#${player.position}T` : `#${player.position}`;
  };

  const getCountryFlag = (country: string | undefined): string => {
    const countryFlags: { [key: string]: string } = {
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'US': '🇺🇸',
      'Spain': '🇪🇸',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'Ireland': '🇮🇪',
      'Northern Ireland': '🇬🇧',
      'South Africa': '🇿🇦',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'Canada': '🇨🇦',
      'Norway': '🇳🇴',
      'Sweden': '🇸🇪',
      'Denmark': '🇩🇰',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'Colombia': '🇨🇴',
      'Mexico': '🇲🇽',
      'China': '🇨🇳',
      'Thailand': '🇹🇭',
      'Malaysia': '🇲🇾',
      'Singapore': '🇸🇬',
      'Philippines': '🇵🇭',
      'India': '🇮🇳',
      'New Zealand': '🇳🇿',
      'Brazil': '🇧🇷',
      'Venezuela': '🇻🇪',
      'Puerto Rico': '🇵🇷',
      'Taiwan': '🇹🇼',
      'Czech Republic': '🇨🇿',
      'Austria': '🇦🇹',
      'Switzerland': '🇨🇭',
      'Finland': '🇫🇮',
      'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      'Zimbabwe': '🇿🇼',
      'Fiji': '🇫🇯'
    };
    
    return country ? countryFlags[country] || '🏌️' : '🏌️';
  };

  return (
    <div 
      className={`${getCardGradient()} rounded-xl p-4 mb-3 shadow-lg transform transition-all duration-500 hover:scale-105 animate-fade-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-12 h-12 rounded-full ${player.position === 1 ? 'bg-yellow-300' : player.position === 2 ? 'bg-gray-200' : player.position === 3 ? 'bg-amber-500' : 'bg-white/20'} flex items-center justify-center font-bold text-lg ${player.position <= 3 ? 'text-gray-800' : 'text-white'}`}>
              {player.position === 1 ? <Trophy className="w-6 h-6 text-yellow-600" /> : formatPosition().replace('#', '')}
            </div>
            {getPositionIcon()}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`font-bold text-xl ${getTextColor()}`}>
                {player.name}
              </h3>
              <span className="text-2xl">
                {getCountryFlag(player.country)}
              </span>
            </div>
            <p className={`text-sm ${getTextColor()} opacity-90`}>
              Score: {player.score > 0 ? '+' : ''}{player.score}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
