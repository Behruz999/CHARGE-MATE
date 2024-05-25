const Joi = require("joi");

const paramsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).options({ allowUnknown: false });

const bodySchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().allow(null),
  currency: Joi.string().uppercase(),
  quantity: Joi.number(),
  price: Joi.number().required(),
  individual: Joi.boolean(),
  family: Joi.string().hex().length(24).allow(null),
}).options({ allowUnknown: false });

async function validateParams(req, res, next) {
  try {
    await paramsSchema.validateAsync(req.params);
    next();
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

async function validateBody(req, res, next) {
  try {
    await bodySchema.validateAsync(req.body);
    next();
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  validateParams,
  validateBody,
};
