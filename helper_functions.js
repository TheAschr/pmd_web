var fs = require('fs');


module.exports = {
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
		var min = module.exports.parse_data_size(str_min);
		if(!min){
			min = 0;
		}
		var max = module.exports.parse_data_size(str_max);
		if(!max){
			max = Number.MAX_SAFE_INTEGER;
		}
		var results = [];
		for(i = 0; i < media.length; i++){
			var media_size = module.exports.parse_data_size(media[i].size);
			if(media_size >= +min && media_size <= +max){
				results.push(media[i]);
			}	
		}
		return results;
	},
	data_sizes : ['KB','MB','GB','TB'],
	parse_data_size : function(data_str){
		if(!data_str || data_str == ""){
			return null;
		}
		var size = data_str.replace(/[^0-9\.]+/g,"");
		var found = false;
		for(s = 0; s < module.exports.data_sizes.length && !found; s++){
			if(data_str.toUpperCase().search(module.exports.data_sizes[s])!=-1){
				found = true;
				var multiplier = Math.pow(1000,s+1);
				size*=multiplier;
			}
		}
		if(!found){
			return null;
		}
		return size;
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
	if(!fs.existsSync(dstDir)){
		console.log("Could not find directory at "+dstDir+". Building a new one");
		fs.mkdirSync(dstDir);
		if(!fs.existsSync(dstDir)){	
			console.log("Could not make directory at "+dstDir);
		}	
	}
    var results = [];
    var list = fs.readdirSync(srcDir);
	var src, dst;
    list.forEach(function(file) {
        src = srcDir + '/' + file;
		dst = dstDir + '/' + file;
		//console.log(src);
        var stat = fs.statSync(src);
        if (stat && stat.isDirectory()) {
			try {
				fs.mkdirSync(dst);
			} catch(e) {
				console.log('directory already exists: ' + dst);
			}
			results = results.concat(copy(src, dst));
		} else {
			try {
				fs.writeFileSync(dst, fs.readFileSync(src));
			} catch(e) {
				console.log('could\'t copy file: ' + dst);
			}
			results.push(src);
		}
    });
    return results;
}

}