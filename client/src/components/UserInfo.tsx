import React from 'react';
import { useUser } from './UserProvider';
import LogoutButton from './LogoutButton';

function toCamelCase(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const UserInfo: React.FC = () => {
  const { user, loading } = useUser();
  if (loading || !user) return null;
  let displayName = user.name || user.email?.split('@')[0] || 'User';
  displayName = toCamelCase(displayName);
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 bg-gray-100 px-3 py-2 rounded shadow-sm">
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-lg">
        {initial}
      </div>
      <span className="font-medium text-gray-800">{displayName}</span>
      <LogoutButton />
    </div>
  );
};

export default UserInfo; 