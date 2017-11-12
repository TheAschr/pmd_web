var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var fio_hndlr = require(HOME+'\\backend_handlers\\fio_handler.js');

var sh = require("shelljs");
var fs = require("fs");
var spawn = require('child_process').spawn;

var unrar = HOME+"\\unrar\\UnRAR.exe";

module.exports = function(CONFIG){
	var module = {};

	module.extract_file = function(file,to_dir){
		file = file.replace(/\//g, '\\');
		console.log("Extracting "+file+" to "+to_dir);
		const child = spawn(unrar, ['e','-o+', file, to_dir+'\\']);
		child.stderr.on('data', (data) => {
            console.log(`child stderr:\n${data}`);            
            //this needs to be fixed as it 0 isn't returned to extract function
            return 0;
        });
        return 1;
	}

	module.extract_or_copy = function(from_dir,to_dir){
		if (fs.lstatSync(from_dir).isDirectory()) {
			fio_hndlr.find_files_with_ext(from_dir,'.r00',function(files){
				if(!files.length){
        			console.log("Copying folder from "+from_dir+" to "+to_dir);
					return fio_hndlr.build_dir(to_dir) && fio_hndlr.copy_dir(from_dir, to_dir);
				}else{
					for(var i = 0; i < files.length;i++){
						if(!module.extract_file(files[i],to_dir)){
							return 0;
						}
					}					
				}
			});
		}else {
			if(!fio_hndlr.build_dir(to_dir)){
				return 0;
			}
			var from_file = from_dir;
			var to_file = to_dir+'\\'+from_file.replace(/^.*[\\\/]/, '');
        	console.log("Copying file from "+from_file+" to "+to_file);
			fio_hndlr.copy_file(from_file, to_file, function(err) {
	            if (err) {
	                console.log(err);
	                return 0;
	            }
	        });
	        return fs.existsSync(to_file) && !fs.lstatSync(to_file).isDirectory();
        }
	}

	return module;
}