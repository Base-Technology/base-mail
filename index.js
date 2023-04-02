

const express = require("express");
const cors = require("cors");
const config = require("./const/config");
const db = require("./database/sqlite");
const send = require("./mail/service");
const util = require("./util/util");

async function main() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    await db.initDatabase();

    app.get("/", (req, res) => {
        res.send("base mail");
    });

    app.post("/register", async (req, res) => {
        if (!req.body.mail) {
            res.status(400).send("Mail must be provided");
            return
        }
        if (!req.body.password) {
            res.status(400).send("Password must be provided");
            return
        }
        if (!req.body.verification_code) {
            res.status(400).send("Verification code must be provided");
            return
        }
        try {
            await db.verifyCode(req.body.mail, req.body.verification_code);
            await db.addUser(req.body.mail, req.body.password);
            await db.deleteCode(req.body.mail);
        } catch (e) {
            console.log(e);
            res.status(500).send(e.message ? e.message : e);
        }
        res.json();
    });

    app.post("/login", async (req, res) => {
        if (!req.body.mail) {
            res.status(400).send("Mail must be provided");
            return
        }
        if (!req.body.password) {
            res.status(400).send("Password must be provided");
            return
        }
        try {
            await db.verifyUser(req.body.mail, req.body.password);
        } catch (e) {
            console.log(e);
            res.status(500).send(e.message ? e.message : e);
        }
        res.json();
    });

    app.post("/verification-code", async (req, res) => {
        if (!req.body.mail) {
            res.status(400).send("Mail must be provided");
            return
        }
        const code = util.generateVerificationCode();
        try {
            await db.insertCode(req.body.mail, code);
            await send(req.body.mail, code);
        } catch (e) {
            console.log(e);
            res.status(500).send(e.message ? e.message : e);
        }
        res.json();
    });

    app.listen(config.port, () => {
        console.log(`port listening on port ${config.port}...`)
    });
}

main().then(() => {
    console.log("base mail running...")
}).catch(e => {
    console.error(e)
})