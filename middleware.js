//middleware.js
const authMiddleware = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

module.exports = { authMiddleware };
