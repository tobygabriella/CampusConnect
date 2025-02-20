export const logoutUser = () => {
  // Expire cookies
  document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Prevent infinite loop by only redirecting once
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
};


