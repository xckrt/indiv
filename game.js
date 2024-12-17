let board;
let cells;
let mines = [];
let firstClick = true;
let timer;
let timeElapsed = 0;
let level = 1;
let openCellsCount = 0;

const levels = [
    { time: 120, mines: 10, rows: 5, cols: 5 },  // Уровень 1
    { time: 180, mines: 20, rows: 6, cols: 6 }, // Уровень 2
    { time: 300, mines: 30, rows: 8, cols: 8 }  // Уровень 3
];

function startGame() {
    clearInterval(timer);
    resetGameVariables();
    createGameBoard();
    setupGameInterface();
}

function resetGameVariables() {
    timeElapsed = 0;
    firstClick = true;
    openCellsCount = 0;
    mines = [];
    board = document.getElementById('board');
    board.innerHTML = ''; // Очистка игрового поля
}

function createGameBoard() {
    const currentLevel = levels[level - 1];
    board.style.gridTemplateColumns = `repeat(${currentLevel.cols}, 40px)`;

    for (let i = 0; i < currentLevel.rows * currentLevel.cols; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        board.appendChild(cell);
    }

    cells = document.querySelectorAll('.cell');

    // Добавляем обработчики для всех ячеек через делегирование
    board.addEventListener('click', (e) => {
        if (e.target.classList.contains('cell')) {
            const index = Array.from(cells).indexOf(e.target);
            handleCellClick(index);
        }
    });

    board.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('cell')) {
            const index = Array.from(cells).indexOf(e.target);
            handleCellRightClick(e, index);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupGameInterface();
});

function setupGameInterface() {
    const timerElement = document.getElementById("timer");
    const minesElement = document.getElementById("mines");
    const startButton = document.getElementById("start-button");

    if (!timerElement || !minesElement || !startButton) {
        console.error("Не найдены элементы интерфейса!");
        return;
    }

    timerElement.innerText = "02:00";
    minesElement.innerText = "10";

    startButton.addEventListener("click", () => {
        console.log("Игра началась!");
    });
}

function handleCellClick(index) {
    console.log("Клик по ячейке:", index);
    const cell = cells[index];

    if (firstClick) {
        generateMines(index);  // Генерируем мины
        openSafeZone(index);  // Открываем безопасную зону
        firstClick = false;
        startTimer();  // Запускаем таймер
    }
    if (cell.innerHTML > 0) {
        console.log("Открываю мины")
        highlightPotentialMines(index);
    }
    if (mines.includes(index)) {  // Если мина
        revealMines();  // Показать все мины
        clearInterval(timer);  // Останавливаем таймер
        showGameOverModal('Вы проиграли!');
    } else if (!cell.classList.contains('flag')) {
        openCell(index);  // Открыть ячейку
        checkWin();  // Проверить выигрыш
    }
}

function handleCellRightClick(e, index) {
    const cell = cells[index];
    if (!cell.classList.contains('open')) {
        cell.classList.toggle('flag');
        cell.innerHTML = cell.classList.contains('flag') ? '🏴' : '';
    }
}

function generateMines(firstIndex) {
    const currentLevel = levels[level - 1];
    const safeZone = getSafeZoneIndices(firstIndex, currentLevel); 

    // Генерация мин после первого клика в оставшихся ячейках
    const availableCells = Array.from({ length: currentLevel.rows * currentLevel.cols }, (_, i) => i)
        .filter(i => !safeZone.includes(i));

    while (mines.length < currentLevel.mines) {
        let randomIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
        if (!mines.includes(randomIndex)) {
            mines.push(randomIndex); // Сохраняем индекс мины
        }
    }
}

function openSafeZone(index) {
    const safeZone = getSafeZoneIndices(index, levels[level - 1]); 
    safeZone.forEach(i => {
        const cell = cells[i];
        if (!cell.classList.contains('mine') && !cell.classList.contains('open')) {
            openCell(i);
        }
    });
}

function getSafeZoneIndices(index, level) {
    const safeZone = [index];
    const directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 },                       { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
            let newRow = Math.floor(index / level.cols) + rowOffset;
            let newCol = (index % level.cols) + colOffset;
            let newIndex = newRow * level.cols + newCol;

            if (newRow >= 0 && newRow < level.rows && newCol >= 0 && newCol < level.cols) {
                safeZone.push(newIndex);
            }
        }
    }

    const maxSafeZoneSize = Math.floor(level.rows * level.cols / 2);
    return Array.from(new Set(safeZone.slice(0, maxSafeZoneSize))); // Ограничиваем размер безопасной зоны
}

function openCell(index) {
    const cell = cells[index];
    if (cell.classList.contains('open') || cell.classList.contains('flag')) return;  // Ячейка уже открыта или флаг

    cell.classList.add('open');
    cell.classList.add('highlight')
    openCellsCount++;
    const count = getAdjacentMines(index);  // Подсчитываем количество мин вокруг

    if (count > 0) {
        cell.innerHTML = count;  // Показываем количество мин
    } else {
        openAdjacentCells(index);  // Открываем соседние ячейки, если мин рядом нет
    }
}

