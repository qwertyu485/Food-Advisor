import { db } from "./db";
import { users, helpMessages, type User, type InsertUser, type HelpMessage, type InsertHelpMessage } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  updateFavoriteFood(userId: string, favoriteFood: string): Promise<void>;
  createHelpMessage(message: InsertHelpMessage): Promise<HelpMessage>;
  getAllHelpMessages(): Promise<HelpMessage[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const passwordHash = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    
    const result = await db.insert(users).values({
      email: insertUser.email,
      passwordHash,
      favoriteFood: insertUser.favoriteFood || null,
    }).returning();
    
    return result[0];
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateFavoriteFood(userId: string, favoriteFood: string): Promise<void> {
    await db.update(users).set({ favoriteFood }).where(eq(users.id, userId));
  }

  async createHelpMessage(message: InsertHelpMessage): Promise<HelpMessage> {
    const result = await db.insert(helpMessages).values(message).returning();
    return result[0];
  }

  async getAllHelpMessages(): Promise<HelpMessage[]> {
    const result = await db.select().from(helpMessages).orderBy(desc(helpMessages.createdAt));
    return result;
  }
}

export const storage = new DatabaseStorage();
