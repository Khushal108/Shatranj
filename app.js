const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentplayers = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req,res) =>{
    res.render("index", {title: "shatranj"});
});

io.on("connection", function(uniquesocket){
    console.log("connected");

    uniquesocket.emit("boardState", chess.fen());

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }
    
    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move", (move)=>{
        try {
        if(chess.turn() === "w" && uniquesocket.id !== players.white) return ;
        if(chess.turn() === "b" && uniquesocket.id !== players.black) return ;

        const result = chess.move(move);
        if(result){
            CurrentPlayer = chess.turn();

            if(chess.isCheck()){
                io.emit("check", {
                    player:chess.turn()
                });
            }

            if (chess.isCheckmate()) {
                io.emit("gameOver", {
                    type: "checkmate",
                    winner: chess.turn() === "w" ? "black" : "white"
                });
            }
            
            io.emit("move", move);
            io.emit("boardState", chess.fen());
        }
        else{
            console.log("Inavalid move", move);
            uniquesocket.id("invalidMove", move);
        }
        } catch (error) {
            console.log(error);
            uniquesocket.emit("invalidMove", move);
        }
    })






});

server.listen(3000, function() {
    console.log("listening on PORT 3000");
});
