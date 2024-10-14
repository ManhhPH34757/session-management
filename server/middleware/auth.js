const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers?.authorization?.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(401);
      req.user = user;
      next();
    });
  };
  

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.sendStatus(401);
    next();
};

module.exports = { authenticateToken, authorizeAdmin };
