import { createContext, useContext } from 'react';
import type { Role } from '@/types';

export type Session = {
  role: Role | null;
  setRole: (r: Role | null) => void;
};

export const SessionContext = createContext<Session>({
  role: null,
  setRole: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}
