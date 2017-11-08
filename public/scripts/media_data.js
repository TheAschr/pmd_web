var t_status = {};
t_status["STOPPED"] = 0;
t_status["CHECK_WAIT"] = 1;
t_status["CHECK"] = 2;
t_status["DOWNLOAD_WAIT"] = 3;
t_status["DOWNLOAD"] = 4;
t_status["SEED_WAIT"] = 5;
t_status["SEED"] = 6;
t_status["ISOLATED"] = 7;

function MediaList(socket){
    var media_self = this;
    socket.on('connect',function(){
      socket.emit('all_progress_req');
      setInterval(function(){socket.emit('all_progress_req')},3000);
    });

    socket.on('all_progress_res',function(data){
      media_self.reload_list(data);
    });

    this.set_status_class = function(list_item,torrent){
        if(torrent.status == t_status["DOWNLOAD"] || torrent.status == t_status["DOWNLOAD_WAIT"]){
          list_item.classList.add("media-download");
          list_item.classList.remove("media-seed")
        }
        else if(torrent.status == t_status["SEED"] || torrent.status == t_status["SEED_WAIT"]){
          list_item.classList.add('media-seed');
          list_item.classList.remove("media-download")
        }
    }

    this.add_list_item = function(list_group,torrent){
        var list_item = document.createElement("div");
        list_item.classList.add("list-group-item");
        list_item.id = torrent.uid;
        list_item.innerHTML = torrent.title + torrent.status;

        media_self.set_status_class(list_item,torrent);

        var progress_bar_container = document.createElement("div");
        progress_bar_container.className = "progress";
        progress_bar_container.setAttribute("style", "margin-bottom:30px;")
        list_item.appendChild(progress_bar_container);

        var progress_bar = document.createElement("div");
        progress_bar.className = "progress-bar"
        progress_bar.setAttribute("role", "progressbar");
        progress_bar.setAttribute("aria-valuenow", torrent.progress);
        progress_bar.setAttribute("aria-valuemin", "0");
        progress_bar.setAttribute("aria-valuemax", "100");

        progress_bar.setAttribute("style", "height:10px;width:"+torrent.progress+"%;background-color:#cc7b19");
        progress_bar_container.appendChild(progress_bar);

        var progress_bar_inner = document.createElement("span");
        progress_bar_inner.className = "sr-only";
        progress_bar_inner.innerHTML = torrent.progress+"%";
        progress_bar.appendChild(progress_bar_inner);

        list_group.appendChild(list_item);    
    }
    this.update_list_item = function(list_item,torrent){
      media_self.set_status_class(list_item,torrent);

      var progress_bar_container = list_item.children[0];

      var progress_bar = progress_bar_container.children[0];
      progress_bar.setAttribute("aria-valuenow", torrent.progress);
      progress_bar.setAttribute("style", "height:10px;width:"+torrent.progress+"%;background-color:#cc7b19");

      var progress_bar_inner = document.createElement("span");
      progress_bar_inner.innerHTML = torrent.progress+"%";
    }

    this.reload_list = function(data){
      if(data.active){
        for(i = 0; i < data.active.length;i++){
          var list_item = document.getElementById(data.active[i].uid);
          if(!list_item){
            media_self.add_list_item(document.getElementById("progress_list"),data.active[i]);
          }
          else{
            media_self.update_list_item(list_item,data.active[i]);
          }
        }        
      }

    }
}

