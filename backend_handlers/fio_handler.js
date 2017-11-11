var fs = require('fs');

module.exports = {
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