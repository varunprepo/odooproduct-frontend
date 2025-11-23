// utils/authUtils.js
import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token) => {
  //try {
    /*const decoded = jwtDecode(token);
    if (!decoded.exp) return true;
    const now = Date.now() / 1000;
    return decoded.exp < now; // expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // convert seconds → ms
    return Date.now() >= exp;*/
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false; // no expiry claim
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch (e) {
    console.error("Invalid token:", e);
    return true;
  }
};

export const getTokenRemainingTime = (token) => {
  try {
    const { exp } = jwtDecode(token);
    const now = Date.now() / 1000;
    return (exp - now) * 1000; // ms until expiry
  } catch {
    return 0;
  }
};


