(function(){
  // Variables
  var socket;
  var phases = ["login","register","profile","notes"];
  var current_phase = 0;
  var note_phase = ""
  var user = "";
  var current_note;

  // Instanitation
  constructJS();

  // Constructor
  function constructJS() {
    // Load Elements
    loadElements();
    // Establish a connection
    connectToSocket();
    // Resize + Auto
    handleResize();
  };

  // Socket Connections
  function connectToSocket() {
    // http://98.209.8.31:6789
    socket = io("http://localhost:3000");
  }

  // Handle Resize
  function handleResize() {
    $(".form_input").css("margin-top",($(window).height() / 2) - 150);
    $(".body_animator").css("height",$(window).height());
    autoResize();
  }

  function loadElements() {
    $("#profile_phase").load("user_profile.html")
    $("#notes_phase").load("note_edit.html")
    $("#settings_phase").load("settings.html")
  }

  // Auto Resize
  function autoResize() {
    $(window).resize(function(){
      handleResize();
    });
  }

  // jQuery Animations
  function handleFade(target,type,time) {
    if (type == 0) {
      $(target).fadeIn(time)
    } else if (type == 1) {
      $(target).fadeOut(time)
    }
  }

  // Componenets
  handleFade("#register_form",1,0);
  handleFade(".message_alert",1,0);

  // Switch Window To Register
  $("#to_register").on("click",function(e){
    e.preventDefault();
    // Animate from login screen to register
    $.when($("#login_form").fadeOut(500))
    .then(function(){
      $("#register_form").fadeIn(500);
    });
  })

  // Switch Window To Login
  $("#to_login").on("click", function(e){
    e.preventDefault();
    $.when($("#register_form").fadeOut(500))
    .then(function(){
      $("#login_form").fadeIn(500);
    });
  })

  // Get Login Details
  $("#login_form").submit(function(e){
    e.preventDefault(); // prevents page reloading
    socket.emit("user_verify", $("#username_in").val(), $("#password_in").val());
    $("#username_in").val("");
    $("#password_in").val("");
    return false;
  });

  // Register User
  $("#register_confirm_submit").on("click",function(e){
    e.preventDefault();
    if ($("#register_form .form_input #username_in").val() != "" && $("#register_form .form_input #password_in").val() != "") {
      socket.emit("user_register", $("#register_form #username_in").val(), $("#register_form #password_in").val())
      return false;
    } else {
      $(".message_alert.mar").fadeIn(2000).delay(1000).fadeOut(500).text("Complete All Fields");
    }
  });

  socket.on("user_register_response", function(response, eType){
    if (response == "error") {
      $(".message_alert.mar").fadeIn(2000).delay(1000).fadeOut(500).text(eType);
    } else if (response == "ok") {
      // Switch to Login Page
      $.when($("#register_form").fadeOut(500))
      .then(function(){
        $("#login_form").fadeIn(500);
      });
    }
  })

  // Load Note Page
  $("#notes_phase").load("note_edit.html",function(){
    // Set note phase
    note_phase = "edit"
    // Switch Window From Note To Profile
    $("#exit_note").on("click", function(e){
      e.preventDefault();
      $.when($("#notes_phase").fadeOut(500))
      .then(function(){
        $("#profile_phase").fadeIn(500);
      });
    })
    // Update Notes
    $("#note_area").on("input propertychange", function(){
      socket.emit("update_note", user, current_note,$(this).html())
    })
    // Compile Note
    $("#compile_note").on("click", function(e){
      e.preventDefault()
      if (note_phase == "edit") {
        note_phase = "compile"
        $.when($("#note_area").fadeOut(500), decodeMarkdown($("#note_area").html()))
        .then(function(){
          $("#compiled_note_area").fadeIn(500)
          $("#compile_note").html("<i class='fas fa-edit'></i>")
        })
      } else if (note_phase == "compile") {
        // print($("#note_area").html())
        note_phase = "edit"
        $.when($("#compiled_note_area").fadeOut(500))
        .then(function(){
          $("#note_area").fadeIn(500)
          $("#compile_note").html("<i class='fas fa-scroll'></i>")
        })
      }
    })
  })

  // Fetch Notes Function
  function fetchNotes(notes) {
      $("#profile_phase .left_current_notes table").html(
        "<tr>" +
          "<th>Date</th>" +
          "<th>Subject</th>" +
          "<th>Created By</th>" +
          "<th>Action</th>" +
        "</tr>"
      )
      for (i = 0; i < notes.length; i++) {
        date = notes[i]['date']
        title = notes[i]['title']
        creator = notes[i]['creator']
        current_note = notes[i]['src'];
        if (creator == 'self') {
          creator = "YOU"
        }
        $("#profile_phase .left_current_notes table").append("<tr>" +
          "<td>" + date + "</td> " +
          "<td>" + title  + "</td> " +
          "<td>" + creator + "</td> " +
          '<td><a href="#" class="table_action_edit table_actions" data-src="' + current_note + '"><i class="fas fa-pencil-alt"></i>' +
          '</a><a href="#" class="table_action_trash table_actions" data-src="' + current_note + '"><i class="fas fa-trash-alt"></i></a>' +
          '<a href="#" class="table_action_privacy table_actions off" data-src="' + current_note + '"><i class="fas fa-shield-alt"></i></a></td>' +
        "</tr>");
      }

      // Edit Click
      $(".table_action_edit").on("click", function(e){
        dataID = $(this).data("src");
        current_note = dataID
        socket.emit("get_notes",user,dataID);
      })

      $(".table_action_trash").on("click", function(e){
        // dataID = $(this).data("src")
        socket.emit("del_note",user,current_note)
      })

      // Edit Click
      $(".table_action_privacy").on("click", function(e){
        if ($(this).hasClass("off")) {
          $(this).removeClass("off")
          $(this).addClass("on")
        } else {
          $(this).removeClass("on")
          $(this).addClass("off")
        }
      })

  }

  // Socket Messages
  socket.on("user_verify_response",function(response,username,notes){
     if (response == "ok") {
       user = username;
       $.when($('#login_phase').fadeOut(500))
       .then(function(){
         fetchNotes(notes);
         $("#profile_phase").fadeIn(500);
         $("#profile_phase .username").text(username);
         window.ipcRenderer.send('profile_size');
         // Notify of successfull login
         let myNotification = new Notification('WeNote - Login', {
           body: 'Successfully Logged In as ' + username + "."
         })
         // Profile Phase Buttons
         // Go To Settings
         $("#profile_settings").on("click", function(e){
           e.preventDefault();
           console.log("clicked!")
           $.when($("#profile_phase").fadeOut(500))
           .then(function(){
             $("#settings_phase").fadeIn(500);
             // Setting option buttons
             $(".setting_option_action").on("click", function(e){
               if ($(this).hasClass("option_false")) {
                 $(this).removeClass("option_false")
                 $(this).addClass("option_true")
               } else {
                 $(this).removeClass("option_true")
                 $(this).addClass("option_false")
               }
             })
             // Leave Settings
             $("#exit_settings").on("click",function(e){
               e.preventDefault();
               $.when($("#settings_phase").fadeOut(500))
               .then(function(){
                 $("#profile_phase").fadeIn(500);
               })
             })

           })
         })
         // Create new Note
         $("#create_new_note").on("click", function(e){
            e.preventDefault();
            title = $("#note_title").val()
            socket.emit("new_note",user,title);
            $("note_title").val("")
         })

       })
     } else {
       $(".message_alert .mal").fadeIn(2000).animate({"transform":"translateY(-3px)"}).delay(1000).fadeOut(500)
         .text("Incorrect Username / Password");
     }
  });

  // Socket Recieve Notes
  socket.on("get_notes_response", function(response, note, note_title){
    if (response == "ok") {
      $.when($('#profile_phase').fadeOut(500))
      .then(function(){
        $("#note_title").text(note_title)
        // Markdown Note
        $("#note_area").html(note)
        $("#notes_phase").fadeIn(500)
      })
    } else {
      // Notes Response Error

    }
  })

  // Socket Create Notes
  socket.on("create_note_repsonse",function(response,notes){
    if (response == "ok") {
      fetchNotes(notes);
    }
  })

  function decodeMarkdown(note) {
    for (i = 0; i < 20; i++) {
      // Colors
      note = note.replace("_c=red","<span style='color:#E74C3C'>")
      note = note.replace("c_","</span>")
      note = note.replace("_bk=white","<span style='background-color:#fff'>")
      note = note.replace("bk_","</span>")
      note = note.replace("_hl=yellow","<span style='background-color:#e0ed1cb0'>")
      note = note.replace("hl_","</span>")
      note = note.replace("_table","<table>")
      note = note.replace("table_","</table>")
      note = note.replace("_row","<tr>")
      note = note.replace("row_","</tr>")
      note = note.replace("_header","<th>")
      note = note.replace("header_","</th>")
      note = note.replace("_val","<td>")
      note = note.replace("val_","</td>")


      note = note.replace("b_","</b>")
      note = note.replace("_b","<b>")
      note = note.replace("sup_","</sup>")
      note = note.replace("_sup","<sup>")
      note = note.replace("sub_","</sub>")
      note = note.replace("_sub","<sub>")
      note = note.replace("del_","</del>")
      note = note.replace("_del","<del>")
      note = note.replace("u_","</u>")
      note = note.replace("_u","<u>")
    }
    $("#compiled_note_area").html(note);
  }

})();
