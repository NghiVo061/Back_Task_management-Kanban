"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.env = void 0;
require("dotenv/config");
var env = exports.env = {
  PORT: process.env.PORT,
  HOST_NAME: process.env.HOST_NAME,
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,
  BUILD_MODE: process.env.BUILD_MODE
};