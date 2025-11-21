import { Model } from "@nozbe/watermelondb";
import { field, date } from "@nozbe/watermelondb/decorators";

export default class User extends Model {
  static table = "users";

  @field("full_name") fullName;
  @field("phone") phone;
  @field("location") location;
  @field("password") password;

  @date("created_at") createdAt;
  @date("updated_at") updatedAt;
}
