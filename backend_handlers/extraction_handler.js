var path = require('path');
var HOME = path.resolve(__dirname+'\\..\\');

var fio_hndlr = require(HOME+'\\backend_handlers\\fio_handler.js');

var sh = require("shelljs");
var fs = require("fs");
var spawn = require('child_process').spawn;

var unrar = ".\\backend_handlers\\unrar\\UnRAR.exe";

module.exports = function(CONFIG){
	var module = {};

	module.check_dir = function(dir){
		if(fs.existsSync(dir)){
			if(!fs.lstatSync(dir).isDirectory()){
	   			fs.unlink(dir);				
			}
	   	}else{
          console.log("Could not find directory at "+dir+". Building a new one");
          fs.mkdirSync(dir);
          if(!fs.existsSync(dir)){ 
            console.log("Could not make directory at "+dir);
          } 
        }		
	}

	module.copy_file = function(from_file,to_dir){
		module.check_dir(to_dir);
		var to_file = to_dir+'\\'+from_file.replace(/^.*[\\\/]/, '');
        console.log("Copying file from "+from_file+" to "+to_file);
        fio_hndlr.copy_file(from_file, to_file, function(err) {
            if (err) {
                console.log(err);
            }
        })
	}

	module.find_files_with_ext = function(dir,ext,callback){
        fio_hndlr.search_dir(dir, function(err, files) {
            if (err) {
                console.log(err);
                return;
            }
            var results = [];
            for(i = 0;i < files.length;i++){
            	if(files[i].substr(files[i].length - 4) == ext){
            		results.push(files[i]);
            	}
            }
            if(callback && typeof(callback)=='function'){
	            callback(results);
            }
        });
	}

	module.extract = function(file,to_dir){
		console.log("Extracting "+file.replace(/\//g, '\\')+" to "+to_dir);
		const child = spawn(unrar, ['e','-o+', file.replace(/\//g, '\\'), to_dir+'\\']);
		child.stderr.on('data', (data) => {
            console.log(`child stderr:\n${data}`);
        })
	}



	module.copy_dir = function(from_dir,to_dir){
        console.log("Copying folder from "+from_dir+" to "+to_dir);
        module.check_dir(to_dir);
        fio_hndlr.copy_dir(from_dir, to_dir);
	}

	module.load = function(from_dir,to_dir){
		console.log(from_dir,to_dir);
		if (fs.lstatSync(from_dir).isDirectory()) {
			module.find_files_with_ext(from_dir,'.r00',function(files){
				for(var i = 0; i < files.length;i++){
					module.extract(files[i],to_dir);
				}
				if(!files.length){
					module.copy_dir(from_dir,to_dir);
				}
			});
		}else {
        	module.copy_file(from_dir,to_dir);
        }
	}

	return module;
}