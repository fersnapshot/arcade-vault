"use client";

import { createContext, useContext, useState } from "react";

export interface User {
  name: string;
}

interface UserContextValue {
  user: User | null;
  login: (u: User) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider
      value={{
        user,
        login: (u) => setUser({ name: u.name.slice(0, 10).toUpperCase() }),
        signOut: () => setUser(null),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
