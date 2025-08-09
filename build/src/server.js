"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _express = _interopRequireDefault(require("express"));
var _mongodb = require("./config/mongodb");
var _v = require("./routers/v1");
var _asyncExitHook = _interopRequireDefault(require("async-exit-hook"));
var _enviroment = require("./config/enviroment");
var _errorHandlingMiddleware = require("./middlewares/errorHandlingMiddleware");
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-console */

var START_SERVER = function START_SERVER() {
  var app = (0, _express["default"])();
  var port = _enviroment.env.PORT || 8888;
  var hostName = _enviroment.env.HOST_NAME;
  app.use(_express["default"].json());

  // call router index
  app.use('/v1', _v.APIs_v1);
  app.get('/', function (req, res) {
    res.send('Hello World!');
  });

  // Middleware xử lý lỗi tập trung chứa 4 tham số, khi router bị lỗi và gọi next(error) thì các lỗi sẽ truyền về đây
  app.use(_errorHandlingMiddleware.errorHandlingMiddleware);
  app.listen(port, function () {
    console.log("Example app listening on port ".concat(port));
  });

  //Cơ chế gọi close connection (exitHook giúp ghi nhận thao tác đóng của ng dùng: ctr + c, close tab)
  (0, _asyncExitHook["default"])(/*#__PURE__*/(0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 1;
          return (0, _mongodb.CLOSE_DB)();
        case 1:
          _context.next = 3;
          break;
        case 2:
          _context.prev = 2;
          _t = _context["catch"](0);
          console.error('Error closing database:', _t);
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 2]]);
  })));
};
(0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
  var _t2;
  return _regenerator["default"].wrap(function (_context2) {
    while (1) switch (_context2.prev = _context2.next) {
      case 0:
        _context2.prev = 0;
        console.log('1. Connecting to MongoDB Cloud Atlas...');
        _context2.next = 1;
        return (0, _mongodb.CONNECT_DB)();
      case 1:
        console.log('2. Connected to MongoDB Cloud Atlas!');
        START_SERVER();
        _context2.next = 3;
        break;
      case 2:
        _context2.prev = 2;
        _t2 = _context2["catch"](0);
        console.error(_t2);
        process.exit(0);
      case 3:
      case "end":
        return _context2.stop();
    }
  }, _callee2, null, [[0, 2]]);
}))();

// CONNECT_DB()
//   .then(() => console.log('Connected to MongoDB Cloud Atlas!'))
//   .then(() => START_SERVER())
//   .catch(error => {
//     console.error(error)
//     process.exit(0)
// })