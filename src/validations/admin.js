const Joi = require("joi");

const bodySchema = Joi.object({
  nickname: Joi.string().required(),
  password: Joi.string().required(),
}).options({ allowUnknown: false });

async function validateBody(req, res, next) {
  try {
    await bodySchema.validateAsync(req.body);
    next();
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  validateBody,
};
