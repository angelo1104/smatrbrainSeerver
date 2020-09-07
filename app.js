const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");

const db = knex({
    client: 'pg',
    version: '5.7',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'Keepoutjp1',
        database: 'smartbrain'
    }
});

const app = express();

app.use(cors())

app.use(bodyParser.json());

const database = {
    users: [
        {
            id: 123,
            name: "Sara",
            email: "sara@gmail.com",
            password: "pizza",
            entries: 0,
            joined: new Date(),
        },
        {
            id: 124,
            name: "Samantha",
            email: "sam@gmail.com",
            password: "burgers",
            entries: 0,
            joined: new Date(),
        },
    ]
}

app.get("/", function (req, res) {
    res.send(database.users);
})

app.post("/signin", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (email === database.users[0].email && password === database.users[0].password) {
        res.json(database.users[0])
    } else {
        res.status(400);
        res.json("there was an error.")
    }

});

app.post("/register", function (req, res) {
    const {name, email, password} = req.body;
    const hash = bcrypt.hashSync(password, 10);

    db.transaction(trx => {
        trx('login').insert({
            hash: hash,
            email: email
        }).returning('email')
            .then(loginEmail => {
                trx('users').insert({
                    email: loginEmail,
                    name: name,
                    joined: new Date()
                }).returning('*').then((user)=>{
                    res.json(user[0])
                })
            }).then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => {
        res.status(400).json('unable to register user.')
    })
})

app.get("/profile/:userid", function (req, res) {
    const {userid} = req.params;

    db.select('*').from('users').where({
        id: userid
    }).then(user => {
        if (user) {
            res.json(user[0]);
        } else {
            res.status(400);
            res.json("no such user")
        }
        console.log(user);
    }).catch(err => {
        res.status(400);
        res.json("there was an error")
    })

})

app.patch("/image", function (req, res) {
    const {id} = req.body;

    db('users')
        .returning('entries')
        .where('id', '=', id)
        .increment('entries')
        .then(entries => {
            console.log(entries);
            if (entries) {
                res.json(entries[0]);
            } else {
                res.status(400);
                res.json("no such user")
            }
        }).catch(err => {
        res.status(400);
        res.json("there was an error.")
    })
})


app.listen(3000, function (error) {
    console.log("Server running on Port 3000.")

    if (error) {
        console.log(error);
    }
})