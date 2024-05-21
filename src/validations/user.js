const Joi = require("joi");

const paramsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).options({ allowUnknown: false });

const bodySchema = Joi.object({
  nickname: Joi.string().min(4).max(15).required(),
  password: Joi.string().min(4).max(10).required(),
  individual: Joi.boolean(),
  family: Joi.string(),
  role: Joi.string().default("user"),
}).options({ allowUnknown: false });

const bodySchema1 = Joi.object({
  nickname: Joi.string().min(4).max(15).required(),
  password: Joi.string().min(4).max(10).required(),
  individual: Joi.boolean(),
}).options({ allowUnknown: false });

const bodySchema2 = Joi.object({
  nickname: Joi.string().min(4).max(15).required(),
  password: Joi.string().min(4).max(10).required(),
}).options({ allowUnknown: false });

async function validateParams(req, res, next) {
  try {
    await paramsSchema.validateAsync(req.params);
    next();
  } catch (err) {
    console.log('user validatsiyadekan');
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

async function validateBodySignUp(req, res, next) {
  try {
    await bodySchema1.validateAsync(req.body);
    next();
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

async function validateBodySignIn(req, res, next) {
  try {
    await bodySchema2.validateAsync(req.body);
    next();
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  validateParams,
  validateBody,
  validateBodySignUp,
  validateBodySignIn,
};
