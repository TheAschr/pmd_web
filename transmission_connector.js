var Transmission = require('transmission');

//***************CONFIG*****************//
var config = require('./config/config.json');
var sh = require("shelljs");

function check_config(config,def_value){
	if(config && config!=""){
		return config;
	}
	else{
		return def_value;
	}
}

var IPT_COOKIE = config.Web.IPTCookie;
var transmission_config = {};
transmission_config["TRANSMISSION_IP"] = config.Transmission.ip;
transmission_config["TRANSMISSION_PORT"] = config.Transmission.port;
transmission_config["TRANSMISSION_USERNAME"] = config.Transmission.username;
transmission_config["TRANSMISSION_PASSWORD"] = config.Transmission.password;
transmission_config["TORRENT_DIR"] = check_config(config.Transmission.Torrents_dir,sh.pwd()+"\\torrent_files");
transmission_config["MOVIES_DIR"] = check_config(config.Transmission.Movies_dir,sh.pwd()+"\\media_files");
transmission_config["TV_SHOWS_DIR"] = check_config(config.Transmission.TV_shows_dir,sh.pwd()+"\\media_files");

var transmission = null;

var fail = false;
for(key in transmission_config){
	if(!transmission_config[key] || transmission_config[key] == ""){
		console.log("Error: could not find transmission config for "+key);
		fail = true;
	}
}
if(fail){
	console.log("Transmission will be disabled");
}else{
	transmission = new Transmission({
		port: transmission_config["TRANSMISSION_PORT"],
		host: transmission_config["TRANSMISSION_IP"],
		username: transmission_config["TRANSMISSION_USERNAME"],
		password: transmission_config["TRANSMISSION_PASSWORD"]
	});
}

//**************************************//
var request = require('request');
var fs = require('fs');


var t_status = {};
t_status["STOPPED"] = 0;
t_status["CHECK_WAIT"] = 1;
t_status["CHECK"] = 2;
t_status["DOWNLOAD_WAIT"] = 3;
t_status["DOWNLOAD"] = 4;
t_status["SEED_WAIT"] = 5;
t_status["SEED"] = 6;
t_status["ISOLATED"] = 7;

module.exports = {

	active: [],
	status: t_status,
	upload: function(row,type,callback) {
		if(!transmission){
			console.log("Transmission is disabled due to misconfigured settings");
			return;
		}
		var down_dir;
		if(type == "movies"){
			down_dir = transmission_config["MOVIES_DIR"];
		}
		else if(type == "tv_shows"){
			down_dir = transmission_config["TV_SHOWS_DIR"];
		}

		row.link = row.link.toString();
		var url_split = row.link.split('/');
		var f_name = url_split[url_split.length - 1];
		if (!fs.existsSync(transmission_config["TORRENT_DIR"])) {
			fs.mkdirSync(transmission_config["TORRENT_DIR"]);
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
			var torrent_file = transmission_config["TORRENT_DIR"] + "\\" + f_name;
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
		if(!transmission){
			console.log("Transmission is disabled due to misconfigured settings");
			return;
		}
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