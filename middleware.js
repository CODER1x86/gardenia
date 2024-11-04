module.exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
