import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const hashPassword = async password => {
  // Implement password hashing logic here (e.g., using bcrypt)
  try {
    return await bcrypt.hash(password, 10); // Hash the password with a salt round of 10
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing password', error);
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  // Implement user creation logic here
  try {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      throw new Error('User with this Email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    logger.info(`User ${email} created successfully`);
    return newUser;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw new Error('Error creating user', error);
  }
};

export const checkUserExists = async ({ email, password }) => {
  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return false; // User does not exist
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    return isPasswordValid ? user : false; // Return user if password is valid, otherwise false
  } catch (error) {
    logger.error('Error checking user existence:', error);
    throw new Error('Error checking user existence', error);
  }
};

export const findUserByEmail = async email => {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return null; // User not found
    }

    return user[0]; // Return the found user
  } catch (error) {
    logger.error('Error finding user by email:', error);
    throw new Error('Error finding user by email', error);
  }
};
