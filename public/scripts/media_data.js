function Media(media_type,socket){
   var media_self = this;
   socket.on('connect',function(){
      window.addEventListener("load", media_self.load(media), true);
      setInterval(function() {
        socket.emit('all_progress_req',{})
      }, 2000);
   });
   socket.on('media_res', function(data){
     media.build(data);
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
          } else if (data.media[index].status == "working") {
              card_body.setAttribute("style", "background-color: #353b41;");

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
