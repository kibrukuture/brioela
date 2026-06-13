import { drizzle } from "drizzle-orm/postgres-js";
import {
  eq,
  and,
  or,
  not,
  like,
  ilike,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  desc,
  asc,
  One,
  Many,
} from "drizzle-orm";
import { sql } from "drizzle-orm";

export {
  eq,
  and,
  or,
  not,
  like,
  ilike,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  sql,
  desc,
  asc,
  One,
  Many,
};
export default drizzle;
