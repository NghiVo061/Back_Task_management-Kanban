"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.APIs_v1 = void 0;
var _express = _interopRequireDefault(require("express"));
var _httpStatusCodes = require("http-status-codes");
var _boardRouter = require("./boardRouter");
/* eslint-disable indent */

var Router = _express["default"].Router();
Router.use('/boards', _boardRouter.boardRouter);
var APIs_v1 = exports.APIs_v1 = Router;