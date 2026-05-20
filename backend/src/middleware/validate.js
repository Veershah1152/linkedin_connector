const { ZodError } = require('zod');

/**
 * Request validation middleware using Zod schemas
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: formattedErrors.map((e) => `${e.field}: ${e.message}`).join(', '),
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };
