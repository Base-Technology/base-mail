const moment = require('moment');
const fs = require('fs');
const util = require('../util/util');
const config = require('../const/config');

const file = config.dbFile;
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(file);

db.query = function (sql, params) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.all(sql, params, function (error, rows) {
            if (error)
                reject(error);
            else
                resolve({ rows: rows });
        });
    });
};

db.execute = function (sql, params) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.prepare(sql, params).run(function (error, rows) {
            if (error)
                reject(error);
            else
                resolve({ rows: rows });
        });
    });
};

async function initDatabase() {
    await db.execute(`CREATE TABLE IF NOT EXISTS "user" (
        "mail" text NOT NULL,
        "password" text NOT NULL,
        PRIMARY KEY ("mail")
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS "code" (
        "mail" text NOT NULL,
        "code" text,
        "timestamp" DATE,
        PRIMARY KEY ("mail")
    )`);
}

async function addUser(mail, password) {
    const hash = await util.hashPassword(password);
    await db.execute(`INSERT INTO "user" VALUES (?,?)`, [mail, hash]);
}

async function verifyUser(mail, password) {
    const result = await db.query(`SELECT * FROM "user" WHERE "mail" = ?`, [mail]);
    if (result.rows.length == 0) {
        throw new Error(`Mail [${mail}] not found`);
    }
    const res = await util.verifyPassword(password, result.rows[0].password);
    if (!res) {
        throw new Error(`Mail [${mail}] invalid password`);
    }
}

async function insertCode(mail, code) {
    await db.execute(`DELETE FROM "code" WHERE "mail" = ?`, [mail]);
    await db.execute(`INSERT INTO "code" VALUES (?,?,?)`, [mail, code, moment().valueOf()]);
}

async function deleteCode(mail) {
    await db.execute(`DELETE FROM "code" WHERE "mail" = ?`, [mail]);
}

async function verifyCode(mail, code) {
    const result = await db.query(`SELECT * FROM "code" WHERE "mail" = ? ORDER BY "timestamp" DESC`, [mail]);
    if (result.rows.length == 0) {
        throw new Error(`Mail [${mail}] did not have the verification code`);
    }
    if (result.rows[0].code != code) {
        throw new Error(`Mail [${mail}] and verification code [${code}] not match`);
    }
    if (moment().valueOf() - result.rows[0].timestamp > 5 * 60 * 1000) {
        await deleteCode(mail);
        throw new Error(`Verification code [${code}] for mail [${mail}] has been expired`);
    }
}

module.exports = {
    initDatabase,
    addUser,
    verifyUser,
    insertCode,
    deleteCode,
    verifyCode,
};