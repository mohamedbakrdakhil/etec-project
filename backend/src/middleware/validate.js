const { validationResult } = require('express-validator');

/**
 * Generic validation error handler middleware.
 * Call after express-validator chains.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ message: firstError.msg });
  }
  next();
};

module.exports = { handleValidation };
