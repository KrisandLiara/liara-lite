import { supabase } from '../clients.js';

const authMiddleware = async (req, res, next) => {
  // Liara Lite mode: no auth. Treat all requests as a single local user.
  if (String(process.env.LIARA_LITE || '').toLowerCase() === 'true') {
    req.user = { id: process.env.LIARA_LITE_USER_ID || '00000000-0000-0000-0000-000000000001' };
    return next();
  }

  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback for SSE: check for token in query parameter
  else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is missing.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: 'Invalid or expired token.', details: error.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found for the provided token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred during authentication.' });
  }
};

export default authMiddleware; 