"use strict";
exports.__esModule = true;
var crypto_1 = require("crypto");
function hashPassword(password) {
    return crypto_1.createHash('sha1').update(password).digest('hex');
}
exports.hashPassword = hashPassword;
