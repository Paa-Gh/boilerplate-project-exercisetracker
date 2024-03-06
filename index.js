const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const mySecret = process.env['EXE_URI']
mongoose.connect(mySecret);

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: Date, required: true}
  }]
})
const User = mongoose.model('User', userSchema);

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



app.post('/api/users', (req, res) => {
  const username = req.body.username;
  User.findOne({username: username}).then(data => {
    if(data){
      res.json({username: data.username, _id: data._id})
    }else {
      const newUser = new User({username: username});
      newUser.save().then(data => {
        res.json({username: data.username, _id: data._id})
      })
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find().then(data => {
    res.json(data)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  User.findById(id).then(data => {
    if(!data){
      res.json({error: "User not found"})
    }else{
      const newExercise = {
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date()
      }
      data.log.push(newExercise);
      data.save().then(item =>{
        res.json({
          username: item.username,
          description: item.log[item.log.length - 1].description,
          duration: item.log[item.log.length - 1].duration,
          date: item.log[item.log.length - 1].date.toDateString(),
          _id: item._id
        })
      })
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) =>{
  const id = req.params._id;
  User.findById(id).then(data =>{
    if(!data){
      res.json({error: "User not found"})
    }else{
      const {from, to, limit} = req.query;
      let log = data.log.slice();
      if(from){
        log = log.filter(item => item.date >= new Date(from))
      }
      if(to){
        log = log.filter(item => item.date <= new Date(to))
      }
      if(limit){
        log = log.slice(0, limit)
      }
      res.json({
        username: data.username,
        count: data.log.length,
        _id: data._id,
        log: log
      })
    }
  })
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
