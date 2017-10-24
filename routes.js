
function check_auth(req, res, next) {
  if (req.session.user_name) {
    next();
  } else {
    res.redirect('/');
  }
};

module.exports = function(sql_conn,app){
  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/login.html');
  });
  app.post('/login', function(req, res) {
    if(req.body.action == "Login"){
       sql_conn.validate_user(req.body.user.name,req.body.user.password,
        function(){
          req.session.user_name = req.body.user.name;
          res.redirect('/home'+'?user_name='+req.session.user_name);    
        },
        function(){
          res.redirect('/?bad_login=true')
        }
      );
    }
    else if (req.body.action == "Register"){
      res.redirect('/registration_page');
    }

  });
  app.get('/registration_page',function(req,res){
    res.sendFile(__dirname + '/public/register.html');
  })
  app.post('/register',function(req,res){
    if(req.body.action == "Submit"){
      sql_conn.register_user(req.body.secret_code,req.body.user.name,req.body.user.email,req.body.user.password,req.body.user.password_conf,req.body.user.phone,
        
        function(){res.redirect('/');},
        function(error){res.redirect('/registration_page?error='+error)});
    }
    else if(req.body.action == "Cancel"){
      res.redirect('/');
    }
  });

  app.get('/logout', function(req, res) {
    if(req.session.user_name){
      delete req.session.user_name;
    }
    res.redirect('/')
  });
  app.get('/home', check_auth, function(req, res) {
    res.sendFile(__dirname + '/home.html');
  });
  app.get('/movies', check_auth, function(req, res) {
    res.sendFile(__dirname + '/movies.html');
  });
  app.get('/tv_shows', check_auth, function(req, res) {
    res.sendFile(__dirname + '/tv_shows.html');
  });
}
