  export const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === "production";
    // Set Access Token Cookie
    res.cookie("authToken", accessToken, {
      httpOnly: true,
      secure: isProduction, 
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });
  
    // Set Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction, 
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  };