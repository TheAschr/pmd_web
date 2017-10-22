var http = require('http');

module.exports = function(app){
	function http_redirect(req, res, next){
	  if(req.secure){
	    return next();
	  };
	  res.redirect('https://' + req.hostname + req.url); 
	}

	app.all('*', http_redirect); 

	http.createServer(app).listen(80)
}

