"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _mongodb = require("mongodb");
var _enviroment = require("./enviroment");
/* eslint-disable indent */

var MongoDB_Uri = _enviroment.env.MONGODB_URI;
var DataBase_Name = _enviroment.env.DATABASE_NAME;
var TMDatabaseInstance = null;
var MongoClientInstance = new _mongodb.MongoClient(MongoDB_Uri, {
  serverApi: {
    version: _mongodb.ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});
var CONNECT_DB = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee() {
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.next = 1;
          return MongoClientInstance.connect();
        case 1:
          TMDatabaseInstance = MongoClientInstance.db(DataBase_Name);
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function CONNECT_DB() {
    return _ref.apply(this, arguments);
  };
}();

// Lấy pool connection chứa thông tin conection đã kết nối
var GET_DB = function GET_DB() {
  if (!TMDatabaseInstance) throw new Error('Must connect Database first');
  return TMDatabaseInstance;
};

// Đóng kết nối tới Database khi cần
var CLOSE_DB = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 1;
          return MongoClientInstance.close();
        case 1:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function CLOSE_DB() {
    return _ref2.apply(this, arguments);
  };
}();
module.exports = {
  CONNECT_DB: CONNECT_DB,
  GET_DB: GET_DB,
  CLOSE_DB: CLOSE_DB
};