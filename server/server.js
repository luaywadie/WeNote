var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var users = require(__dirname + '/users.json');
var fs = require("fs");

app.get('/',function(req,res) {
  res.sendFile(__dirname + '/index.html');
})

io.on('connection', function(socket){
  var opened_note_src = ""
  // Check Register
  socket.on('user_register',function(username,password){
    for (i = 0; i < users.length; i++) {
      if (users[i]['username'] == username) {
        socket.emit('user_register_response','error','Username Taken');
      } else if (i == users.length - 1){
        socket.emit('user_register_response','ok');
        register_user(username, password);
      }
    }
  })
  // Check Login
  socket.on('user_verify',function(username,password){
    console.log(username + " | " + password);
    for (i = 0; i < users.length; i++) {
      // Correct Info
      if (users[i]['username'] == username && users[i]['password'] == password) {
        socket.emit('user_verify_response','ok',username,users[i]['notes']);
        break;
      // Incorrect info
      } else if (i == users.length - 1) {
        socket.emit('user_verify_response','error');
        break;
      }
    }
  });
  // Notes (CREATE)
  socket.on('new_note',function(username,title) {
    create_note(username,title,socket);
  })
  // Notes (GET)
  socket.on('get_notes',function(username,noteID) {
    for (i = 0; i < users.length; i++) {
      if (username == users[i]['username']) {
        for (j = 0; j < users[i]['notes'].length; j++) {
          if (users[i]['notes'][j]['src'] == noteID) {
            try {
              var notes = fs.readFileSync("./notes/" + users[i]['notes'][j]['src'], 'utf8')
              var note_title = users[i]['notes'][j]['title']
              socket.emit('get_notes_response','ok',notes.toString(),note_title);
            } catch(e) {
              socket.emit('get_notes_response','error');
              console.log(e.stack);
            }
            break;
          }
        }
      }
    }
  })
  // Notes (Delete)
  // socket.on('del_note', function(username, noteSrc){
  //   for (i = 0; i < notes.length;i++) {
  //     if (notes[i]['username'] == username) {
  //       fs.unlink("./notes/" + noteSrc)
  //       break
  //     }
  //   }
  // })
  // Notes (Update)
  socket.on('update_note', function(username, noteSrc, note){
    fs.writeFile("./notes/" + noteSrc,note,function(error){
      if (error) {
        console.log("Error while writing to server!");
      }
      console.log("File " + noteSrc + " Updated!");
      socket.broadcast.emit("update_note_response",)
    })
  })
})

function register_user(username, password) {
  users.push({
    "username" : username,
    "password" : password,
    "notes" : []
  })
  jsonStr = JSON.stringify(users, null, 2);
  fs.writeFile('./users.json', jsonStr, function(err){
    if (err) return console.log(err);
  })
}

function create_note(username,title,socket) {
  for (i = 0; i < users.length; i++) {
    if (users[i]["username"] == username) {
      if (users[i]["notes"].length == 0) {
        users[i]["notes"].push({
          "title": title,
          "date": "11/7/2019",
          "creator": "self",
          "src": "Luay#" + title + ".txt"
        })
        jsonStr = JSON.stringify(users, null, 2);
        fs.writeFile('./users.json', jsonStr, function(err){
          if (err) return console.log(err);
        })
        fs.writeFile('notes/Luay#' + title +'.txt', "Welcome to your new note!", function(err){
          if (err) return console.log(err);
        })
        socket.emit('create_note_repsonse','ok',users[i]["notes"]);
        break
      } else {
        for (j = 0; j < users[i]["notes"].length;j++) {
          if (users[i]["notes"][j]['title'] == title) {
            break
          } else if (j == users[i]["notes"].length - 1) {
            users[i]["notes"].push({
              "title": title,
              "date": "11/7/2019",
              "creator": "self",
              "src": "Luay#" + title + ".txt"
            })
            jsonStr = JSON.stringify(users, null, 2);
            fs.writeFile('./users.json', jsonStr, function(err){
              if (err) return console.log(err);
            })
            fs.writeFile('notes/Luay#' + title +'.txt', "Welcome to your new note!", function(err){
              if (err) return console.log(err);
            })
            socket.emit('create_note_repsonse','ok',users[i]["notes"]);
            break
          }
        }
      }
      break
    }
  }
}

function delete_note(username,title,socket) {

}

http.listen(3000, function(){
  console.log('listening on *:3000');
})
