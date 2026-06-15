import logger from '#config/logger.js';
import { registerSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { createUser, checkUserExists } from '#services/auth.service.js';
import { generateToken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);

    logger.info('Signup request received with data:', req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, password, role } = validationResult.data;

    //Auth service logic here (e.g., create user, hash password, etc.)

    const user = await createUser({
      name,
      email,
      password,
      role,
    });

    const jwtToken = generateToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.setCookie(res, 'auth_token', jwtToken);

    logger.info(`User ${email} signed up successfully`);

    res.status(201).json({
      message: 'User signed up successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error during signup:', error);

    if (error.name === 'User with this email already exists') {
      return res
        .status(409)
        .json({ error: 'User with this email already exists' });
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    // Implement signin logic here (e.g., validate user credentials, generate JWT, etc.)
    const validationResult = signInSchema.safeParse(req.body);

    logger.info('Signin request received with data:', req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const user = await checkUserExists({ email, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const jwtToken = generateToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.setCookie(res, 'auth_token', jwtToken);

    logger.info(`User ${email} signed in successfully`);

    res.status(200).json({
      message: 'Signin successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error during signin:', error);
    next(error);
  }
};

export const signout = (req, res) => {
  // Implement sign-out logic here (e.g., clear cookies, invalidate tokens, etc.)
  cookies.clearCookie(res, 'auth_token');
  logger.info('User signed out successfully');
  res.status(200).json({ message: 'Sign-out successful' });
};
