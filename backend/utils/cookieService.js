export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";
  const baseOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",              
  };

  // 2‑hour access token
  res.cookie("authToken", accessToken, {
    ...baseOpts,
    maxAge: 2 * 60 * 60 * 1000,
  });

  // 7‑day refresh token
  res.cookie("refreshToken", refreshToken, {
    ...baseOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
