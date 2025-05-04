// AuthContext.js
import { createContext } from 'react';

export const AuthContext = createContext({
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  getUserInfo: () => null,
  getUserId: () => null
});