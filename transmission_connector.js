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

function Torrent(t_id,sql_data){
	this.t_id = t_id;

	this.title = sql_data.title;
	this.size = sql_data.size;
	this.uid = sql_data.uid;

	this.progress = 0;
	this.status = "";

}

function Torrents(){
	this.torrents = [];
	this.add = function(torrent){
		if(!this.get_by_t_id(torrent.t_id)){
			this.torrents.push(torrent);
		}else{
			console.log("Another torrent with the same uid already exists not adding to active");
		}
	}
	this.get_all = function(){
		return this.torrents;
	}
	this.get_by_t_id = function(t_id){
		for(var i = 0; i < this.torrents.length;i++){
			if(this.torrents[i].t_id == t_id){
				return this.torrents[i];
			}
		}
		console.log("Could not find active torrent with t_id == "+t_id);
		return null;
	}
}


module.exports = {

	active_torrents: new Torrents(),
	finished_torrents: new Torrents(),

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
						var torrent = new Torrent(result.id,row);
						module.exports.active_torrents.add(torrent);
						callback(torrent);
					});
				});
			});
		});
	},
	set_progress_all: function() {
		transmission.active(function(err, results) {
			if (err) {
				console.log(err);
			} else {
				for(var i = 0; i < results.torrents.length;i++){
					var torrent = module.exports.active_torrents.get_by_t_id(results.torrents[i].id);
					if(torrent){
						torrent.progress = (results.torrents[i].downloadedEver / results.torrents[i].sizeWhenDone * 100).toFixed(2);
						torrent.status = results.torrents[i].status;
					}
				}
			}
		});
	}
}