var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var cfg_hndlr = require(HOME+'\\backend_handlers\\config_handler.js');

var sh = require("shelljs");
var Transmission = require('transmission');
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

module.exports = function(CONFIG){
	var module = {};

	if(CONFIG){
		var transmission =  new Transmission({
			port: CONFIG.TRANSMISSION.PORT,
			host: CONFIG.TRANSMISSION.IP,
			username: CONFIG.TRANSMISSION.USERNAME,
			password: CONFIG.TRANSMISSION.PASSWORD
		});

		module.active = [];
		module.status = t_status;

		module.upload = function(row,type,callback) {
			if(!transmission){
				console.log("Transmission is disabled due to misconfigured settings");
				return;
			}
			var down_dir = sh.pwd()+"\\temp";

			row.link = row.link.toString();
			var url_split = row.link.split('/');
			var f_name = url_split[url_split.length - 1];
			if (!fs.existsSync(cfg_hndlr.check_config(CONFIG.TRANSMISSION.TORRENTS_DIR,sh.pwd()+"\\torrent_files"))) {
				fs.mkdirSync(cfg_hndlr.check_config(CONFIG.TRANSMISSION.TORRENTS_DIR,sh.pwd()+"\\torrent_files"));
			}
			var response_stream = request({
				url: 'http://iptorrents.com' + row.link,
				headers: {
					Cookie: CONFIG.WEB.IPTCOOKIE
				}
			});
			response_stream.on('error', function(err) {
				console.log(err);
			});
			response_stream.on('response', function(response) {
				var torrent_file = cfg_hndlr.check_config(CONFIG.TRANSMISSION.TORRENTS_DIR,sh.pwd()+"\\torrent_files") + "\\" + f_name;
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
							callback(result);
						});
					});
				});
			});
		}

		module.get_active = function(callback) {
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
	return module;
}