function openAdjacentCells(index) {
    const currentLevel = levels[level - 1];
    const directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 },                       { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];

    directions.forEach(dir => {
        let newRow = Math.floor(index / currentLevel.cols) + dir.row;
        let newCol = (index % currentLevel.cols) + dir.col;
        let newIndex = newRow * currentLevel.cols + newCol;

        if (newRow >= 0 && newRow < currentLevel.rows && newCol >= 0 && newCol < currentLevel.cols) {
            const cell = cells[newIndex];
            if (!cell.classList.contains('open')) { // Проверяем, не открыта ли ячейка
                openCell(newIndex);  // Открываем соседнюю ячейку
            }
        }
    });
}

function getAdjacentMines(index) {
    const currentLevel = levels[level - 1];
    let count = 0;

    const directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 },                       { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];

    directions.forEach(dir => {
        let newRow = Math.floor(index / currentLevel.cols) + dir.row;
        let newCol = (index % currentLevel.cols) + dir.col;
        let newIndex = newRow * currentLevel.cols + newCol;

        if (newRow >= 0 && newRow < currentLevel.rows && newCol >= 0 && newCol < currentLevel.cols && mines.includes(newIndex)) {
            count++;
        }
    });

    return count;
}
function highlightPotentialMines(index) {
    const currentLevel = levels[0];  // Получаем текущий уровень
    const directions = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 },                       { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];

    const cell = cells[index];
    const count = parseInt(cell.innerHTML) || 0;  // Получаем количество мин вокруг клетки (если это не число, то считаем 0)
    console.log(`Обработка клетки ${index}, количество мин: ${count}`);

    let flagCount = 0;

    // Подсчитываем количество флажков вокруг клетки
    directions.forEach(dir => {
        let newRow = Math.floor(index / currentLevel.cols) + dir.row;
        let newCol = (index % currentLevel.cols) + dir.col;
        let newIndex = newRow * currentLevel.cols + newCol;

        if (newRow >= 0 && newRow < currentLevel.rows && newCol >= 0 && newCol < currentLevel.cols) {
            const neighborCell = cells[newIndex];
            if (neighborCell.classList.contains('flag')) {
                flagCount++;
            }
        }
    });

    // Логируем количество флажков
    console.log(`Флажков вокруг: ${flagCount}`);

    // Если количество флажков уже равно количеству мин, не нужно подсвечивать клетки
    if (flagCount === count) {
        console.log("Флажков достаточно, не подсвечиваем клетки.");
        return;
    }

    // Подсвечиваем соседние клетки, если они закрыты и не помечены флажками
    directions.forEach(dir => {
        let newRow = Math.floor(index / currentLevel.cols) + dir.row;
        let newCol = (index % currentLevel.cols) + dir.col;
        let newIndex = newRow * currentLevel.cols + newCol;

        if (newRow >= 0 && newRow < currentLevel.rows && newCol >= 0 && newCol < currentLevel.cols) {
            const neighborCell = cells[newIndex];

            // Логируем обработку соседних клеток
            console.log(`Проверка клетки с индексом ${newIndex} (ряд ${newRow}, колонка ${newCol})`);

            // Если соседняя клетка не открыта и не помечена флажком, то подсвечиваем
            if (!neighborCell.classList.contains('open') && !neighborCell.classList.contains('flag')) {
                neighborCell.classList.add('highlight');
                console.log(`Подсвечена клетка ${newIndex}`);
            }
        }
    });

    // Убираем подсветку через 500 миллисекунд
    setTimeout(() => {
        directions.forEach(dir => {
            let newRow = Math.floor(index / currentLevel.cols) + dir.row;
            let newCol = (index % currentLevel.cols) + dir.col;
            let newIndex = newRow * currentLevel.cols + newCol;

            if (newRow >= 0 && newRow < currentLevel.rows && newCol >= 0 && newCol < currentLevel.cols) {
                const neighborCell = cells[newIndex];
                neighborCell.classList.remove('highlight');
                console.log(`Удалена подсветка у клетки ${newIndex}`);
            }
        });
    }, 500);
}




function revealMines() {
    mines.forEach(index => {
        const cell = cells[index];
        cell.classList.add('open');  // Открываем мину
        cell.innerHTML = '💥';  // Показываем символ мины
    });
}

function checkWin() {
    const currentLevel = levels[level - 1];
    const unopenedCells = Array.from(cells).filter(cell => !cell.classList.contains('open') && !cell.classList.contains('flag'));

    if (unopenedCells.length === currentLevel.mines) {
        clearInterval(timer);
        if (level < levels.length) {
            level++;
            startGame();
        } else {
            showGameOverModal('Вы выиграли!');
        }
    }
}

function startTimer() {
    timer = setInterval(() => {
        levels[level - 1].time--;
        document.getElementById('timer').innerText = formatTime(levels[level - 1].time);

        if (levels[level - 1].time <= 0) {
            clearInterval(timer);
            showGameOverModal('Время вышло!');
        }
    }, 1000);
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function showGameOverModal(message) {
    alert(message);
    startGame();
}

document.getElementById('start-button').addEventListener('click', startGame);
