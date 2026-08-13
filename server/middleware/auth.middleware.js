import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Protect middleware to authenticate requests via JWT
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'ayoola_signature_secret_jwt_key_phase_1';
    
    // Verify Token
    const decoded = jwt.verify(token, jwtSecret);

    // Find User by ID from decoded token payload
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User account no longer exists.',
      });
    }

    // Confirm account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied. Please contact support.`,
      });
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Token invalid or expired.',
    });
  }
};

/**
 * Reusable Role-Based Authorization Middleware
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'superadmin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires ${roles.join(' or ')} permission.`,
      });
    }

    next();
  };
};

/**
 * Optional Auth middleware — silently attaches user to req if a valid JWT is
 * present, but never blocks the request if the token is absent or invalid.
 * Use this for public routes where authenticated users need extra context
 * (e.g. checking helpful votes on product reviews).
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const jwtSecret = process.env.JWT_SECRET || 'ayoola_signature_secret_jwt_key_phase_1';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.userId).lean();
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch {
    // Invalid/expired token — just continue without req.user
  }
  next();
};
