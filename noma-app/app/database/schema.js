import { tableSchema } from "@nozbe/watermelondb/Schema";

export const userSchema = tableSchema({
  name: "users",
  columns: [
    { name: "full_name", type: "string" },
    { name: "phone", type: "string", isIndexed: true },
    { name: "location", type: "string" },
    { name: "password", type: "string" },     // (Encrypt this later)
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
