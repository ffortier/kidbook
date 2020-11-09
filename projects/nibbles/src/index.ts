type SnakeStrategy = (snake: Snake, block: Block) => void;

const eatStrategy = (snake: Snake, block: Block) => snake.eat(block);
const dieStrategy = (snake: Snake) => snake.die();
const advanceStrategy = (snake: Snake, block: Block) => snake.advance(block);

interface Neighbour {
  applyStrategy(snake: Snake): void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const noNeighbour: Neighbour = {
  applyStrategy(snake: Snake): void {
    dieStrategy(snake);
  }
};

class Block {
  private neighbours: Partial<Record<Direction, Block>> = {};

  get isEmpty(): boolean {
    return this.color === null;
  }

  constructor(
    private rect: Rect,
    private color: string | null = null,
    private strategy: SnakeStrategy = advanceStrategy,
  ) { }

  clear(): void {
    this.color = null;
    this.strategy = advanceStrategy;
  }

  define(color: string, strategy: SnakeStrategy): void {
    this.color = color;
    this.strategy = strategy;
  }

  applyStrategy(snake: Snake) {
    this.strategy(snake, this);
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.color !== null) {
      context.fillStyle = this.color;
      context.fillRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    }
  }

  getNeighbour(direction: Direction): Neighbour {
    return this.neighbours[direction] ?? noNeighbour;
  }

  setNeighbour(direction: Direction, neighbour: Block) {
    this.neighbours[direction] = neighbour;
  }
}

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}

interface DirectionObserver {
  direction: Direction;
}

interface FoodDistributor {
  distributeFood(): void;
}

class Snake extends EventTarget implements DirectionObserver {
  private dead = false;

  get isDead(): boolean {
    return this.dead;
  }

  constructor(
    private blocks: [Block, ...Block[]],
    private color: string,
    public direction = Direction.RIGHT
  ) {
    super();
  }

  move(): void {
    const head = this.blocks[this.blocks.length - 1];

    head.getNeighbour(this.direction).applyStrategy(this);
  }

  eat(block: Block): void {
    this.pushHead(block);
    this.dispatchEvent(new CustomEvent('eat'));
  }

  die(): void {
    this.dead = true;
    this.dispatchEvent(new CustomEvent('die'));
  }

  advance(block: Block): void {
    this.blocks.shift()?.clear();
    this.pushHead(block);
  }

  private pushHead(head: Block): void {
    head.define(this.color, dieStrategy);

    this.blocks.push(head);
  }
}

const keyDirections: Readonly<Record<string, Direction>> = {
  ArrowUp: Direction.UP,
  ArrowRight: Direction.RIGHT,
  ArrowDown: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
};

class KeyHandler implements EventListenerObject {
  private observers: DirectionObserver[] = [];

  subscribe(observer: DirectionObserver): void {
    this.observers.push(observer);
  }

  handleEvent(event: KeyboardEvent): void {
    const direction = keyDirections[event.key];

    if (typeof direction !== 'undefined') {
      event.preventDefault();
      this.notify(direction);
    }
  }

  private notify(direction: Direction) {
    this.observers.forEach(observer => observer.direction = direction);
  }
}

interface BlockFactory {
  createBlocks(): [Block, ...Block[]];
}

function assertCondition(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

class Matrix2DBlockFactory implements BlockFactory {
  constructor(
    private readonly rows: number,
    private readonly cols: number,
    private readonly blockSize: number,
  ) {
    assertCondition(rows > 0, 'Rows must be greater than 0');
    assertCondition(cols > 0, 'Cols must be greater than 0');
    assertCondition(blockSize > 0, 'Block size must be greater than 0');
  }

  createBlocks(): [Block, ...Block[]] {
    return Array.from(this.buildRows()) as [Block, ...Block[]];
  }

  private buildRows(): [Block, ...Block[]] {
    let row = this.buildRow(0);

    const blocks: [Block, ...Block[]] = [...row];

    for (let i = 1; i < this.rows; i++) {
      let nextRow = this.buildRow(i);

      nextRow.forEach((block, j) => {
        block.setNeighbour(Direction.UP, row[j]);
        row[j].setNeighbour(Direction.DOWN, block);
      });

      row = nextRow;
      blocks.push(...row);
    }

    return blocks;
  }

  private buildRow(row: number): [Block, ...Block[]] {
    let block = new Block(this.getRect(row, 0));

    const blocks: [Block, ...Block[]] = [block];

    for (let i = 1; i < this.cols; i++) {
      const nextBlock = new Block(this.getRect(row, i));
      nextBlock.setNeighbour(Direction.LEFT, block);
      block.setNeighbour(Direction.RIGHT, nextBlock);
      block = nextBlock;
      blocks.push(block);
    }

    return blocks;
  }

  private getRect(row: number, col: number): Rect {
    return {
      x: col * this.blockSize,
      y: row * this.blockSize,
      w: this.blockSize,
      h: this.blockSize,
    };
  }
}

class Game implements FoodDistributor {
  private snake!: Snake;
  private blocks!: [Block, ...Block[]];
  private keyHandler = new KeyHandler();
  private context: CanvasRenderingContext2D;
  private intervalId?: number;

  constructor(
    private canvas: HTMLCanvasElement,
    private blockFactory: BlockFactory,
    private time = 200,
  ) {
    this.context = canvas.getContext('2d')!;
    this.init();
  }

  start(): void {
    this.intervalId = window.setInterval(() => this.loop(), this.time);
  }

  restart(): void {
    this.stop();
    this.init();
    this.start();
  }

  stop = (): void => {
    clearInterval(this.intervalId);

    this.canvas.ownerDocument.removeEventListener('keydown', this.keyHandler);
    this.snake.removeEventListener('eat', this.distributeFood);
    this.snake.removeEventListener('die', this.stop);
  }

  distributeFood = (): void => {
    let i = Math.floor(Math.random() * this.blocks.length);

    while (!this.blocks[i].isEmpty) {
      i = Math.floor(Math.random() * this.blocks.length);
    }

    this.blocks[i].define('red', eatStrategy);
  }

  private init(): void {
    this.canvas.ownerDocument.addEventListener('keydown', this.keyHandler);
    this.blocks = this.blockFactory.createBlocks();
    this.snake = new Snake([this.blocks[0]], 'green');
    this.keyHandler.subscribe(this.snake);
    this.distributeFood();

    this.snake.addEventListener('eat', this.distributeFood);
    this.snake.addEventListener('die', this.stop);
  }

  private loop(): void {
    this.snake.move();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.blocks.forEach(block => block.draw(this.context));
  }
}

(function main() {
  const canvas = document.createElement('canvas');
  const blockFactory = new Matrix2DBlockFactory(20, 30, 10);
  const game = new Game(canvas, blockFactory);

  canvas.width = 300;
  canvas.height = 200;
  canvas.style.backgroundColor = 'black';

  document.body.append(canvas);
  game.start();
})();