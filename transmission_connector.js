var Transmission = require('transmission');

function check_config(config_value,def_value){
	if(config_value && config_value!=""){
		return config_value;
	}
	else{
		return def_value;
	}
}

//***************CONFIG*****************//
var CONFIG_LOCATION = './config/config.json';
var CONFIG_FILE = require(CONFIG_LOCATION);
var sh = require("shelljs");

var IPT_COOKIE = CONFIG_FILE.WEB.IPTCOOKIE;

var CONFIG = {};
CONFIG["TRANSMISSION_IP"] = CONFIG_FILE.TRANSMISSION.IP;
CONFIG["TRANSMISSION_PORT"] = CONFIG_FILE.TRANSMISSION.PORT;
CONFIG["TRANSMISSION_USERNAME"] = CONFIG_FILE.TRANSMISSION.USERNAME;
CONFIG["TRANSMISSION_PASSWORD"] = CONFIG_FILE.TRANSMISSION.PASSWORD;
CONFIG["TORRENTS_DIR"] = check_config(CONFIG_FILE.TRANSMISSION.TORRENTS_DIR,sh.pwd()+"\\torrent_files");
CONFIG["MOVIES_DIR"] = check_config(CONFIG_FILE.TRANSMISSION.MOVIES_DIR,sh.pwd()+"\\media_files");
CONFIG["TV_SHOWS_DIR"] = check_config(CONFIG_FILE.TRANSMISSION.TV_SHOWS_DIR,sh.pwd()+"\\media_files");

var transmission = null;

var fail = false;
for(key in CONFIG){
	if(!CONFIG[key] || CONFIG[key] == ""){
		console.log("Error: could not find transmission config for "+key);
		fail = true;
	}
}
if(fail){
	console.log("Transmission will be disabled");
}else{
	transmission = new Transmission({
		port: CONFIG["TRANSMISSION_PORT"],
		host: CONFIG["TRANSMISSION_IP"],
		username: CONFIG["TRANSMISSION_USERNAME"],
		password: CONFIG["TRANSMISSION_PASSWORD"]
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
		var down_dir = sh.pwd()+"\\temp";

		row.link = row.link.toString();
		var url_split = row.link.split('/');
		var f_name = url_split[url_split.length - 1];
		if (!fs.existsSync(CONFIG["TORRENTS_DIR"])) {
			fs.mkdirSync(CONFIG["TORRENTS_DIR"]);
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
			var torrent_file = CONFIG["TORRENTS_DIR"] + "\\" + f_name;
			var write_stream = fs.createWriteStream(torrent_file);
			response_stream.pipe(write_stream);
			response_stream.on('end', function() {
				write_stream.on('close', function() {
					if (!fs.existsSync(down_dir)) {
						fs.mkdirSync(down_dir);
					}
					transmission.addFile(torrent_file, {
						"download-dir": sh.pwd()+"\\temp"
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
			//	console.log(err);
			} else {

				for(var i = 0; i < results.torrents.length;i++){
					callback(results.torrents[i]);
				}	
				
			}
		});
	}
}