import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DB_PATH = path.join(process.cwd(), "db.json");

// Initialize database file if it doesn't exist
async function initializeDB() {
  try {
    await fs.access(DB_PATH);
  } catch (error) {
    // File doesn't exist, create it
    const initialData = { users: [], dms: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Read database
export async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    await initializeDB();
    return { users: [], dms: [] };
  }
}

// Write database
export async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// User operations
export const User = {
  async find(query = {}) {
    const db = await readDB();
    let users = db.users;
    
    if (query.username) {
      users = users.filter(user => user.username === query.username);
    }
    
    return users;
  },

  async findOne(query) {
    const users = await this.find(query);
    return users.length > 0 ? users[0] : null;
  },

  async findById(id, fields = null) {
    const db = await readDB();
    const user = db.users.find(user => user.id === id);
    
    if (!user) return null;
    
    if (fields) {
      const fieldsArray = fields.split(" ");
      const filteredUser = {};
      fieldsArray.forEach(field => {
        if (field === "_id") {
          filteredUser.id = user.id;
        } else if (user[field] !== undefined) {
          filteredUser[field] = user[field];
        }
      });
      return filteredUser;
    }
    
    return user;
  },

  async create(userData) {
    const db = await readDB();
    const user = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.users.push(user);
    await writeDB(db);
    
    return { _id: user.id, ...user };
  }
};

// DM operations
export const DM = {
  async find(query = {}) {
    const db = await readDB();
    let dms = db.dms;
    
    if (query.users) {
      dms = dms.filter(dm => dm.users.includes(query.users));
    }
    
    return dms;
  },

  async findOne(query) {
    const db = await readDB();
    
    if (query.users && query.users.$all) {
      const [user1, user2] = query.users.$all;
      return db.dms.find(dm => 
        dm.users.includes(user1) && dm.users.includes(user2)
      ) || null;
    }
    
    const dms = await this.find(query);
    return dms.length > 0 ? dms[0] : null;
  },

  async create(dmData) {
    const db = await readDB();
    const dm = {
      id: uuidv4(),
      ...dmData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.dms.push(dm);
    await writeDB(db);
    
    return dm;
  },

  async save(dmInstance) {
    const db = await readDB();
    const index = db.dms.findIndex(dm => dm.id === dmInstance.id);
    
    if (index !== -1) {
      dmInstance.updatedAt = new Date().toISOString();
      db.dms[index] = dmInstance;
      await writeDB(db);
    }
    
    return dmInstance;
  },

  // Helper method to populate users and message senders
  async populate(dms, userDb) {
    return dms.map(dm => ({
      ...dm,
      users: dm.users.map(userId => {
        const user = userDb.find(u => u.id === userId);
        return user ? { username: user.username, _id: user.id, id: user.id } : { _id: userId, id: userId };
      }),
      messages: dm.messages.map(msg => ({
        ...msg,
        sender: (() => {
          const user = userDb.find(u => u.id === msg.sender);
          return user ? { username: user.username, _id: user.id, id: user.id } : { _id: msg.sender, id: msg.sender };
        })()
      }))
    }));
  }
};

// Initialize database on module load
await initializeDB();