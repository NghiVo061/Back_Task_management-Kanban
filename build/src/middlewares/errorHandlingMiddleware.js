"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorHandlingMiddleware = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _httpStatusCodes = require("http-status-codes");
var _enviroment = require("../config/enviroment");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; } /* eslint-disable no-unused-vars */
var errorHandlingMiddleware = exports.errorHandlingMiddleware = function errorHandlingMiddleware(err, req, res, next) {
  if (!err.statusCode) err.statusCode = _httpStatusCodes.StatusCodes.INTERNAL_SERVER_ERROR;
  var message = err.message || _httpStatusCodes.StatusCodes[err.statusCode];
  if (err.name === 'ValidationError') {
    message = err.details.map(function (detail) {
      return detail.message;
    }).join(', '); // Xử lý lỗi Joi
  }
  var responseError = _objectSpread({
    statusCode: err.statusCode,
    message: message
  }, _enviroment.env.BUILD_MODE === 'dev' && {
    stack: err.stack
  });
  res.status(responseError.statusCode).json(responseError);
};