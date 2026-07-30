import { createContext, useContext } from 'react';
import type { Role } from '@/types';

export type Session = {
  role: Role | null;
  setRole: (r: Role | null) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
};

export const SessionContext = createContext<Session>({
  role: null,
  setRole: () => {},
  token: null,
  setToken: () => {},
  userId: null,
  setUserId: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}
