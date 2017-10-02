

var transmission = require("./transmission_connector");
var sql = require("./sql_connector.js");

sql.reset_status_all();

sql.reload();


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/movies', function(req, res){
  res.sendFile(__dirname + '/public/movies.html');
});

app.get('/tv_shows',function(req,res){
	res.sendFile(__dirname + '/public/tv_shows.html');
});

var connections = [];
setInterval(function(){transmission.reload_progress(io.sockets)},2000);

io.on('connection', function(socket){
	connections.push(socket);
  socket.on('media_req',function(data){
  	sql.send(socket,data);
  	transmission.reload_progress(socket);
  });
  socket.on('download_req',function(data){
	console.log(': RECEIVED REQUEST FOR \"'+data.uid+'\"');
  	sql.set_status(data.uid,"working",io,data);
  	sql.get_rows_from_uid(data.uid,function(arg){transmission.upload(arg)});
  });
  socket.on('disconnect',function(){
  });
  socket.on('login_req',function(data){
  	console.log("USERNAME: "+data.username+" PASSWORD:"+data.password);
  });
});

http.listen(8080, '0.0.0.0', function(){
  console.log('Server started');
});