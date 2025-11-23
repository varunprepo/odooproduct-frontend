/*export const refreshAccessToken = async () => {
  try {
    //const res = await fetch("http://127.0.0.1:3000/api/auth/refresh", {
    const res = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      credentials: "include", // sends cookies
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    if (data?.token) {
      localStorage.setItem("token", data.token);
      return true;
    }
  } catch (err) {
    console.error("Token refresh error:", err);
  }
  return false;
};*/

export const refreshAccessToken = async () =>  {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("Missing refresh token");

    const res = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    // Save new tokens
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    console.log("Refresh Token:", data.refreshToken);
    
    console.log("✅ Tokens refreshed");
    return data.token;
  } catch (err) {
    console.error("Token refresh error:", err);
    localStorage.setItem("sessionStatus", "expired");
    return null;
  }
}



