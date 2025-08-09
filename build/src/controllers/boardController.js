"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.boardController = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _httpStatusCodes = require("http-status-codes");
var _ApiError = _interopRequireDefault(require("../utils/ApiError"));
var createNew = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(req, res, next) {
    var _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          throw new _ApiError["default"](_httpStatusCodes.StatusCodes.BAD_REQUEST, 'abc');
        case 1:
          _context.prev = 1;
          _t = _context["catch"](0);
          // Chuyển lỗi sang middleware (server)
          next(_t);
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[0, 1]]);
  }));
  return function createNew(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
var boardController = exports.boardController = {
  createNew: createNew
};