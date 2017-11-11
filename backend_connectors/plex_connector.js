var http = require('http');
module.exports = function(CONFIG){
	var module = {};

	module.scan_library = function(){
		if(CONFIG.PLEX && 
	        CONFIG.PLEX.IP && CONFIG.PLEX.IP.length && 
	        CONFIG.PLEX.PORT && CONFIG.PLEX.PORT.length &&
	        CONFIG.PLEX.AUTH_KEY && CONFIG.PLEX.AUTH_KEY.length
	        )
	    {
	        http.get('http://'+CONFIG.PLEX.IP+':'+CONFIG.PLEX.PORT+'/library/sections/all/refresh?X-Plex-Token='+CONFIG.PLEX.AUTH_KEY);
	    }
	}

	return module;
}