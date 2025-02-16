export const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === "production";

  
    // Set Access Token Cookie
    res.cookie("authToken", accessToken, {
        httpOnly: true,
        secure: false, // for local development
        sameSite: 'Lax',
        domain: 'localhost',
        path: '/',
        maxAge: 15 * 60 * 1000
    });
  
    // Set Refresh Token Cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // for local development
        sameSite: 'Lax',
        domain: 'localhost', 
        path: '/',
        maxAge: 604800000
    });
  };