const util = require("util");
const bcrypt = require("bcryptjs");

function generateVerificationCode() {
    let res = "";
    for (let i = 0; i < 6; i++) {
        res += util.format("%d", Math.floor(Math.random() * 10));
    }
    return res;
}

async function hashPassword(password) {
    return await bcrypt.hash(password, 8);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

module.exports = {
    generateVerificationCode,
    hashPassword,
    verifyPassword,
}