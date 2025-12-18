import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertHelpMessageSchema } from "@shared/schema";
import { z } from "zod";
import { fromError } from "zod-validation-error";

const USDA_API_KEY = process.env.USDA_API_KEY;

if (!USDA_API_KEY) {
  console.warn("Warning: USDA_API_KEY environment variable is not set. Food search features will not work.");
}

// USDA Food Search
async function searchUSDAFood(query: string) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=1`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.foods || data.foods.length === 0) {
    return null;
  }
  
  const item = data.foods[0];
  let calories = null;
  
  for (const nutrient of item.foodNutrients || []) {
    if (nutrient.nutrientName === "Energy") {
      calories = {
        value: nutrient.value,
        unit: nutrient.unitName || "KCAL",
      };
      break;
    }
  }
  
  return {
    description: item.description,
    brandOwner: item.brandOwner || "USDA",
    calories,
  };
}

async function searchUSDAMultiple(query: string, pageSize: number = 5) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.foods || data.foods.length === 0) {
    return [];
  }
  
  return data.foods.map((item: any) => {
    let calories = null;
    
    for (const nutrient of item.foodNutrients || []) {
      if (nutrient.nutrientName === "Energy") {
        calories = {
          value: nutrient.value,
          unit: nutrient.unitName || "KCAL",
        };
        break;
      }
    }
    
    return {
      description: item.description,
      brandOwner: item.brandOwner || "USDA",
      calories,
    };
  });
}

// Search USDA with full nutrient data for Home page
async function searchUSDAFull(query: string, pageSize: number = 10) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.foods || [];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Full food search endpoint (returns all nutrients) for Home page
  app.get("/api/foods/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const foods = await searchUSDAFull(query);
      res.json({ foods });
    } catch (error) {
      console.error("Foods search error:", error);
      res.status(500).json({ error: "Failed to search foods" });
    }
  });

  // Search food endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const food = await searchUSDAFood(query);
      
      if (!food) {
        return res.status(404).json({ error: "Food not found" });
      }
      
      res.json({ food });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search food" });
    }
  });

  // Search recommendations (multiple results)
  app.get("/api/recommendations", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const results = await searchUSDAMultiple(query, 6);
      res.json({ results });
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Signup endpoint
  app.post("/api/signup", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: fromError(result.error).toString() 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const user = await storage.createUser(result.data);
      
      res.json({ 
        status: "ok", 
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          favoriteFood: user.favoriteFood,
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login endpoint
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post("/api/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: fromError(result.error).toString() 
        });
      }
      
      const user = await storage.getUserByEmail(result.data.email);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      const isValid = await storage.verifyPassword(user, result.data.password);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      res.json({
        status: "ok",
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          favoriteFood: user.favoriteFood,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get all users (for admin page) - requires authentication
  app.get("/api/users", async (req, res) => {
    try {
      // Check for authentication via userId header
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Verify the user exists in the database
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(401).json({ error: "Invalid user" });
      }
      
      const allUsers = await storage.getAllUsers();
      
      // Return users without password hashes for security
      const safeUsers = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        favoriteFood: user.favoriteFood,
      }));
      
      res.json({ users: safeUsers });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Submit help message
  app.post("/api/help-messages", async (req, res) => {
    try {
      const result = insertHelpMessageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: fromError(result.error).toString() 
        });
      }
      
      const message = await storage.createHelpMessage(result.data);
      
      res.json({ 
        status: "ok", 
        message: "Message sent successfully",
        id: message.id
      });
    } catch (error) {
      console.error("Help message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get all help messages (for admin page) - requires authentication
  app.get("/api/help-messages", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(401).json({ error: "Invalid user" });
      }
      
      const messages = await storage.getAllHelpMessages();
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching help messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  return httpServer;
}
