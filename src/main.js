import {BORDER_TYPE, Chessboard, COLOR, FEN, INPUT_EVENT_TYPE} from "cm-chessboard"
import {BLACK, Chess, KING, WHITE} from 'chess.js'
import {PromotionDialog} from "cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";
import {MARKER_TYPE, Markers} from "cm-chessboard/src/extensions/markers/Markers.js";

const stockfish = new Worker('/node_modules/stockfish/src/stockfish.js')
stockfish.postMessage('ucinewgame')
stockfish.postMessage("position startpos")
stockfish.postMessage('flip')
stockfish.postMessage('setoption name Skill Level value 5')

const checkmatePanel = document.getElementById("checkmate")
const historyTable = document.getElementById("historyTable")
const board = new Chess();
const dangerMarker = {class: "marker-circle-danger", slice: "markerCircleDanger"};
const moveMarker = {class: "move-dot", slice: "moveDot"}
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
                if (move.includes('+')) boardGUI.addMarker(moveMarker, move.slice(-3, -1));
                else if (move === 'O-O') boardGUI.addMarker(moveMarker, boardGUI.getOrientation() === 'w' ? 'g1' : 'g8');
                else if (move === 'O-O-O') boardGUI.addMarker(moveMarker, boardGUI.getOrientation() === 'w' ? 'c1' : 'c8');
                else boardGUI.addMarker(moveMarker, move.slice(-2));
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

async function makeMove(move, engineMove) {
    try {
        board.move(move);
        await boardGUI.movePiece(move.from, move.to, true)
        boardGUI.removeMarkers()
    } catch (error) {
        console.log("Invalid Move: " + move.from + " to " + move.to + " " + move.promotion);
        return false;
    }

    // this fixes the castling animations
    boardGUI.setPosition(board.fen());

    if (!engineMove) {
        stockfish.postMessage("position fen " + board.fen());
        stockfish.postMessage("go movetime 2500");
    }
    if (board.inCheck()) {
        const color = board.turn() === WHITE ? WHITE : BLACK;
        const pieceObject = {type: KING, color: color};
        const location = board.findPiece(pieceObject);
        boardGUI.addMarker(dangerMarker, location[0]);
    }
    updateHistory();
}

export function restartGame() {
    checkmatePanel.style.display = "none";
    boardGUI.removeMarkers();
    board.reset();
    boardGUI.setPosition(FEN.start);
    stockfish.postMessage("position startpos")
    runStockfish();
    updateHistory();
}

export function updateBoard() {
    boardGUI.setPosition(board.fen());
}

export function updateHistory() {
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

export function undoMove() {
    board.undo();
    if (board.turn() !== boardGUI.getOrientation()) board.undo();
    stockfish.postMessage("position " + board.fen());
}

export function swapSide() {
    const orientation = boardGUI.getOrientation() === COLOR.white ? COLOR.black : COLOR.white;
    boardGUI.setOrientation(orientation)

    stockfish.postMessage('flip')
    runStockfish()
}

stockfish.onmessage = function (event) {
    console.log(event)
    if (event.data.includes('bestmove')) {
        const move = event.data.slice(9, 13)
        makeMove({from: move.slice(0, 2), to: move.slice(2,4)}, true);
    }
}

function runStockfish() {
    stockfish.postMessage("position " + board.fen());
    stockfish.postMessage("go depth 2");
}

const difficulty = document.querySelector("input")
difficulty.addEventListener('change', val => {
    console.log(val);
    console.log('setoption name Skill Levesl value ' + difficulty.value)
    stockfish.postMessage('setoption name Skill Level value ' + difficulty.value)
})