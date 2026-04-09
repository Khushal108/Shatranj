
const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    const isCheck = chess.isCheck
    ? chess.isCheck()
    : chess.inCheck
    ? chess.inCheck()
    : chess.in_check();
    const kingPos = isCheck ? getKingPosition(chess.turn()) : null;

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {

            const squareElement = document.createElement("div");

            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

                if (
                kingPos &&
                kingPos.row === rowIndex &&
                kingPos.col === squareIndex
            ) {
                squareElement.classList.add("check-highlight");
            }

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");

                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"  
                );

                pieceElement.innerText = getPieceUnicode(square);  

                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = {
                            row: rowIndex,
                            col: squareIndex
                        };

                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend",(e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);  
            }

            squareElement.addEventListener("dragover", function (e){
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e){
                e.preventDefault();
                if (!draggedPiece || !sourceSquare) return;
                if(draggedPiece){
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare , targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole=== "b"){
        boardElement.classList.add("flipped");
    }
    else{
        boardElement.classList.remove("flipped");
    }
};

// placeholders
const handleMove = (source,target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };
    socket.emit("move", move);
};
const getPieceUnicode = (piece) => {
    const map = {
        p: { w: "♙", b: "♟" },
        r: { w: "♖", b: "♜" },
        n: { w: "♘", b: "♞" },
        b: { w: "♗", b: "♝" },
        q: { w: "♕", b: "♛" },
        k: { w: "♔", b: "♚" },
    };

    return map[piece.type][piece.color];
};

const showGameOver = (message) => {
    const overlay = document.createElement("div");

    overlay.className = "fixed inset-0 flex items-center justify-center bg-black/70 text-white text-3xl";

    overlay.innerText = message;

    document.body.appendChild(overlay);
};

const getKingPosition = (color) => {
    const board = chess.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = board[row][col];

            if (square && square.type === "k" && square.color === color) {
                return { row, col };
            }
        }
    }

    return null;
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);   
    renderBoard();
});

socket.on("gameOver", (data) => {
    if (data.type === "checkmate") {
        showGameOver(`Checkmate! ${data.winner} wins 🎉`);
    }

    if (data.type === "draw") {
        showGameOver("Game Draw 🤝");
    }
});

renderBoard();