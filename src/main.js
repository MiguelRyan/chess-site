import {Chessboard, COLOR, FEN, INPUT_EVENT_TYPE} from "cm-chessboard"
import {BLACK, Chess, KING, WHITE} from 'chess.js'
import {PromotionDialog} from "cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";
import {MARKER_TYPE, Markers} from "cm-chessboard/src/extensions/markers/Markers.js";


const boardGUI = new Chessboard(document.getElementById("board"), {
    position: FEN.start,
    assetsUrl: "/assets/",
    extensions: [{class: PromotionDialog}, {class: Markers}]
})
const board = new Chess();
boardGUI.enableMoveInput(inputHandler)
const dangerMarker = {class: "marker-circle-danger", slice: "markerCircleDanger"};


function inputHandler(event) {
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted){
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

        return false;
    }
}

function makeMove(move) {
    try {
        console.log(move);
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
        console.log(location[0]);
        boardGUI.addMarker(dangerMarker, location[0]);
    }

}

board.is

