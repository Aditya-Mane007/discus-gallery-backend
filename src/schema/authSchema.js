const Joi = require("joi");

const regsiterSchema = Joi.object({
  email: Joi.string().email({ maxDomainSegments: 2 }).required().messages({
    "string.base": "Email address must be a string",
    "string.email": "Enter valid email address",
    "any.required": "Email address cannot be empty",
    "string.empty": "Email address cannot be empty",
  }),
  password: Joi.string().min(5).max(15).alphanum().required().messages({
    "string.base": "Password must be a string",
    "string.alphanum": "Password must only contain alpha-numeric characters",
    "string.min": "Password must be at least 5 characters",
    "string.max": "Password must be at most 15 characters",
    "any.required": "Password cannot be empty",
    "string.empty": "Password cannot be empty",
  }),
  name: Joi.string().min(2).max(100).required().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must be at most 100 characters",
    "any.required": "Full name cannot be empty",
    "string.empty": "Full name cannot be empty",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ maxDomainSegments: 2 }).required().messages({
    "string.base": "Email address must be a string",
    "string.email": "Enter valid email address",
    "any.required": "Email address cannot be empty",
    "string.empty": "Email address cannot be empty",
  }),
  password: Joi.string().min(5).max(15).alphanum().required().messages({
    "string.base": "Password must be a string",
    "string.alphanum": "Password must only contain alpha-numeric characters",
    "string.min": "Password must be at least 5 characters",
    "string.max": "Password must be at most 15 characters",
    "any.required": "Password cannot be empty",
    "string.empty": "Password cannot be empty",
  }),
});

module.exports = {
  regsiterSchema,
  loginSchema,
};
