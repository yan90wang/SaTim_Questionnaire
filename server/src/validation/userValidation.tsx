import Joi, { type ObjectSchema } from "joi";

export interface UserInput {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export const userValidationSchema: ObjectSchema<UserInput> = Joi.object({
    first_name: Joi.string().min(0).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required(),
    confirmPassword: Joi.string().min(6).max(20).required(),
});

export const registerValidationSchema: ObjectSchema<UserInput> = userValidationSchema.keys({
    confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords must match",
        }),
});
