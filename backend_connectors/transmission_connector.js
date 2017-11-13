var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var cfg_hndlr = require(HOME+'\\backend_handlers\\config_handler.js');
var fio_hndlr = require(HOME+'\\backend_handlers\\fio_handler.js');

var Transmission = require('transmission');
var request = require('request');
var fs = require('fs');

module.exports = function(CONFIG){
	var module = {};

	module.t_status = {};
	module.t_status["STOPPED"] = 0;
	module.t_status["CHECK_WAIT"] = 1;
	module.t_status["CHECK"] = 2;
	module.t_status["DOWNLOAD_WAIT"] = 3;
	module.t_status["DOWNLOAD"] = 4;
	module.t_status["SEED_WAIT"] = 5;
	module.t_status["SEED"] = 6;
	module.t_status["ISOLATED"] = 7;

	if(CONFIG){
		var transmission =  new Transmission({
			port: CONFIG.TRANSMISSION.PORT,
			host: CONFIG.TRANSMISSION.IP,
			username: CONFIG.TRANSMISSION.USERNAME,
			password: CONFIG.TRANSMISSION.PASSWORD
		});

		module.active = [];

		module.upload = function(row,type,callback) {

			var down_dir = HOME+"\\temp";

			row.link = row.link.toString();
			var url_split = row.link.split('/');
			var f_name = url_split[url_split.length - 1];
			var torrent_files_dir = cfg_hndlr.check_config(CONFIG.TRANSMISSION.TORRENTS_DIR,HOME+"\\torrent_files");
			fio_hndlr.build_dir(torrent_files_dir);

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
				var torrent_file = cfg_hndlr.check_config(CONFIG.TRANSMISSION.TORRENTS_DIR,HOME+"\\torrent_files") + "\\" + f_name;
				var write_stream = fs.createWriteStream(torrent_file);
				response_stream.pipe(write_stream);
				response_stream.on('end', function() {
					write_stream.on('close', function() {
						if (!fs.existsSync(down_dir)) {
							fs.mkdirSync(down_dir);
						}
						transmission.addFile(torrent_file, {
							"download-dir": HOME+"\\temp"
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