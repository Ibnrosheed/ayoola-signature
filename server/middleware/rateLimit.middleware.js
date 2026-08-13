/**
 * Lightweight, in-memory rate limiting middleware for sensitive endpoints
 */
const requestMap = new Map();

// Periodic cleanup every 15 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestMap.entries()) {
    if (now > record.resetTime) {
      requestMap.delete(key);
    }
  }
}, 15 * 60 * 1000);

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 5, message = 'Too many requests. Please try again later.' }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    let record = requestMap.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestMap.set(key, record);
      return next();
    }

    if (record.count >= max) {
      const retryAfterSecs = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSecs);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSecs,
      });
    }

    record.count += 1;
    next();
  };
};

export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many password reset requests. Please try again after 15 minutes.',
});

export const resendVerificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many verification email requests. Please try again after 15 minutes.',
});

export const testEmailLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: 'Test email limit exceeded. Please wait a few minutes before sending another test.',
});
