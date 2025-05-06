import {restartGame, updateBoard, updateHistory, swapSide, undoMove} from '/src/main.js';

const checkmatePanel = document.getElementById("checkmate")
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
    undoMove();
    updateBoard();
    updateHistory();
})

swapSides.addEventListener('click', () => {
    swapSide();
})
