export const formatCrimeName = (name: string): string => {
  if (!name) return 'Unknown';
  const upper = name.toUpperCase();
  
  if (upper.includes('KARNATAKA POLICE ACT')) return 'KSP Act';
  if (upper.includes('KARNATAKA STATE LOCAL ACTS')) return 'Local Acts';
  if (upper.includes('MOTOR VEHICLE ACCIDENTS NON')) return 'MVA (Non-Fatal)';
  if (upper.includes('MOTOR VEHICLE ACCIDENTS FATAL')) return 'MVA (Fatal)';
  if (upper === 'CRPC') return 'CrPC';
  if (upper.includes('CASES OF HURT')) return 'Hurt';
  if (upper.includes('MISSING PERSON')) return 'Missing Person';
  if (upper.includes('MOLESTATION')) return 'Molestation';
  if (upper.includes('THEFT')) return 'Theft';
  if (upper.includes('RIOTS')) return 'Riots';
  if (upper.includes('MURDER')) return 'Murder';
  if (upper.includes('NDPS')) return 'NDPS';
  if (upper.includes('POCSO')) return 'POCSO';

  // Capitalize first letters for any other crime type
  const titleCased = name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return titleCased.length > 15 ? titleCased.substring(0, 15) + '...' : titleCased;
};

export const formatDistrictName = (name: string): string => {
  if (!name) return 'Unknown';
  return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
