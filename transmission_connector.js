//***************CONFIG*****************//
var config = require('./config/config.json');
var sh = require("shelljs");
var IPT_COOKIE = config.Web.IPTCookie;
var TRANSMISSION_IP = config.Transmission.ip;
var TRANSMISSION_PORT = config.Transmission.port;
var TRANSMISSION_USERNAME = config.Transmission.username;
var TRANSMISSION_PASSWORD = config.Transmission.password;
var TORRENT_DIR;
if (config.Transmission.File_dir) {
	TORRENT_DIR = config.Transmission.File_dir;
} else {
	TORRENT_DIR = sh.pwd() + "\\torrent_files";
}
var MOVIES_DIR;
if (config.Transmission.Movies_dir && config.Transmission.Movies_dir!="") {
	MOVIES_DIR = config.Transmission.Movies_dir;
} else {
	MOVIES_DIR = sh.pwd() + "\\media_files";
}

var TV_SHOWS_DIR;
if (config.Transmission.TV_shows_dir && config.Transmission.TV_shows_dir!="") {
	TV_SHOWS_DIR = config.Transmission.TV_shows_dir;
} else {
	TV_SHOWS_DIR = sh.pwd() + "\\media_files";
}

//**************************************//
var Transmission = require('transmission');
var request = require('request');
var fs = require('fs');

var transmission = new Transmission({
	port: TRANSMISSION_PORT,
	host: TRANSMISSION_IP,
	username: TRANSMISSION_USERNAME,
	password: TRANSMISSION_PASSWORD
});


module.exports = {

	active: [],
	status: function(){
		var t_status = {};
		t_status["STOPPED"] = 0;
		t_status["CHECK_WAIT"] = 1;
		t_status["CHECK"] = 2;
		t_status["DOWNLOAD_WAIT"] = 3;
		t_status["DOWNLOAD"] = 4;
		t_status["SEED_WAIT"] = 5;
		t_status["SEED"] = 6;
		t_status["ISOLATED"] = 7;
		return t_status;
	},
	upload: function(row,type,callback) {
		var down_dir;
		if(type == "movies"){
			down_dir = MOVIES_DIR;
		}
		else if(type == "tv_shows"){
			down_dir = TV_SHOWS_DIR;
		}

		row.link = row.link.toString();
		var url_split = row.link.split('/');
		var f_name = url_split[url_split.length - 1];
		if (!fs.existsSync(TORRENT_DIR)) {
			fs.mkdirSync(TORRENT_DIR);
		}
		var response_stream = request({
			url: 'http://iptorrents.com' + row.link,
			headers: {
				Cookie: IPT_COOKIE
			}
		});
		response_stream.on('error', function(err) {
			console.log(err);
		});
		response_stream.on('response', function(response) {
			var torrent_file = TORRENT_DIR + "\\" + f_name;
			var write_stream = fs.createWriteStream(torrent_file);
			response_stream.pipe(write_stream);
			response_stream.on('end', function() {
				write_stream.on('close', function() {
					if (!fs.existsSync(down_dir)) {
						fs.mkdirSync(down_dir);
					}
					transmission.addFile(torrent_file, {
						"download-dir": down_dir
					}, function(err, result) {
						if (err) {
							return console.log(err);
						}
						console.log(': DOWLOADING TORRENT WITH ID \"' + result.id + '\" at \"' + torrent_file + '\" to \"' + down_dir + '\"');

						module.exports.active.push(result);
						callback(result);
					});
				});
			});
		});
	},
	get_active: function(callback) {
		transmission.active(function(err, results) {
			if (err) {
				console.log(err);
			} else {

				for(var i = 0; i < results.torrents.length;i++){
					callback(results.torrents[i]);
				}	
				
			}
		});
	}
}