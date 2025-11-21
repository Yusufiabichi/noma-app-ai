import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { userSchema } from "./schema";
import User from "./models/User.js";

const adapter = new SQLiteAdapter({
  schema: {
    version: 1,
    tables: [userSchema],
  },
});

export const database = new Database({
  adapter,
  modelClasses: [User],
});
