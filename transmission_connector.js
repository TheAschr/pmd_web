//***************CONFIG*****************//
var config = require('./config/transmission_config.json');
var sh = require("shelljs");
var IPT_COOKIE = config.Web.IPTCookie;
var TRANSMISSION_IP = config.Transmission.ip;
var TRANSMISSION_PORT = config.Transmission.port;
var TRANSMISSION_USERNAME = config.Transmission.username;
var TRANSMISSION_PASSWORD = config.Transmission.password;
var TORRENT_DIR;
if (config.Local.FileDir) {
	TORRENT_DIR = config.Local.FileDir;
} else {
	TORRENT_DIR = sh.pwd() + "\\torrent_files";
}
var MOVIES_DIR;
if (config.Local.Movies_dir) {
	MOVIES_DIR = config.Local.Movies_dir;
} else {
	MOVIES_DIR = sh.pwd() + "\\media_files";
}

var TV_SHOWS_DIR;
if (config.Local.TV_shows_dir) {
	TV_SHOWS_DIR = config.Local.TV_shows_dir;
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
var active_torrents = [];
module.exports = {
	upload: function(row,data) {
		var down_dir;
		if(data.type == "movies"){
			down_dir = MOVIES_DIR;
		}
		else if(data.type == "tv_shows"){
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
						var id = result.id;
						console.log(': DOWLOADING TORRENT WITH ID \"' + id + '\" at \"' + torrent_file + '\" to \"' + down_dir + '\"');
						active_torrents[id] = row.uid;
						transmission.get(function(err, arg) {
							if (err) {
								console.error(err);
							}
						});
					});
				});
			});
		});
	},
	reload_progress: function(socket) {
		transmission.active(function(err, result) {
			if (err) {
				console.log(err);
			} else {
				media_progress = [];
				for (var i = 0; i < result.torrents.length; i++) {
					console.log("Progress " + (result.torrents[i].downloadedEver / result.torrents[i].sizeWhenDone * 100) + "%");
					media_progress[i] = {
						uid: active_torrents[result.torrents[i].id],
						progress: (result.torrents[i].downloadedEver / result.torrents[i].sizeWhenDone * 100).toFixed(2)
					};
				}
				socket.emit('media_progress', {
					media_progress: media_progress
				});
			}
		});
	}
}