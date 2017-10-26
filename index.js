
//***************CONFIG*****************//
var config_file = './config/config.json';
var config = require(config_file);

var media_types = {};

media_types["movies"] =config.Web.media.movies.allowed_types.split(',');

media_types["tv_shows"] = config.Web.media.tv_shows.allowed_types.split(',');

var MIN_MEDIA_SIZE = [];
MIN_MEDIA_SIZE["movies"] = config.Web.media.movies.allowed_sizes.min;
MIN_MEDIA_SIZE["tv_shows"] =  config.Web.media.tv_shows.allowed_sizes.min;

var MAX_MEDIA_SIZE = [];
MAX_MEDIA_SIZE["movies"] = config.Web.media.movies.allowed_sizes.max;
MAX_MEDIA_SIZE["tv_shows"] = config.Web.media.tv_shows.allowed_sizes.max;

var SSL_KEY_FILE = config.Web.ssl.key_file;
var SSL_CERT_FILE = config.Web.ssl.cert_file;

if(!SSL_KEY_FILE || SSL_KEY_FILE == "" ){
  console.log("Error: Could not find ssl_cert_file in config at " + config_file)
  process.exit();
}
if(!SSL_CERT_FILE || SSL_CERT_FILE == ""){
  console.log("Error: Could not find ssl_key_file in config at " + config_file)
  process.exit(); 
}

//**************************************//

var trans_conn = require("./transmission_connector");
var sql_conn = require("./sql_connector.js");
var media_modifiers = require('./media_modifiers.js');
var twilio = require('./twilio.js')

var express = require('express');
var app = express();
var session = require('express-session');
var fs = require('fs');

var server_port = 443;
var https = require('https');
var options = {
  key: fs.readFileSync(SSL_KEY_FILE),
  cert: fs.readFileSync(SSL_CERT_FILE)
}
var server = https.createServer(options,app);

var io = require('socket.io')(server);

var path = require('path');

// sql_conn.all_media("UPDATE media SET status = \"none\";",[],null);
// sql_conn.all_media("UPDATE media SET t_id = ?;",[false],null);

setInterval(function() {
  trans_conn.get_active(function(torrent){
    sql_conn.all_media("UPDATE media SET status = (?) WHERE t_id = (?);",[torrent.status,torrent.id],null);
    sql_conn.all_media("UPDATE media SET progress = (?) WHERE t_id = (?);",[(torrent.downloadedEver / torrent.sizeWhenDone * 100).toFixed(2),torrent.id],null);
  });
  sql_conn.all_media("SELECT * FROM media where status != \'none\';",[],function(results){
    trans_conn.active = results;
  });
}, 2000);

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

app.use(urlencodedParser);
app.use(bodyParser.json());

require('./http_redirect.js')(app);

require('./routes.js')(sql_conn,app);

io.on('connection', function(socket) {
  socket.on('media_req', function(data) {
    sql_conn.all_media("SELECT * FROM media WHERE title LIKE ? AND (type = \""+media_types[data.type].join("\" OR type = \"")+"\");",["%"+data.title+"%"],function(results){
      results = media_modifiers.size_between(MIN_MEDIA_SIZE[data.type],MAX_MEDIA_SIZE[data.type],results);
      results = results.slice(data.offset,data.offset+data.size);
      socket.emit('media_res',{media: results,active: trans_conn.active});
    });
  });
  socket.on('download_req', function(data) {
    sql_conn.all_media("SELECT * FROM media WHERE uid = (?) ",[data.uid], function(results) {
      if(results.length==1){
        console.log(data.username);
        trans_conn.upload(results[0],data.type,function(torrent){
          sql_conn.all_media("UPDATE media SET t_id = (?), username = (?) WHERE uid = (?);",[torrent.id,data.username,data.uid],null);
        });
      }else{
        console.log("Error: multiple media entries with uid of "+data.uid);
      }

    });
  });
  socket.on('all_progress_req',function(){
    socket.emit('all_progress_res',{active: trans_conn.active});  
  });
  socket.on('disconnect', function() {});
});

app.use(function(req,res){
  res.redirect('/home');
});

server.listen(server_port,function(){
  console.log('Server started on port: '+server_port);
})