import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  // Check Authorization header as well as cookies
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
      cookiesReceived: req.cookies,
      headersReceived: req.headers.authorization
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    console.error('Token Verification Failed:', error);
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};
  