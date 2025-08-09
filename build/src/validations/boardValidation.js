"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.boardValidation = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _joi = _interopRequireDefault(require("joi"));
var _httpStatusCodes = require("http-status-codes");
var _ApiError = _interopRequireDefault(require("../utils/ApiError"));
// Kiểm tra cac input từ người dùng có hợp lệ ko

var createNew = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(req, res, next) {
    var correctCondition, errorMessage, customError, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          correctCondition = _joi["default"].object({
            title: _joi["default"].string().required().min(3).max(50).trim().strict(),
            description: _joi["default"].string().required().min(3).max(256).trim().strict()
          });
          _context.prev = 1;
          _context.next = 2;
          return correctCondition.validateAsync(req.body, {
            abortEarly: false
          });
        case 2:
          // Kiểm tra input theo điều kiện đã set trên

          // Chuyển hướng cho controller: boardValidation.createNew -> boardController.createNew
          next();
          _context.next = 4;
          break;
        case 3:
          _context.prev = 3;
          _t = _context["catch"](1);
          errorMessage = new Error(_t).message; // console.log check lại
          customError = new _ApiError["default"](_httpStatusCodes.StatusCodes.UNPROCESSABLE_ENTITY, errorMessage);
          next(customError);
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 3]]);
  }));
  return function createNew(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
var boardValidation = exports.boardValidation = {
  createNew: createNew
};