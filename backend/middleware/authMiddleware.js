import jwt from 'jsonwebtoken';
export const requireAuth = (req, res, next) => {
    const token = req.cookies.authToken;
  
    if (!token) {
      return res.status(401).json({ 
        message: "No authentication token found",
        cookiesReceived: req.cookies
      });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      console.error('Token Verification Failed:', error.message);
      return res.status(401).json({ 
        message: "Invalid or expired token",
        error: error.message
      });
    }
  };
  