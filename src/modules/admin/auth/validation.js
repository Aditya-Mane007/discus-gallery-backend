const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email({ maxDomainSegments: 2 }).required().messages({
    "string.base": "Email address must be a string",
    "string.email": "Enter valid email address",
    "any.required": "Email address cannot be empty",
    "string.empty": "Email address cannot be empty",
  }),
  password: Joi.string()
    .pattern(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
    )
    .min(5)
    .max(50)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 5 characters",
      "string.max": "Password must be at most 50 characters",
      "any.required": "Password cannot be empty",
      "string.empty": "Password cannot be empty",
      "string.pattern.base":
        "Password must contain at least one number and one special character",
      "string.pattern.name":
        "Password must contain at least one number and one special character",
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
  password: Joi.string()
    .pattern(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
    )
    .min(5)
    .max(50)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 5 characters",
      "string.max": "Password must be at most 50 characters",
      "any.required": "Password cannot be empty",
      "string.empty": "Password cannot be empty",
      "string.pattern.base":
        "Password must contain at least one number and one special character",
      "string.pattern.name":
        "Password must contain at least one number and one special character",
    }),
});

const otpVerificationSchema = Joi.object({
  otp: Joi.string().min(6).max(6).required().messages({
    "any.required": "otp cannot be empty",
    "string.empty": "otp cannot be empty",
    "string.min": "otp must be at least 6 characters",
    "string.max": "otp must be at least 6 characters",
  }),
});

const updateUserInfoSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  profile_photo: Joi.string().optional(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .pattern(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
    )
    .min(5)
    .max(15)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 5 characters",
      "string.max": "Password must be at most 50 characters",
      "any.required": "Password cannot be empty",
      "string.empty": "Password cannot be empty",
      "string.pattern.base":
        "Password must contain at least one number and one special character",
      "string.pattern.name":
        "Password must contain at least one number and one special character",
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  otpVerificationSchema,
  updateUserInfoSchema,
  resetPasswordSchema,
};
