
function check_auth(req, res, next) {
  if (req.session.user_name) {
    next();
  } else {
    res.redirect('/');
  }
};
function check_admin(req, res, next) {
  if (req.session.level == 1) {
    next();
  } else {
    res.redirect('/home');
  }
};

var config = require('./config/config.json');

module.exports = function(sql_conn,app){
  app.get('/', function(req, res) {

    res.sendFile(__dirname + '/public/login.html');
    
  });
  app.post('/login', function(req, res) {
    if(req.body.action == "Login"){
       sql_conn.validate_user(req.body.user.name,req.body.user.password,
        function(user){
          if(user){
            req.session.user_name = user.username;
            req.session.level = user.level;
            res.redirect('/home');    
          }
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
        
        function(){res.redirect('/?succ_reg=true');},
        function(error){res.redirect('/registration_page?error='+error)});
    }
    else if(req.body.action == "Cancel"){
      res.redirect('/');
    }
  });

  app.get('/logout', function(req, res) {
    if(req.session.user_name){
      console.log(req.session.user_name+" logged out");
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
  app.get('/user_info', check_auth, function(req, res) {
    res.sendFile(__dirname + '/user_info.html');
  });
  app.get('/admin',check_auth,check_admin,function(req,res){
    res.sendFile(__dirname + '/admin.html')
  })
  app.get('/config',check_auth,check_admin,function(req,res){
    res.sendFile(__dirname + '/config.html');
  })
}
