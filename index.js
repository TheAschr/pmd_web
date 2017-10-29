
//***************CONFIG*****************//
var CONFIG_FILE = './config/config.json';
var CONFIG = require(CONFIG_FILE);

var MEDIA_TYPES = {};

MEDIA_TYPES["movies"] = CONFIG.WEB.MEDIA.MOVIES.ALLOWED_TYPES.split(',');

MEDIA_TYPES["tv_shows"] = CONFIG.WEB.MEDIA.TV_SHOWS.ALLOWED_TYPES.split(',');

var MIN_MEDIA_SIZE = [];
MIN_MEDIA_SIZE["movies"] = CONFIG.WEB.MEDIA.MOVIES.ALLOWED_SIZES.MIN;
MIN_MEDIA_SIZE["tv_shows"] =  CONFIG.WEB.MEDIA.TV_SHOWS.ALLOWED_SIZES.MIN;

var MAX_MEDIA_SIZE = [];
MAX_MEDIA_SIZE["movies"] = CONFIG.WEB.MEDIA.MOVIES.ALLOWED_SIZES.MAX;
MAX_MEDIA_SIZE["tv_shows"] = CONFIG.WEB.MEDIA.TV_SHOWS.ALLOWED_SIZES.MAX;

var SSL_KEY_FILE = CONFIG.WEB.SSL.KEY_FILE;
var SSL_CERT_FILE = CONFIG.WEB.SSL.CERT_FILE;

if(!SSL_KEY_FILE || SSL_KEY_FILE == "" ){
  console.log("Error: Could not find SSL_CERT_FILE value in config at " + CONFIG_FILE)
  process.exit();
}
if(!SSL_CERT_FILE || SSL_CERT_FILE == ""){
  console.log("Error: Could not find SSL_KEY_FILE value in config at " + CONFIG_FILE)
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

//sql_conn.all_media("UPDATE media SET status = \"none\";",[],null);
// sql_conn.all_media("UPDATE media SET t_id = ?;",[false],null);

setInterval(function() {
  trans_conn.get_active(function(torrent){
    sql_conn.all_media("SELECT * FROM media WHERE t_id = (?);",[torrent.id],function(results){
      if(results.length){
        if(results[0].status != trans_conn.status["SEED"] && 
          torrent.status == trans_conn.status["SEED"]){
           sql_conn.all_media("SELECT * FROM users WHERE username = (?);",[results[0].username],function(users){
            if(users.length){
              if(users[0].phone && users[0].phone != ""){
                twilio.send(results[0].title+" has finished downloading",users[0].phone);
              }
            }

           });
        }
         sql_conn.all_media("UPDATE media SET status = (?) WHERE t_id = (?);",[torrent.status,torrent.id],null);
         sql_conn.all_media("UPDATE media SET progress = (?) WHERE t_id = (?);",[(torrent.downloadedEver / torrent.sizeWhenDone * 100).toFixed(2),torrent.id],null);
      }
      
    
    });

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
    sql_conn.all_media("SELECT * FROM media WHERE title LIKE ? AND (type = \""+MEDIA_TYPES[data.type].join("\" OR type = \"")+"\");",["%"+data.title+"%"],function(results){
      results = media_modifiers.size_between(MIN_MEDIA_SIZE[data.type],MAX_MEDIA_SIZE[data.type],results);
      results = results.slice(data.offset,data.offset+data.size);
      socket.emit('media_res',{media: results,active: trans_conn.active});
    });
  });
  socket.on('download_req', function(data) {
    sql_conn.all_media("SELECT * FROM media WHERE uid = (?) ",[data.uid], function(results) {
      if(results.length==1){
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