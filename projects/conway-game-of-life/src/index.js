const rows = 20;
const cols = 21;

const isInRange = (value, min, max) => value >= min && value < max;

const deadOrAlive = (row, col, arr) =>
  isInRange(row, 0, rows) &&
  isInRange(col, 0, cols) &&
  arr[row * cols + col] ? 1 : 0;

const countLivingNeighboursByPosition = (row, col, arr) =>
  deadOrAlive(row - 1, col - 1, arr) +
  deadOrAlive(row - 1, col, arr) +
  deadOrAlive(row - 1, col + 1, arr) +
  deadOrAlive(row, col - 1, arr) +
  deadOrAlive(row, col + 1, arr) +
  deadOrAlive(row + 1, col - 1, arr) +
  deadOrAlive(row + 1, col, arr) +
  deadOrAlive(row + 1, col + 1, arr);

const countLivingNeighbours = (alive, index, arr) =>
  [alive, countLivingNeighboursByPosition(Math.floor(index / cols), index % cols, arr)];

const livingCellWith2Or3LivingNeighbours = (alive, livingNeighbours) =>
  alive && [2, 3].includes(livingNeighbours);

const deadCellWith3LivingNeighbours = (alive, livingNeighbours) =>
  !alive && livingNeighbours === 3;

const rules = [livingCellWith2Or3LivingNeighbours, deadCellWith3LivingNeighbours];

const isAlive = ([alive, livingNeighbours]) =>
  rules.some(rule => rule(alive, livingNeighbours));

const nextGeneration = cells => cells
  .map(countLivingNeighbours)
  .map(isAlive);

function GameOfLife() {
  let intervalId;
  let speedSubscription;

  this.cells = ko.observableArray(Array(rows * cols).fill(false));
  this.started = ko.observable(false);
  this.speed = ko.observable(2);

  this.toggle = (data, index) => {
    this.cells.splice(index, 1, !data);
  };

  const animate = () => {
    this.cells.splice(0, this.cells().length, ...nextGeneration(this.cells.slice()));
  };

  const changeSpeed = newSpeed => {
    clearInterval(intervalId);
    intervalId = setInterval(animate, 1000 / newSpeed);
  };

  this.start = () => {
    this.started(true);

    intervalId = setInterval(animate, 1000 / this.speed());
    speedSubscription = this.speed.subscribe(changeSpeed);
  };

  this.stop = () => {
    this.started(false);

    clearInterval(intervalId);
    speedSubscription.dispose();
  }
}

ko.applyBindings(new GameOfLife());