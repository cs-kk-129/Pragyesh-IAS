import { db } from "./db";
import { users } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    
    const hashedPassword = await hashPassword("Admin@999");
    
    const adminUser = await db.insert(users).values({
      username: "csadmin",
      email: "csadmin@pragyeshias.com",
      name: "CS Admin",
      password: hashedPassword,
    }).returning();
    
    console.log("Admin user created successfully:", adminUser[0]);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();