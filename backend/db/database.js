import fs from "fs/promises";
import path from "path";

const DB_DIR = path.join(process.cwd(), "db");
const USERS_FILE = path.join(DB_DIR, "users.json");
const DMS_FILE = path.join(DB_DIR, "dms.json");

// Initialize database files if they don't exist
async function initDB() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    
    // Initialize users file
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    }
    
    // Initialize DMs file
    try {
      await fs.access(DMS_FILE);
    } catch {
      await fs.writeFile(DMS_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Helper function to read JSON files
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Helper function to write JSON files
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// User operations
export const UserDB = {
  async findOne(query) {
    const users = await readJSONFile(USERS_FILE);
    return users.find(user => {
      if (query.username) return user.username === query.username;
      if (query._id || query.id) return user.id === (query._id || query.id);
      return false;
    });
  },

  async findById(id, fields = null) {
    const users = await readJSONFile(USERS_FILE);
    const user = users.find(u => u.id === id);
    if (!user) return null;
    
    if (fields) {
      const result = {};
      fields.split(" ").forEach(field => {
        if (field === "_id") result._id = user.id;
        else if (user[field] !== undefined) result[field] = user[field];
      });
      return result;
    }
    
    // Return user with _id property for compatibility
    return { ...user, _id: user.id };
  },

  async find(query = {}, fields = null) {
    const users = await readJSONFile(USERS_FILE);
    let result = users;
    
    if (fields) {
      result = users.map(user => {
        const obj = {};
        fields.split(" ").forEach(field => {
          if (field === "_id") obj._id = user.id;
          else if (user[field] !== undefined) obj[field] = user[field];
        });
        return obj;
      });
    } else {
      result = users.map(user => ({ ...user, _id: user.id }));
    }
    
    return result;
  },

  async create(userData) {
    const users = await readJSONFile(USERS_FILE);
    const newUser = {
      id: generateId(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeJSONFile(USERS_FILE, users);
    
    // Return user with _id property for compatibility
    return { ...newUser, _id: newUser.id };
  }
};

// DM operations
export const DMDB = {
  async find(query = {}) {
    const dms = await readJSONFile(DMS_FILE);
    let result = dms;
    
    if (query.users) {
      result = dms.filter(dm => dm.users.includes(query.users));
    }
    
    // Return DMs with _id property for compatibility
    return result.map(dm => ({ ...dm, _id: dm.id }));
  },

  async findOne(query) {
    const dms = await readJSONFile(DMS_FILE);
    
    if (query.users && query.users.$all) {
      const [user1, user2] = query.users.$all;
      return dms.find(dm => 
        dm.users.includes(user1) && dm.users.includes(user2)
      );
    }
    
    if (query._id || query.id) {
      return dms.find(dm => dm.id === (query._id || query.id));
    }
    
    return null;
  },

  async create(dmData) {
    const dms = await readJSONFile(DMS_FILE);
    const newDM = {
      id: generateId(),
      ...dmData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    dms.push(newDM);
    await writeJSONFile(DMS_FILE, dms);
    
    // Return DM with _id property for compatibility
    return { ...newDM, _id: newDM.id };
  },

  async save(dm) {
    const dms = await readJSONFile(DMS_FILE);
    const index = dms.findIndex(d => d.id === dm.id);
    
    if (index !== -1) {
      dms[index] = { ...dm, updatedAt: new Date().toISOString() };
      await writeJSONFile(DMS_FILE, dms);
    }
    
    return dm;
  },

  // Simulate Mongoose populate for users and messages.sender
  async populate(dms, populateFields) {
    if (!Array.isArray(dms)) dms = [dms];
    
    const users = await readJSONFile(USERS_FILE);
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = { _id: user.id, username: user.username };
    });
    
    return dms.map(dm => {
      const populatedDM = { ...dm };
      
      if (populateFields.includes("users")) {
        populatedDM.users = dm.users.map(userId => userMap[userId] || { _id: userId, username: "Unknown" });
      }
      
      if (populateFields.includes("messages.sender")) {
        populatedDM.messages = dm.messages.map(msg => ({
          ...msg,
          sender: userMap[msg.sender] || { _id: msg.sender, username: "Unknown" }
        }));
      }
      
      return populatedDM;
    });
  }
};

// Initialize database on import
initDB();