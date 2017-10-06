var transmission = require("./transmission_connector");
var sql = require("./sql_connector.js");
sql.reset_status_all();
sql.reload();
var express = require('express');
var app = express();
var session = require('express-session');
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: true
});
app.use(urlencodedParser);
app.use(bodyParser.json());

function check_auth(req, res, next) {
  if (req.session.user_name) {
    next();
  } else {
    res.redirect('/');
  }
};
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/login.html');
});
app.post('/login', function(req, res) {
  if(req.body.action == "Login"){
     sql.validate_user(req.body.user.name,req.body.user.password,
      function(){
        req.session.user_name = req.body.user.name;
        res.redirect('/home');    
      },
      function(){
        res.redirect('/?bad_login=true')
      }
    );
  }
  else if (req.body.action == "Register"){
    res.redirect('/registration_page');
  }

});
app.get('/registration_page',function(req,res){
  res.sendFile(__dirname + '/public/register.html');
})
app.post('/register',function(req,res){
  if(req.body.action == "Submit"){
    sql.register_user(req.body.secret_code,req.body.user.name,req.body.user.email,req.body.user.password,req.body.user.phone,
      function(){res.redirect('/');},
      function(error){res.redirect('/registration_page?error='+error)});
  }
  else if(req.body.action == "Cancel"){
    res.redirect('/');
  }
});
app.get('/logout', function(req, res) {
  delete req.session.user_name;
  res.redirect('/')
});
app.get('/home', check_auth, function(req, res) {
  res.sendFile(__dirname + '/home.html');
});
app.get('/movies', check_auth, function(req, res) {
  res.sendFile(__dirname + '/movies.html');
});
app.get('/tv_shows', check_auth, function(req, res) {
  res.sendFile(__dirname + '/tv_shows.html');
});
setInterval(function() {
  transmission.reload_progress(io.sockets)
}, 2000);
io.on('connection', function(socket) {
  socket.on('media_req', function(data) {
    sql.send(socket, data);
    transmission.reload_progress(socket);
  });
  socket.on('download_req', function(data) {
    console.log(': RECEIVED REQUEST FOR \"' + data.uid + '\"');
    sql.set_status(data.uid, "working", io, data);
    sql.get_rows_from_uid(data.uid, function(arg) {
      transmission.upload(arg,data)
    });
  });
  socket.on('disconnect', function() {});
});
app.use(function(req,res){
  res.redirect('/home');
});

http.listen(80, '0.0.0.0', function() {
  console.log('Server started');
});