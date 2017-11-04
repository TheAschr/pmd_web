
//***************CONFIG*****************//
var CONFIG_FILE = './config/config.json';
var CONFIG = require(CONFIG_FILE);

var config_handler = require('./config_handler.js');
if(CONFIG.INIT == "TRUE"){
  config_handler.load();
}else{
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
  var helper = require('./helper_functions.js');
  var twilio = require('./twilio.js')

  var express = require('express');
  var app = express();
  var session = require('express-session')({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  });

  var shared_session = require('express-socket.io-session');

  var fs = require('fs');

  var server_port = 443;
  var https = require('https');
  var options = {
    key: fs.readFileSync(SSL_KEY_FILE),
    cert: fs.readFileSync(SSL_CERT_FILE)
  }
  var server = https.createServer(options,app);

  var io = require('socket.io')(server);
  io.use(shared_session(session));

  var path = require('path');
  var sh = require("shelljs");
  var spawn = require('child_process').spawn;

  //sql_conn.all_media("UPDATE media SET status = \"none\";",[],null);
  // sql_conn.all_media("UPDATE media SET t_id = ?;",[false],null);

  setInterval(function() {
    trans_conn.get_active(function(torrent){
      sql_conn.all_media("SELECT * FROM media WHERE t_id = (?);",[torrent.id],function(results){
        if(results.length){
          if(results[0].status != trans_conn.status["SEED"] && 
            torrent.status == trans_conn.status["SEED"]){
             sql_conn.all_media("SELECT * FROM users WHERE username = (?);",[results[0].username],function(users){
              
              var url = results[0].link.toString();
              var url_split = url.split('/');
              var ext = ".torrent";
              var f_name = url_split[url_split.length - 1].substr(0,url_split[url_split.length -1].length - ext.length);
              helper.search_dir(sh.pwd()+"\\temp\\"+f_name,function(err,files){
                if(err){
                  console.log(err);
                }
                var rar_files = [];
                var unrar = sh.pwd()+'\\unrar\\UnRAR.exe';
                var out_dir = "";
                if(MEDIA_TYPES["movies"].includes(results[0].type)){
                  out_dir = CONFIG.TRANSMISSION.MOVIES_DIR;
                }else if(MEDIA_TYPES["tv_shows"].includes(results[0].type)){
                  out_dir = CONFIG.TRANSMISSION.TV_SHOWS_DIR;
                }
                for(var i = 0; i < files.length;i++){
                  if(files[i].substr(files[i].length - 4) == ".r00"){
                    console.log("Extracting to "+out_dir);
                    rar_files.push(files[i]);
                    const child = spawn(unrar,['e',files[i].replace(/\//g,'\\'),out_dir]);

                    child.stderr.on('data',(data)=>{
                      console.log(`child stderr:\n${data}`);
                    })

                  }
                }
               //console.log(rar_files);
              });

              if(users.length){
                if(users[0].phone && users[0].phone != ""){
                  twilio.send(results[0].title+" has finished downloading",users[0].phone);
                }
              }

             });
          }
           sql_conn.all_media("UPDATE media SET status = (?) WHERE t_id = (?);",[torrent.status,torrent.id],
            function(){
             sql_conn.all_media("UPDATE media SET progress = (?) WHERE t_id = (?);",[(torrent.downloadedEver / torrent.sizeWhenDone * 100).toFixed(2),torrent.id],null);
            });
        }
      });

    });
    sql_conn.all_media("SELECT * FROM media where status != \'none\';",[],function(results){
      trans_conn.active = results;
    });
  }, 2000);

  app.use(session);

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
        results = helper.get_with_sizes_between(MIN_MEDIA_SIZE[data.type],MAX_MEDIA_SIZE[data.type],results);
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
    socket.on('user_info_req',function(){
      sql_conn.all_media("SELECT username,quota,quota_limit,level FROM users WHERE username = (?)",[socket.handshake.session.user_name],function(results){
        if(results.length){
          var type = "";
          if(results[0].level == 1){
            type = "Admin";
          }
          else if(results[0].level == 2){
            type = "User";
          }
          socket.emit('user_info_res',{
            user_name : results[0].username,
            type: type,
            quota_str: results[0].quota || "0GB",
            quota_limit_str: results[0].quota_limit || "None",
            quota_current: helper.parse_data_size(results[0].quota),
            quota_limit: helper.parse_data_size(results[0].quota_limit)
          });      
        }
       })
    });
    socket.on('other_users_req',function(data){
      sql_conn.all_media("SELECT username,quota,quota_limit,phone,level FROM users WHERE username LIKE (?)","%"+data.user_name+"%",function(results){
          socket.emit('other_users_res',{users: results});      
      });
    })
    socket.on('config_req',function(){
      socket.emit('config_res',{config: CONFIG});
    })
    socket.on('config_update',function(data){

      var error_msgs = config_handler.validate_data(data.config);
      if(!error_msgs.length){
      data.config["INIT"] = "FALSE";
        fs.writeFileSync(CONFIG_FILE,JSON.stringify(data.config,null,"\t"),'utf8');
        CONFIG = data.config;         
        socket.emit('config_update_status',{success:true});
      }
      else{
        socket.emit('config_update_status',{success:false,error_msgs:error_msgs});
      }
    })
    socket.on('restart',function(){
      process.exit(0);
    })
    socket.on('disconnect', function() {});
  });

  app.use(function(req,res){
    res.redirect('/home');
  });

  server.listen(server_port,function(){
    console.log('Server started on port: '+server_port);
  })  
}

