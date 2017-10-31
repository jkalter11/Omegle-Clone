/* 
vue.js
npm : express socket.io fs mongodb
HEROKU
database : mongoDB
 Studio 3T for MongoDB.

*/

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);



/*
var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app);
// Pass a http.Server instance to the listen method
var io = require('socket.io').listen(server);

// The server should start listening
server.listen(8000);
app.use(express.static(__dirname + '/public'))
-------------------------------------
 
var express = require('express')
var app = express()
var server = app.listen(5010);
var io = require('socket.io').listen(server);

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Helslo World!')
})


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
*/

var connectionUrl = 'insert mongodb url here'
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

 
function insertToMongoDB(chatArray, date){
	MongoClient.connect(connectionUrl, function(err, db) {
	  if (err) throw err;
	  var myobj = { chat: chatArray, chatLength: chatArray.length, date: date };
	  db.collection("history").insertOne(myobj, function(err, res) {
	    if (err) throw err;
	    db.close();
	  });

	});
}

 





var fs = require('fs');
function writeTxt(filename, msg) { 
	fs.writeFile("logs/" + String(filename), msg, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	    console.log("The file was saved!");
	}); 
}








var searchResult;
var nbrMsgs = 0;
var users =  {
	id : [],
	searching : [],
	strangerId : []  
}

setInterval(function(){
	searching();
	console.log(users.id, users.strangerId);
	console.log(users.id.length);
	io.emit("clientsNbr", users.id.length); 
}, 1000)
io.on('connection', function(socket) {
  console.log("new users." + socket.id)
 users.id.push(socket.id)
 socket.emit("id", socket.id)

	 socket.on('disconnect', function() { // oui 
	 	console.log("disconnected : " +socket.id)	
	 	for (var i = 0; i < users.id.length; i++) {
	 		if (users.id[i] === socket.id) {
	 			for (var j = 0; j < users.strangerId.length; j++) {
	 			console.log(users.id[i] + " === " + users.strangerId[j])
	 				if (users.strangerId[j] === users.id[i]) {
	 					users.strangerId[j] = ""; 
	 				}
	 			}
			 	io.to(users.strangerId[i]).emit('strangerSkip');
	 			users.id.splice(i, 1);
	 			users.searching.splice(i, 1);
	 			users.strangerId.splice(i, 1);
 	 	  }
	 	}
	 })

	 socket.on('searching', function(id) {
	 	for (var i = 0; i < users.id.length; i++) {
	 		if (users.id[i] === id) {
	 			users.searching[i] = true;
	 		}
	 	} 
	 })


	 socket.on('sendMessage', function(data) {
 		io.to(data.strangerId).emit('newMessage', data.msg);
	 })

	 socket.on('skip', function(data) {
	 	for (var i = 0; i < users.id.length; i++) {
	 		if (users.id[i] === data.id || users.id[i] === data.strangerId) {
	 			users.strangerId.splice(i, 1);
	 		}
	 	}
	 	io.to(data.strangerId).emit('strangerSkip');
	 })

	 socket.on("messages", function(messages) {
	 	if (messages.length > 0) {
			nbrMsgs++;
		 	strMsgs = "Message number : " + nbrMsgs + "\n" + new Date() + "\n" + Date.now() + "\n \n \n \n ------------------";
		 	for (var i = 0; i < messages.length; i++) {
		 		strMsgs += String(messages[i]) + "\n";
		 	}

		 	writeTxt(String(Date.now()), strMsgs);
			insertToMongoDB(messages, new Date());

		 }
	 })

})
 
function searching(){
	for (var i = 0; i < users.id.length; i++) {
		for (var j = 0; j < users.id.length; j++) {
			if (users.searching[i] && users.searching[j] && users.id[i] != users.id[j]) {
				users.searching[i] = false; 
				users.searching[j] = false;
				console.log(i + " and "  + j +" found.");
				var strangerId = users.id[j];
				
				users.strangerId[i] = strangerId;
				users.strangerId[j] = users.id[i];

				io.to(strangerId).emit('strangerFound', users.id[i]);
				io.to(users.id[i]).emit('strangerFound', strangerId);
				 
			}
		}
	}
}