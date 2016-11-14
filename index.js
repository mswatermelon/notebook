'use strict';

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const rtAPI = express.Router();

let url = 'mongodb://localhost/notebook';

let printData = (err, result) => {
  if (err) console.log('Не удалось получить документы из коллекции:', err);
  else if (result.length) {
    console.log('Документы:');
    console.log(result);
  }
  else console.log('Нет документов');
};

let insertDB = (db) => {
  let notebook = db.collection('notebook'),
      data1 = {name: ['Maslov', 'Yakun', 'Vladlenovich'], number: '4564545'},
      data2 = {name: ['Gorbunov', 'Bogdan', 'Rostislavovich'], number: '3252355'},
      data3 = {name: ['Isaeva', 'Larisa', 'Vyacheslavovna'], number: '2345465'},
      data4 = {name: ['Tretyakova', 'Margarita', 'Kimovna'], number: '3523535'};

  notebook.insert([data1, data2, data3, data4], (err, result) => {
    if (err) console.log('Не удалось добавить документы:', err);
    else {
      notebook.find().toArray(printData);
    }
    db.close();
  });
};

let connectDB = (callback) => {
  MongoClient.connect(url, (err, db) => {
    if(err) console.log('Невозможно подключиться к базе:', err);
    else {
      callback(db);
    }
  });
};

connectDB(insertDB);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended": true}));

// Получение всех контактов и поиск по номеру телефона или ФИО
rtAPI.get("/contacts", function(req, res) {
  let first = req.query.first || '',
      middle = req.query.middle || '',
      last = req.query.last || '',
      phone = req.query.phone || '';

  if (first || middle || last || phone){
    connectDB((db) => {
      let notebook = db.collection('notebook'),
          contact = (first || middle || last)?
            {name: [first, middle, last]}:
            {phone: phone};

      notebook.find(contact).toArray((err, result) => {
        if (err) res.status(500).send('Не удалось получить контакты:' + err);
        else if (result.length) {
          res.json(result);
        }
        else {
          res.status(401).send("Нет контактов");
        }
      });
    });
  }
  else{
    connectDB((db) => {
      let notebook = db.collection('notebook');

      notebook.find().toArray((err, result) => {
        if (err) res.status(500).send('Не удалось получить контакты:' + err);
        else if (result.length) {
          res.json(result);
        }
        else {
          res.status(401).send("Нет контактов");
        }
      });
    });
  }
});

// Добавление нового контакта
rtAPI.post("/contacts", function(req, res) {
  let first = req.body.first || '',
      middle = req.body.middle || '',
      last = req.body.last || '',
      phone = req.body.phone || '',
      record;

  connectDB((db) => {
    let notebook = db.collection('notebook'),
        contact = {name: [first, middle, last], phone: phone};

    notebook.find(contact)
    .toArray((err, result) => {
      if (err) res.status(500).send('Не удалось создать контакт:' + err);
      else if (result.length) {
        res.status(401).send("Контакт уже существует");
      }
      else {
        notebook.insert(contact, (err, result) => {
          if (err) res.status(500).send('Не удалось создать контакт:' + err);
          else {
            res.json(result.ops);
          }
        });
      }
    });
  });
});

//Редактирование контакта
rtAPI.put("/contacts", function(req, res) {
  let first = req.body.first || '',
      middle = req.body.middle || '',
      last = req.body.last || '',
      phone = req.body.phone || '';

  connectDB((db) => {
    let notebook = db.collection('notebook'),
        contact = {name: [first, middle, last], phone: phone};

    notebook.find(contact)
    .toArray((err, result) => {
      if (err) res.status(500).send('Не удалось обновить контакт:' + err);
      else if (result.length) {
        res.status(401).send("Контакт уже существует");
      }
      else {
        notebook.update({name: contact.name}, {$set: {phone: phone}},
        (err, result) => {
          if (err) res.status(500).send('Не удалось обновить контакт:' + err);
          else {
            res.json(result);
          }
        });
      }
    });
  });
});

// Очищение записной книжки
rtAPI.delete("/contacts", function(req, res) {
  connectDB((db) => {
    let notebook = db.collection('notebook');

    notebook.remove();
  });
});

app.use("/", rtAPI);
app.listen(1337);
