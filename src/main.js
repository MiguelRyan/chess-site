import {BORDER_TYPE, Chessboard, COLOR, FEN, INPUT_EVENT_TYPE} from "cm-chessboard"
import {BLACK, Chess, KING, WHITE} from 'chess.js'
import {PromotionDialog} from "cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";
import {MARKER_TYPE, Markers} from "cm-chessboard/src/extensions/markers/Markers.js";

const checkmatePanel = document.getElementById("checkmate")
const historyTable = document.getElementById("historyTable")
const board = new Chess();
const dangerMarker = {class: "marker-circle-danger", slice: "markerCircleDanger"};
const boardGUI = new Chessboard(document.getElementById("board"), {
    position: FEN.start,
    assetsUrl: "/assets/",
    style: {
        borderType: BORDER_TYPE.frame
    },
    extensions: [{class: PromotionDialog}, {class: Markers}]
})
boardGUI.enableMoveInput(inputHandler)

function inputHandler(event) {
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted){
        const select = event.square === event.squareFrom;

        if (select) {
            boardGUI.removeMarkers()
            const legalMoves = board.moves({  square: event.square  })
            for (let move of legalMoves) {
                boardGUI.addMarker(MARKER_TYPE.dot, move.slice(-2));
            }
        }

        return true;
    }

    if (event.type === INPUT_EVENT_TYPE.validateMoveInput){
        const move = {from: event.squareFrom, to: event.squareTo};
        const promotion = (move.to.charAt(1) === "8" || move.to.charAt(1) === "1") && event.piece.charAt(1) === "p";

        if (promotion) {
            boardGUI.showPromotionDialog(move.to, move.to.charAt(1) === "8" ? COLOR.white : COLOR.black, result => {
                if (result && result.piece) {
                    move.promotion = result.piece.charAt(1);
                    // throws an invalid move because we make the move twice when promoting
                    makeMove(move);
                }
            })
        } else {
            makeMove(move);
        }

        if (board.isCheckmate()) {
            checkmatePanel.style.display = "flex";
        }

        return false;
    }
}

function makeMove(move) {
    try {
        board.move(move);
        boardGUI.removeMarkers()
    } catch (error) {
        console.log("Invalid Move: " + move.from + " to " + move.to + " " + move.promotion);
        return false;
    }
    boardGUI.setPosition(board.fen());
    if (board.inCheck()) {
        const color = board.turn() === WHITE ? WHITE : BLACK;
        const pieceObject = {type: KING, color: color};
        const location = board.findPiece(pieceObject);
        boardGUI.addMarker(dangerMarker, location[0]);
    }
    updateHistory();
}

const allButtons = document.body.getElementsByTagName("button");
for (let button of allButtons) {
    button.addEventListener('mouseenter', () => {
        button.style.color = "white";
    })
    button.addEventListener('mouseleave', () => {
        button.style.color = "#c5a076";
    })
}

playAgain.addEventListener('click', () => {
    checkmatePanel.style.display = "none";
})

startAgain.addEventListener('click', () => {
    restartGame()
})

undo.addEventListener('click', () => {
    board.undo();
    updateBoard();
    updateHistory();
})

swapSides.addEventListener('click', () => {
    swapSide();
})



function restartGame() {
    checkmatePanel.style.display = "none";
    boardGUI.removeMarkers;
    board.reset();
    boardGUI.setPosition(FEN.start);
}

function updateBoard() {
    boardGUI.setPosition(board.fen());
}

function updateHistory() {
    historyTable.innerHTML = '';

    const history = board.history();
    for (let i = 0; i < history.length / 2; i++){
        let tr = document.createElement("tr");
        let tdWhite = document.createElement("td");
        let tdBlack = document.createElement("td");
        tdWhite.innerText = history[(i * 2)];
        if (history[(i * 2) + 1]) tdBlack.innerText = history[(i * 2) + 1];
        tr.appendChild(tdWhite);
        tr.appendChild(tdBlack);
        historyTable.appendChild(tr);
    }
}

function swapSide() {
    const orientation = boardGUI.getOrientation() === COLOR.white ? COLOR.black : COLOR.white;
    boardGUI.setOrientation(orientation)
}
