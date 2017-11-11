var path = require('path');
var HOME = path.resolve(__dirname);

var cfg_hndlr = require(HOME+'\\backend_handlers\\config_handler.js');

const CONFIG_FILE = HOME+'\\config\\config.json';
const CONFIG = require(CONFIG_FILE);

if (CONFIG.INIT == "TRUE") {
    config_hndlr.load(CONFIG_FILE);
} else {
    const MEDIA_TYPES = {};

    MEDIA_TYPES["movies"] = CONFIG.WEB.MEDIA.MOVIES.ALLOWED_TYPES.split(',');

    MEDIA_TYPES["tv_shows"] = CONFIG.WEB.MEDIA.TV_SHOWS.ALLOWED_TYPES.split(',');

    var MIN_MEDIA_SIZE = [];
    MIN_MEDIA_SIZE["movies"] = CONFIG.WEB.MEDIA.MOVIES.ALLOWED_SIZES.MIN;
    MIN_MEDIA_SIZE["tv_shows"] = CONFIG.WEB.MEDIA.TV_SHOWS.ALLOWED_SIZES.MIN;

    var MAX_MEDIA_SIZE = [];
    MAX_MEDIA_SIZE["movies"] = CONFIG.WEB.MEDIA.MOVIES.ALLOWED_SIZES.MAX;
    MAX_MEDIA_SIZE["tv_shows"] = CONFIG.WEB.MEDIA.TV_SHOWS.ALLOWED_SIZES.MAX;

    if (!CONFIG.WEB.SSL.KEY_FILE || CONFIG.WEB.SSL.KEY_FILE == "") {
        console.log("Error: Could not find SSL_CERT_FILE value in config at " + CONFIG_FILE)
        process.exit();
    }
    if (!CONFIG.WEB.SSL.CERT_FILE || CONFIG.WEB.SSL.CERT_FILE == "") {
        console.log("Error: Could not find SSL_KEY_FILE value in config at " + CONFIG_FILE)
        process.exit();
    }

    var trans_conn = require(HOME+"\\backend_connectors\\transmission_connector")(CONFIG);
    var sql_conn = require(HOME+"\\backend_connectors\\sql_connector.js")(CONFIG);
    var plex_conn = require(HOME+"\\backend_connectors\\plex_connector.js")(CONFIG);
    var twilio_conn = require(HOME+'\\backend_connectors\\twilio_connector.js')(CONFIG);

    var extraction_hndlr = require(HOME+"\\backend_handlers\\extraction_handler.js")(CONFIG);
    var data_hndlr = require(HOME+'\\backend_handlers\\data_size_handler.js');

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
    var http = require('http');
    var options = {
        key: fs.readFileSync(CONFIG.WEB.SSL.KEY_FILE),
        cert: fs.readFileSync(CONFIG.WEB.SSL.CERT_FILE)
    }
    var server = https.createServer(options, app);

    var io = require('socket.io')(server);
    io.use(shared_session(session));

    var path = require('path');

    setInterval(function() {
        trans_conn.get_active(function(torrent) {
            sql_conn.all("SELECT * FROM media WHERE t_id = (?);", [torrent.id], function(results) {
                if (results.length) {
                    if (results[0].status != trans_conn.status["SEED"] &&
                        torrent.status == trans_conn.status["SEED"]) {
                        sql_conn.all("SELECT * FROM users WHERE username = (?);", [results[0].username], function(users) {

                            var url_split = results[0].link.toString().split('/');
                            var d_name = url_split[url_split.length - 1].substr(0, url_split[url_split.length - 1].length - ".torrent".length);

                            var from_dir = sh.pwd() + "\\temp\\" + d_name;

                            var out_dir = "";
                            if (MEDIA_TYPES["movies"].includes(results[0].type)) {
                                out_dir = CONFIG.TRANSMISSION.MOVIES_DIR;
                            } else if (MEDIA_TYPES["tv_shows"].includes(results[0].type)) {
                                out_dir = CONFIG.TRANSMISSION.TV_SHOWS_DIR;
                            }
                            var to_dir = out_dir + '\\' + d_name;

                            extraction_hndlr.load(from_dir,to_dir);

                            sql_conn.all("UPDATE users SET quota = (?) WHERE id = (?);", [data_hndlr.bytes_to_string(torrent.sizeWhenDone+users[0].quota), users[0].id],null);
                            if (users[0] && users[0].phone && users[0].phone != "") {
                                twilio_conn.send(results[0].title + " has finished downloading", users[0].phone);
                            }
                        
                            plex_conn.scan_library();

                        });
                    }
                    sql_conn.all("UPDATE media SET status = (?) WHERE t_id = (?);", [torrent.status, torrent.id],
                        function() {
                            sql_conn.all("UPDATE media SET progress = (?) WHERE t_id = (?);", [(torrent.downloadedEver / torrent.sizeWhenDone * 100).toFixed(2), torrent.id], null);
                        }
                    );
                }
            });

        });
        sql_conn.all("SELECT * FROM media where status != \'none\';", [], function(results) {
            trans_conn.active = results;
        });
    }, 2000);

    app.use(session);

    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'data\\pics')));

    var bodyParser = require('body-parser');
    var urlencodedParser = bodyParser.urlencoded({
        extended: true
    });

    app.use(urlencodedParser);
    app.use(bodyParser.json());

    require(HOME+'/http_redirect.js')(app);

    require(HOME+'/routes.js')(sql_conn, app);

    io.on('connection', function(socket) {

        socket.on('media_req', function(data) {
            sql_conn.all("SELECT * FROM media WHERE title LIKE ? AND (type = \"" + MEDIA_TYPES[data.type].join("\" OR type = \"") + "\");", ["%" + data.title + "%"], function(results) {
                results = data_hndlr.get_with_sizes_between(MIN_MEDIA_SIZE[data.type], MAX_MEDIA_SIZE[data.type], results);
                results = results.slice(data.offset, data.offset + data.size);
               socket.emit('media_res', {
                    media: results,
                    active: trans_conn.active
                });
            });
        });
        socket.on('download_req', function(data) {
            sql_conn.all("SELECT * FROM media WHERE uid = (?) ", [data.uid], function(results) {
                if (results.length == 1) {
                    trans_conn.upload(results[0], data.type, function(torrent) {
                        sql_conn.all("UPDATE media SET t_id = (?), username = (?) WHERE uid = (?);", [torrent.id, socket.handshake.session.user_name, data.uid], null);
                    });
                } else {
                    console.log("Error: multiple media entries with uid of " + data.uid);
                }

            });
        });
        socket.on('all_progress_req', function() {
            socket.emit('all_progress_res', {
                active: trans_conn.active
            });
        });
        socket.on('user_info_req', function() {
            sql_conn.all("SELECT username,quota,quota_limit,level FROM users WHERE username = (?)", [socket.handshake.session.user_name], function(results) {
                if (results.length) {
                    var type = "";
                    if (results[0].level == 1) {
                        type = "Admin";
                    } else if (results[0].level == 2) {
                        type = "User";
                    }
                    socket.emit('user_info_res', {
                        user_name: results[0].username,
                        type: type,
                        quota: results[0].quota || "0GB",
                        quota_limit: results[0].quota_limit || CONFIG.TRANSMISSION.GLOBAL_QUOTA || "None",
                    });
                }
            })
        });
        socket.on('other_users_req', function(data) {
            sql_conn.all("SELECT username,quota,quota_limit,phone,level FROM users WHERE username LIKE (?)", "%" + data.user_name + "%", function(results) {
                socket.emit('other_users_res', {
                    users: results
                });
            });
        })
        socket.on('config_req', function() {
            socket.emit('config_res', {
                config: CONFIG
            });
        })
        socket.on('config_update', function(data) {

            var error_msgs = config_hndlr.validate_data(data.config);
            if (!error_msgs.length) {
                data.config["INIT"] = "FALSE";
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(data.config, null, "\t"), 'utf8');
                CONFIG = data.config;
                socket.emit('config_update_status', {
                    success: true
                });
            } else {
                socket.emit('config_update_status', {
                    success: false,
                    error_msgs: error_msgs
                });
            }
        })
        socket.on('restart', function() {
            process.exit(0);
        })
        socket.on('disconnect', function() {});
    });

    app.use(function(req, res) {
        res.redirect('/home');
    });

    server.listen(server_port, function() {
        console.log('Server started on port: ' + server_port);
    })
}