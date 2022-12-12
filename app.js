//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-sporkygg:Test123@cluster0.eux002n.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  itemName: String
});

const Item = mongoose.model("Item", itemsSchema);

const cook = new Item({
  itemName: 'Cook'
});
const eat = new Item({
  itemName: 'Eat'
});
const clean = new Item({
  itemName: 'Clean'
});

const defaultItems = [cook, eat, clean];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {


  async function f() {
    try {
      const currentItems = await Item.find({});
      if (currentItems.length === 0) {
        Item.insertMany(defaultItems, err => {
          if (err) {
            console.log(err);
          } else {
            console.log('Success!!!');
          }
        });
        res.redirect('/');
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: currentItems
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
  f();



});

app.post("/", function(req, res) {

  const itemAdd = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    itemName: itemAdd
  });

  if (listName === 'Today') {
    newItem.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (err,foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/' + listName);
    })
  }

});

app.post('/delete', (req,res)=> {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    async function d() {
      try{
        await Item.deleteOne({_id: checkedItemId});
        res.redirect('/');
      } catch (err) {
        console.log(err);
      }
    }
    d();
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {items: {_id: checkedItemId}}
    }, (err, foundList) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    })
  }
})

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  async function f() {
    try {
      const found = await List.find({name: customListName}).exec();
      if (found.length === 0) {
        // Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log(`Added ${customListName} to the collection.`);
        res.redirect('/'+customListName);
      } else {
        // Show an existing list
        res.render('list', {listTitle: found[0].name, newListItems: found[0].items});
      }
    } catch (err) {
      console.log('There was a problem.');
    }
  }
  f();

});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
