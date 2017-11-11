var fs = require('fs');


module.exports = {
	check_config: function(config_value,def_value){
		if(config_value && config_value!=""){
			return config_value;
		}
		else{
			return def_value;
		}
	},
	parse_phone_num: function(phone_num){
		if(phone_num && phone_num != ""){
			phone_num = phone_num.match(/(\+)?[0-9]/g);
			if(phone_num.length == 0){
				return null;
			}
			else if(phone_num[0].length == 2 && phone_num.length == 11){
				return phone_num.join();
			}
			else if(phone_num[0].length == 1 && phone_num.length == 10){
				return "+1"+ phone_num.join("");
			}
			else{
				return null;
			}	
		}
		return "";
	},
	get_with_sizes_between : function(str_min,str_max,media){
		var min = module.exports.bytes_string_to_int(module.exports.string_to_bytes(str_min));
		if(!min){
			min = 0;
		}
		var max = module.exports.bytes_string_to_int(module.exports.string_to_bytes(str_max));
		if(!max){
			max = Number.MAX_SAFE_INTEGER;
		}
		var results = [];
		for(i = 0; i < media.length; i++){
			var media_size = module.exports.bytes_string_to_int(module.exports.string_to_bytes(String(media[i].size)));
			if(media_size >= +min && media_size <= +max){
				results.push(media[i]);
			}	
		}
		return results;
	},
	data_sizes : ["B","KB","MB","GB","TB"],
	bytes_string_to_int: function(bytes_string){
		if(!bytes_string || typeof(bytes_string)!='string' || !bytes_string.length){
			return null;
		}
		bytes_string = bytes_string.toUpperCase();
		bytes_string = bytes_string.replace(/\s/g, '');
		if(bytes_string[bytes_string.length-1]!='B' || /[^\.\d]/.test(bytes_string.substring(0,bytes_string.length-1))){
			console.log("Not bytes string");
			return null;
		}
		bytes_string.length = bytes_string.length - 1;
		return parseInt(bytes_string);
	},
	bytes_to_string : function(size) {
		if(!size || typeof(size)=='string'){
			return null;
		}
		var multiplier;
		for(multiplier = 0; multiplier < module.exports.data_sizes.length && Math.pow(1000,multiplier) <= size;multiplier++){}
		return ""+size/Math.pow(1000,multiplier-1)+module.exports.data_sizes[multiplier-1];
	},
	string_to_bytes : function(size_str){
		if(!size_str ||typeof(size_str)!='string' || !size_str.length){
			return null;
		}
		size_str = size_str.toUpperCase();
		size_str = size_str.replace(/\s/g, '');
		var multiplier;
		var possible_mults = []
		for(multiplier = 0; multiplier < module.exports.data_sizes.length;multiplier++){
			if(size_str.substring(size_str.length-module.exports.data_sizes[multiplier].length,size_str.length) == module.exports.data_sizes[multiplier]){
				possible_mults.push(multiplier);
			}
		}
		if(!possible_mults.length){
			return null;
		}
		if(/[^$,\.\d]/.test(size_str.substring(0,size_str.length-module.exports.data_sizes[possible_mults.length-1].length))){
			console.log("Not an int");
			return null;
		}
		var size_int = parseInt(size_str.substring(0,size_str.length-module.exports.data_sizes[possible_mults.length-1].length));
		if(!size_int){
			return null;
		}
		return ""+size_int*Math.pow(1000,possible_mults[possible_mults.length-1])+"B";
		
	},
	search_dir : function(dir, done) {
	  var results = [];
	  fs.readdir(dir, function(err, list) {
	    if (err) return done(err);
	    var i = 0;
	    (function next() {
	      var file = list[i++];
	      if (!file) return done(null, results);
	      file = dir + '/' + file;
	      fs.stat(file, function(err, stat) {
	        if (stat && stat.isDirectory()) {
	          module.exports.search_dir(file, function(err, res) {
	            results = results.concat(res);
	            next();
	          });
	        } else {
	          results.push(file);
	          next();
	        }
	      });
	    })();
	  });
	},
	copy_dir : function(srcDir, dstDir) {

	    var results = [];
	    var list = fs.readdirSync(srcDir);
		var src, dst;
	    list.forEach(function(file) {
	        src = srcDir + '\\' + file;
			dst = dstDir + '\\' + file;
	        var stat = fs.statSync(src);
	        if (stat && stat.isDirectory()) {
				try {
					fs.mkdirSync(dst);
				} catch(e) {
					console.log('directory already exists: ' + dst);
				}
				results = results.concat(module.exports.copy_dir(src, dst));
			} else {
				module.exports.copy_file(src,dst,function(err){
					if(err){
						console.log(err);
					}
				})
				results.push(src);
			}
	    });
	    return results;
	},
	copy_file : function (source, target, cb) {
	  if(!fs.existsSync(target)){
		  var cbCalled = false;

		  var rd = fs.createReadStream(source);
		  rd.on("error", function(err) {
		    done(err);
		  });
		  var wr = fs.createWriteStream(target);
		  wr.on("error", function(err) {
		    done(err);
		  });
		  wr.on("close", function(ex) {
		    done();
		  });
		  rd.pipe(wr);

		  function done(err) {
		    if (!cbCalled) {
		      cb(err);
		      cbCalled = true;
		    }
		  }	  	
	  }
	},
	dir_exists : function(loc){
		if(!fs.existsSync(loc) && loc !== ''){
			return 0;
		}
		return 1;
	},
 	file_exists : function(loc){
		if(!fs.existsSync(loc)){
			return 0;
		}
		return 1;
	}
}