function MediaGrid(media_type,socket){
   var media_self = this;
   socket.on('connect',function(){
      window.addEventListener("load", media_self.load(media), true);
      setInterval(function() {
        socket.emit('all_progress_req',{})
      }, 2000);
   });
   socket.on('media_res', function(data){
     media.build(data);
     media.build_progress(data);
  });
   socket.on('all_progress_res',function(data){
     media.build_progress(data);
   });

  this.page = 0;
  this.offset = 0;
  this.size = 20;

  this.search_title = "";

  this.set_page = function(index){
    this.page = index;
    document.getElementById("page-index").innerHTML = index;    
  }

  this.next_page = function(click){
    this.offset+=this.size;
    this.set_page(this.page+1);
    this.load(); 
  }

  this.previous_page = function(click){
    if(this.offset-this.size>=0){
      this.offset-=this.size;
      this.set_page(this.page-1);
      this.load();
    }
  }

   this.search = function(){
    this.offset = 0;
    this.set_page(0);
    this.load()
   }

   this.download = function(uid){
    var old_success = document.getElementsByClassName("success_container");
    while (old_success[0]) {
        old_success[0].parentNode.removeChild(old_success[0]);
    }
    var container = document.getElementById("media_page");
    var success_container = document.createElement("div");
    success_container.classList.add("success_container");
    container.appendChild(success_container);
    var success_el = document.createElement("div");
    success_el.classList.add("success_slider");
    var succ_type;
    if(media_type == "movies"){
      succ_type = "movie";
    }
    else if(media_type == "tv_shows"){
      succ_type = "tv show";
    }
    success_el.innerHTML = "Successfully added new "+succ_type;
    success_container.appendChild(success_el);
    window.scrollTo(0, document.body.scrollHeight);
    var op = 1;  // initial opacity

    setTimeout(
      function(){
          var counter = 0;
         var timer = setInterval(function () {
            if (op <= 0.1){
                clearInterval(timer);
                success_container.style.display = 'none';
            }
            success_container.style.opacity = op;
            success_container.style.filter = 'alpha(opacity=' + op * 100 + ")";
            counter = counter+1;
            op -= op * 0.03+(counter/500);
        }, 100);       
       }
      ,3000
      );


     socket.emit('download_req',{type:media_type,
      uid:uid,
      offset: this.offset,
      size: this.size
  });
    this.load();
   }

  this.load = function() {
      socket.emit('media_req', {
          title: document.getElementById("search_bar").value,
          type: media_type,
          offset: this.offset,
          size: this.size
      });
  }

  this.build = function(data) {
      var container = document.getElementsByClassName("container")[1];

      var old_row = document.getElementsByClassName("row");
      if (old_row.length) {
          container.removeChild(old_row[0]);
      }

      var row = document.createElement("row");
      row.className = "row";

      container.insertBefore(row, document.getElementsByClassName("row_placeholder")[0]);

      for (index = 0; index < data.media.length; index++) {

          var main_div = document.createElement("div");
          main_div.classList.add("col-lg-3", "col-md-4", "col-sm-6", "portfolio-item");

          var card_div = document.createElement("a");
            card_div.addEventListener("click", function() {
              media_self.download(this.id);
              media_self.load(media);
          });
          card_div.id = data.media[index].uid;
          card_div.style = "color:white;text-decoration:none";
          card_div.classList.add("card", "h-100");
          main_div.appendChild(card_div);

          var card_img = document.createElement("img");
          card_img.className = "card-img-top";
          card_img.src = "/pics/" + data.media[index].uid + ".jpeg";
          card_img.alt = "";
          card_div.appendChild(card_img);

          var card_body = document.createElement("div");
          card_body.className = "card-body";
          if (data.media[index].status == "none") {
              card_body.setAttribute("style", "background-color: #353b41;");
              card_div.classList.add("card-hover");
          }
          else if (data.media[index].status == t_status["SEED"] || data.media[index].status == t_status["SEED_WAIT"]) {
              card_div.classList.remove("card-hover");
              card_body.classList.add("media-seed");
              card_body.classList.remove("media-download");              
              card_body.setAttribute("style", "background-color: #505a62;");
          } else if (data.media[index].status == t_status["DOWNLOAD"] || data.media[index].status == t_status["DOWNLOAD_WAIT"]) {
              card_div.classList.remove("card-hover");
              card_body.classList.add("media-download");
              card_body.classList.remove("media-seed");
              var progress_bar_container = document.createElement("div");
              progress_bar_container.className = "progress";
              progress_bar_container.setAttribute("style", "margin-bottom:30px;")
              card_body.appendChild(progress_bar_container);

              var progress_bar = document.createElement("div");
              progress_bar.className = "progress-bar"
              progress_bar.setAttribute("role", "progressbar");
              progress_bar.setAttribute("aria-valuenow", "0");
              progress_bar.setAttribute("aria-valuemin", "0");
              progress_bar.setAttribute("aria-valuemax", "100");
              progress_bar.setAttribute("style", "height:10px;width:0%;background-color:#cc7b19");
              progress_bar_container.appendChild(progress_bar);

              var progress_bar_inner = document.createElement("span");
              progress_bar_inner.className = "sr-only";
              progress_bar_inner.innerHTML = "0%";
              progress_bar.appendChild(progress_bar_inner);
          }
          card_div.appendChild(card_body);

          var card_title = document.createElement("h4");
          card_title.className = "card-title";
          card_body.appendChild(card_title);

          var card_title_link = document.createElement("a");
          card_title_link.text = data.media[index].title;
          card_title.appendChild(card_title_link);

          var card_text = document.createElement("p");
          card_text.className = "card-text";
          //card_text.innerHTML = "example";
          card_body.appendChild(card_text);


          row.appendChild(main_div);
      }
  }

  this.build_progress = function(data) {
      for (var i in data.active) {
          var card_div = document.getElementById(data.active[i].uid);
          if(card_div){
            var card_body = card_div.children[1];
            for (child = 0; child < card_body.children.length; child++) {
                if (card_body.children[child].className == "progress") {
                    card_body.removeChild(card_body.children[child]);
                }
            }

            var progress_bar_container = document.createElement("div");
            progress_bar_container.className = "progress";
            progress_bar_container.setAttribute("style", "margin-bottom:30px;")
            card_body.insertBefore(progress_bar_container, card_body.children[0]);

            if (data.active[i].status == "none") {
                card_body.setAttribute("style", "background-color: #353b41;");
                card_div.classList.add("card-hover");
                card_div.classList.add("card-active");
            }
            else if (data.active[i].status == t_status["SEED"] || data.active[i].status == t_status["SEED_WAIT"]) {
                card_div.classList.remove("card-hover");
                card_div.classList.remove("card-active");
                card_body.setAttribute("style", "background-color: #505a62;");
            } else if (data.active[i].status == t_status["DOWNLOAD"] || data.active[i].status == t_status["DOWNLOAD_WAIT"]) {
                card_div.classList.remove("card-hover");
                card_div.classList.remove("card-active");
                card_body.setAttribute("style", "background-color: #22262a;");
                var progress_bar = document.createElement("div");
                progress_bar.className = "progress-bar"
                progress_bar.setAttribute("role", "progressbar");
                progress_bar.setAttribute("aria-valuenow", data.active[i].progress);
                progress_bar.setAttribute("aria-valuemin", "0");
                progress_bar.setAttribute("aria-valuemax", "100");
                progress_bar.setAttribute("style", "height:10px;width:"+data.active[i].progress+"%;background-color:#cc7b19");
                progress_bar_container.appendChild(progress_bar);

                var progress_bar_inner = document.createElement("span");
                progress_bar_inner.className = "sr-only";
                progress_bar_inner.innerHTML = data.active[i].progress + "%";
                progress_bar.appendChild(progress_bar_inner);
            }            


          }
      }
  }

}
