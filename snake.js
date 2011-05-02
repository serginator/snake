    /**
    * Snake game to get more fluency programming in JavaScript.
    * The first two games I wrote I was learning googling and reading a lot.
    * After that I stopped writting code and started to study 
    * the book Javascript The Good Parts from Douglas Crockford. And when I
    * finished it, then I started to make this one, in a complete different 
    * way of coding. Just check the code of Space Invaders and then check this
    * one. I think this is more clean and professional, well documented following
    * JSDOC, and maybe using some of the best parts of this language. Carlos Benítez
    * from www.etnassoft.com helped me a lot "forcing" me to do the functions and 
    * methods in the correct way and to document it right. And also helped me solving
    * closures problems and hoisting problems.
    *
    * Current Status:
    * Playable. 
	* Increased performance by more than 50% using a buffer to draw
    * outside the canvas and then drawing on the canvas just the complete image
    * of the buffer. I'll use that on every game from now on.
    * Refactorized several things, trying to avoid some redraws, drawing just 
    * when needed.
	*
	* ToDo
	* · Solve Insane speed (SOLVED)
	* · If you continue when you lose 3 lifes, the game continue forever
	*     like if you had infinite lives (SOLVED)
	* · Try to catch more accurately the arrows (SOLVED MORE OR LESS)
	* · Show the Score and the lives during game(SOLVED)
    *
    * @author Sergio Ruiz
    * @version 1.1 01-05-2011 01:32
    */
var snakeGame = (function(){
    
    /******************************************************************
                                    VARs
    ******************************************************************/
    /** @public */ var buffer, //Buffer
    /** @public */     bufferctx, //The context of the buffer
    /** @public */     canvas, //Canvas
    /** @public */     ctx, //The context of the canvas
    /** @public */     ctxWidth, //The width of the canvas
    /** @public */     ctxHeight;//The height of the canvas
    /** @public */ var intervalId = 0; //The interval for redrawing
    /** @public */ var backcolor = "#000000"; //Background color
    /** @public */ var newGame = true; //To load a presentation screen
    /** @public */ var gameOver = true; //Because I want first to load the newGame screen
    /** @public */ var yDown = false; //To check whether retry
    /** @public */ var nDown = false; //or not
    /** @public */ var pause = false; //To control if game is paused or not
    /** @public */ var snake, //To have global access to the snake (but it's not happening)
    /** @public */     fruit, //To have global access to the fruit (neither here)
    /** @public */     board; //To have global access to the board (or here)
    /** @public */ var fps = 30;
    /** @public */ var eriTramposilla = false;
    
    
    /******************************************************************
                                FUNCTIONS
    ******************************************************************/
    
    /**
    * Paint a circle.
    *
    * @inner
    * @param bufferctx {object} Buffer context
    * @param x {int} Coordenate point
    * @param y {int} Coordenate point
    * @param r {int} Radius
    * @return {this} To be able to chain functions
    */
    var circle = function(bufferctx, x, y, r){
        bufferctx.beginPath();
        bufferctx.arc(x, y, r, 0, Math.PI*2, true);
        bufferctx.closePath();
        bufferctx.fill();
        return this;
    };
    
    /**
    * Paint a rectangle.
    *
    * @inner
    * @param bufferctx {object} Buffer context
    * @param x {int} Coordenate point
    * @param y {int} Coordenate point
    * @param w {int} Width
    * @param h {int} Height
    * @return {this} To be able to chain functions
    */
    var rect = function(bufferctx, x, y, w, h){
        bufferctx.beginPath();
        bufferctx.rect(x, y, w, h);
        bufferctx.closePath();
        bufferctx.fill();
        return this;
    };
    
    /**
    * Clear the screen.
    *
    * @inner
    * @param bufferctx {object} Buffer context
    * @return {this} To be able to chain functions
    */
    var clear = function(bufferctx, ctxWidth, ctxHeight){
        bufferctx.clearRect(0, 0, ctxWidth, ctxHeight);
        //if we set bg to black, we don't need to paint a rect.
        //rect(bufferctx, 0,0,ctxWidth,ctxHeight);
        return this;
    };
    
    /**
    * Keyboard Controller
    * Taken the idea from www.nokarma.org
    *
    * @inner
    * @return {Key} Returns if a key is pressed down or released
    */
    var Key = {
        _pressed: {},
        
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SPACE: 32,
        YES: 89,
        NO: 78,
        PAUSE: 80,
        E: 69,
        
        /**
        * Check if key is down
        *
        * @return {Boolean} True or false if key keyCode is down
        */
        isDown: function(keyCode){
            return this._pressed[keyCode];
        },
        
        /**
        * Set to true if the key is down
        *
        * @return {this} To chain methods
        */
        onKeydown: function(event){
            this._pressed[event.keyCode] = true;
            return this;
        },
        
        /**
        * Delete the key when you release it
        *
        * @return {this} To chain methods
        */
        onKeyup: function(event){
            delete this._pressed[event.keyCode];
            return this;
        }
    };
    window.addEventListener('keyup', function(event){ Key.onKeyup(event); }, false);
    window.addEventListener('keydown', function(event){ Key.onKeydown(event); }, false);
    
    /**
    * Check game keys (not movement keys)
    *
    * @inner
    * @return {this} To be able to chain functions
    */
    var checkGameKeys = function(){
        if(Key.isDown(Key.SPACE)){
            if(newGame === true) //To skip the first screen
            {
                newGame = false;
                gameOver = false;
            }
        }
        if(Key.isDown(Key.YES)){
            if(!yDown){
				yDown = true;
			}
            else{
				yDown = false;
			}
        }
        if(Key.isDown(Key.NO)){
            nDown = true;
        }
        if(Key.isDown(Key.PAUSE)){
            if(!pause){
				pause = true;
			}
            else{
				pause = false;
			}
        }
        if(Key.isDown(Key.E)){
            if(!eriTramposilla){
                eriTramposilla = true;
                console.log("eriTramposilla mode activated, infinite lives.");
            }
            else{
                eriTramposilla = false;
                console.log("eriTramposilla mode deactivated.");
            }
        }
        return this;
    };
    
    /**
    * Augment Array with an initializer for matrix.
    *
    * @augments Array
    * @param m {int} Number of columns of the matrix
    * @param n {int} Number of raws of the matrix
    * @param initial {int} The init value of the elements
    * @return {mat} Returns the matrix
    */
    Array.matrix = function(m, n, initial){
        var a, i, j, mat = [];
        for(i = 0; i < m; i++){
            a = [];
            for(j = 0; j < n; j++){
                a[j] = initial;
            }
            mat[i] = a;
        }
        return mat;
    };
    
    /**
    * Construct a new Board object.
    *
    * @class This is the class for the Board
    * @constructor
    * @param bufferctx {object} Buffer context
    * @return {this} Returns the Board
    */
    function Board(bufferctx){
        /** @private */ var cols = 45; // so 450/45 = 10px
        /** @private */ var rows = 33; // so 330 / 33 = 10px
        /** @private */ var boardArray;
        /** @private */ var score = 0;
        /** @private */ var square = new Image();
        square.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAcSURBVHjaYvz//z8DbsDEgBeMVGkAAAAA//8DAKXjAxE70RLzAAAAAElFTkSuQmCC';
        
        /**
        * Get columns
        *
        * @return {int} Return the cols
        */
        this.getCols = function(){
            return cols;
        };
        
        /**
        * Get rows
        *
        * @return {int} Return the rows
        */
        this.getRows = function(){
            return rows;
        };
        
        /**
        * Get boardArray
        *
        * @return {Array} Return the array
        */
        this.getArray = function(){
            return boardArray;
        };
        
        /**
        * Get value from boardArray
        *
        * @param posX {int} Coordinate X
        * @param posY {int} Coordinate Y
        * @return {int} Return the value
        */
        this.getValue = function(posX, posY){
            return boardArray[posX][posY];
        };
        
        /**
        * Set value on boardArray
        *
        * @param posX {int} Coordinate X
        * @param posY {int} Coordinate Y
        * @param value {int} Value to set
        * @return {this} To be able to chain methods
        */
        this.setValue = function(posX, posY, v){
            boardArray[posX][posY] = v;
            return this;
        };
        
        /**
        * Get score
        *
        * @return {int} Return the value
        */
        this.getScore = function(){
            return score;
        };
        
        /**
        * Set score
        *
        * @param value {int} The value to add
        * @return {this} To be able to chain methods
        */
        this.setScore = function(value){
            score = value;
			return this;
        };
        
        /**
        * Init the matrix board to 0
        *
        * @return {this} To be able to chain methods
        */
        this.initBoard = function(){
            boardArray = Array.matrix(cols, rows, 0);
            for(var i = 0; i < cols; i++){
                boardArray[i][0] = 1;
                boardArray[i][rows - 1] = 1;
                for(var j = 0; j < rows; j++){
                    boardArray[0][j] = 1;
                    boardArray[cols - 1][j] = 1;
                }
            }
            return this;
        };
        
        /**
        * Draw the Board.
        * Use an image embebed in base64 of a white square
        * with dimensions 10x10px. Draw it on all the positions
        * with a 1 on the array.
        *
        * @param bufferctx {object} Buffer context
        * @return {this} To be able to chain functions
        */
        this.drawBoard = function(bufferctx){
            for(var i = 0; i < cols; i++){
                for(var j = 0; j < rows; j++){
                    if(boardArray[i][j] === 1){
                        //Draw a square every 10px
                        bufferctx.drawImage(square, i * 10, j * 10);
                    }
                }
            }
			return this;
        };
    }
    
    /**
    * Construct a new Fruit object.
    *
    * @class This is the class for the Fruit
    * @constructor
    * @param board {Board} To be able to access board
    * @return {this} Returns the Fruit
    */
    function Fruit(board){
        /** @private */ var score = 50;
        /** @private */ var posX = 0;
        /** @private */ var posY = 0;
        
        /**
        * Get score
        *
        * @return {int} Return the score
        */
        this.getScore = function(){
            return score;
        };
        
        /**
        * Get posX
        *
        * @return {int} Return posX
        */
        this.getPosX = function(){
            return posX;
        };
        
        /**
        * Get posY
        *
        * @return {int} Return posY
        */
        this.getPosY = function(){
            return posY;
        };
        
        /**
        * Randomize the coordinates of the Fruit.
        *
        * @param board {Board} The board of the game. To access to cols and rows
        * @return {this} To be able to chain functions
        */
        this.randomPos = function(board){
            posX = Math.floor(Math.random() * board.getCols());
            posY = Math.floor(Math.random() * board.getRows());
			return this;
        };
        
        /**
        * Put the new Fruit.
        * Do randomPos() while the Fruit new coordinates
        * collides with the border of the Board.
        * Set the place on those coordinates of the array to 1
        *
        * @param board {Board} The board to get and set values
        * @return {this} To be able to chain functions
        */
        this.putNewFruit = function(board){
            var check = false;
            while(!check){
                this.randomPos(board);
                if(board.getValue(posX, posY) !== 1){
                    check = true;
                }
            }
            board.setValue(posX, posY, 1);
			return this;
        };
    }
    
    /**
    * Construct a new Snake object.
    *
    * @class This is the class for the Snake
    * @constructor
    * @param board {Board} The board
    * @param fruit {Fruit} The fruit
    * @return {this} Returns the Snake
    */
    function Snake(board, fruit){
        /** @private */ var lives = 3;
        /** @private */ var posX = 6;
        /** @private */ var posY = 13;
        /** @private */ var auxX = 0;
        /** @private */ var auxY = 0;
        /** @private */ var tailX = 6;
        /** @private */ var tailY = 13;
        /** @private */ var arrayMoves = ['right']; //To save movements for tail moving later
        /** @private */ var currentMove = arrayMoves[arrayMoves.length - 1];
        /** @private */ var nextMove = 'right'; //To anticipate collisions        
        /** @private */ var increaseTail = 3; //It will be 3 every time we eat a fruit
        
        board.setValue(posX, posY, 1); //To initialize the Snake on the board
        
        /**
        * Get currentMove
        *
        * @return {String} Return the value
        */
		this.getCurrentMove = function(){
			return currentMove;
		};
		
		/**
        * Set score
        *
        * @param move {String} The next move to set
        * @return {this} To be able to chain methods
        */
		this.setNextMove = function(move){
			nextMove = move;
			return this;
		};
		
		/**
        * Get lives
        *
        * @return {int} Lives of the snake
        */
		this.getLives = function(){
		    return lives;
		};
		
		/**
        * Set lives
        *
        * @param l {int} The lives to set
        * @return {this} To be able to chain methods
        */
		this.setLives = function(l){
		    lives = l;
		};
		
        /**
        * Check the key pressed for the snake movement. As I have to
        * use snake, I couldn't use it outside Snake "class" so here is it.
        *
        * @return {this} To be able to chain methods.
        */
		this.checkKeys = function(){
		    if(Key.isDown(Key.UP)){
                if(currentMove !== 'down'){
                    nextMove = 'up';
                }
            }
            if(Key.isDown(Key.DOWN)){
                if(currentMove !== 'up'){
                    nextMove = 'down';
                }
            }
            if(Key.isDown(Key.LEFT)){
                if(currentMove !== 'right'){
                    nextMove = 'left';
                }
            }
            if(Key.isDown(Key.RIGHT)){
                if(currentMove !== 'left'){
                    nextMove = 'right';
                }
            }
            return this;
		};
		
		
        /**
        * Check if the next movement can be done.
        * Catch the last movement on the array. Copy the coordinates on 
        * auxiliary ones. Change the auxiliary coordinates.
        * If that position has a 1 on the board check if it's a fruit or a wall.
        * If it's a fruit or the position is 0, make the movement.
        *
        * @param board {Board} The board of the game to get values
        * @param fruit {Fruit} The fruit, to check coordenates
        * @return {Boolean} If the movement can be done, return true.
        */
        this.checkMove = function(board, fruit){
            /** @private */ var move = arrayMoves[arrayMoves.length - 1];
            auxX = posX;
            auxY = posY;
            if(move === 'up'){
                auxY--;
                currentMove = 'up';
            }
            else if(move === 'down')
            {
                auxY++;
                currentMove = 'down';
            }
            else if(move === 'left'){
                auxX--;
                currentMove = 'left';
            }
            else if(move === 'right'){
                auxX++;
                currentMove = 'right';
            }
            if(board.getValue(auxX, auxY) === 1){ //A fruit or a wall
                if((auxX === fruit.getPosX()) && (auxY === fruit.getPosY())){ //A fruit
                    this.eatFruit(board, fruit);
                    return true;
                }
                else{ //A wall
                    return false;
                }
            }
            else{ //A free move
                return true;
            }
        };
        
        /**
        * Move the Snake.
        * Check if the movement can be done.
        * If true, copy the auxiliary coordinates to the real ones
        * and push the nextMove to the arrayMoves.
        *
        * @param board {Board} The board of the game
        * @param fruit {Fruit} The fruit
        * @return {Boolean} To check if we have to move the Tail or not
        */
        this.moveSnake = function(board, fruit){
            if(this.checkMove(board, fruit)){
                posX = auxX;
                posY = auxY;
                board.setValue(posX, posY, 1);
                arrayMoves.push(nextMove);
                return true;
            }
            else{
                if(!eriTramposilla){
                    lives--;
                }
                if(lives === 0 && !eriTramposilla){
                    gameOver = true;
                    lives = 3;
                    yDown = false;
                }
                board.initBoard();
                posX = 6;
                posY = 13;
                tailX = 6;
                tailY = 13;
                arrayMoves = ['right']; //To save movements for tail moving later
                currentMove = arrayMoves[arrayMoves.length - 1];
                nextMove = 'right'; //To anticipate collisions        
                increaseTail = 3; //It will be 3 every time we eat a fruit
                board.setValue(posX, posY, 1);
                //resetea fruta
                fruit.putNewFruit(board);
                return false;
            }
        };
        
        /**
        * Move the tail of the Snake.
        * If the tail is increasing, decrease it by 1.
        * Else set the value of the tail on the array at 0.
        * Catch the first movement on the arrayMoves.
        * Change the coordinate.
        *
        * @param board {Board} The board to set values
        * @return {this} To be able to chain functions
        */
        this.moveTail = function(board){
            if(increaseTail === 0){
                board.setValue(tailX, tailY, 0);
                /** @private */ var move = arrayMoves.shift();
                if(move === 'up'){
					tailY--;
				}
                else if(move === 'down'){
					tailY++;
				}
                else if(move === 'left'){
					tailX--;
				}
                else if(move === 'right'){
					tailX++;
				}
            }
            else{
                increaseTail--;
            }
            return this;
        };
        
        /**
        * Eat the Fruit.
        * Set increaseTail value to 3. Increase the board.score.
        * Randomize the coordinates of the Fruit.
        *
        * @param board {Board} The board to set the score
        * @param fruit {Fruit} The fruit to put a new one
        * @return {this} To be able to chain functions
        */
        this.eatFruit = function(board, fruit){
            increaseTail = 3;
            board.setScore(board.getScore() + fruit.getScore());
            fruit.putNewFruit(board);
            return this;
        };
        return this;
    }
    
    /**
    * Set the score.
    * Draws a rectangle on the bottom of the buffer and
    * put on it the score, credits and date.
    *
    * @inner
    * @param bufferctx {object} Buffer context
    * @param board {Board} The board of the game
    * @param snake {Snake} The snake
    * @param ctxWidth {int} The width of the context of the canvas
    * @return {this} To be able to chain functions
    */
    var setScore = function(bufferctx, board, snake, ctxWidth){ //Set the score at the bottom left
        bufferctx.fillStyle = "#8b8989";
        rect(bufferctx, 0, 335, 180, 15);
        bufferctx.fillStyle = "#000000";
        bufferctx.font = "italic 400 12px/2 Unknown Font, sans-serif";
        bufferctx.fillText("Score: " + board.getScore() + " // Lives: " + snake.getLives(), 10, 345);
		return this;
    };
    
    /**
    * Draw on the canvas
    *
    * @inner
    * @param bufferctx {object} Buffer context
    * @param ctx {object} Canvas context
    * @param buffer {object} Buffer
    * @param ctxWidth {int} The width of the context of the canvas
    * @param ctxHeight {int} The height of the context of the canvas
    * @param board {Board} The board of the game
    * @param snake {Snake} The Snake
    * @param fruit {Fruit} The fruit
    * @return {this} To be able to chain functions
    */
    function draw(bufferctx, ctx, buffer, ctxWidth, ctxHeight, board, snake, fruit){ //Draw the canvas
        //First clean the screen
        bufferctx.fillStyle = backcolor; 
        clear(bufferctx, ctxWidth, ctxHeight);
        clear(ctx, ctxWidth, ctxHeight);
        checkGameKeys();
        snake.checkKeys();
        if(!gameOver){ //If the game isn't over
            if(!pause){
                board.drawBoard(bufferctx);
                
                if(snake.moveSnake(board, fruit)){ 
                    snake.moveTail(board);
                }
                
                setScore(bufferctx, board, snake, ctxWidth); //Draw and set the score
            } 
            else{ //pause true
                bufferctx.fillStyle = "red";
                bufferctx.font = "italic 400 30px/2 Unknown Font, sans-serif";
                bufferctx.fillText("Pause", 100, 170);
                bufferctx.font = "italic 400 30px/2 Unknown Font, sans-serif";
                bufferctx.fillText("Press P to continue", 120, 250);
            }
        }
        else{ //gameOver true
            if(newGame){ //Just at the beginning of the game
                bufferctx.fillStyle = "#8b8989";
                rect(bufferctx, 0, 335, ctxWidth, 15); //Create a rectangle at the bottom
                bufferctx.font = "italic 400 50px/2 Unknown Font, sans-serif";
                bufferctx.fillStyle = "white";
                bufferctx.fillText("Snake", 20, 200); 
                bufferctx.font = "italic 400 20px/2 Unknown Font, sans-serif";
                bufferctx.fillText("by Sergio Ruiz. 2011", 20, 230);
                bufferctx.fillStyle = "red";
                bufferctx.fillText("Move: Up, Down, Left, Right", 150, 50);
                bufferctx.fillText("Pause: P", 150, 80);
    	        bufferctx.font = "italic 400 20px/2 Unknown Font, sans-serif";
                bufferctx.fillText("Press space", 270, 230);
                bufferctx.font = "italic 400 12px/2 Unknown Font, sans-serif";
                bufferctx.fillText("01-05-2011", 385, 345);
                bufferctx.fillStyle = "#FF0000";
                bufferctx.fillText("Sergio Ruiz", 190, 345);
            }
            else{ //If you lose
                bufferctx.fillStyle = "red";
                bufferctx.font = "italic 400 30px/2 Unknown Font, sans-serif";
                bufferctx.fillText("You lose!", 150, 150);
                bufferctx.font = "italic 400 20px/2 Unknown Font, sans-serif";
                bufferctx.fillText("Score: " + board.getScore(), 150, 200);
                bufferctx.font = "italic 400 30px/2 Unknown Font, sans-serif";
                bufferctx.fillText("retry? (y or click, n)", 100, 250);
                if(yDown){
                    gameOver = false;
                    board.setScore(0);
                }
                else if(nDown){ //Say good bye and end the drawing
                    bufferctx.fillStyle = backcolor; 
                    clear(bufferctx, ctxWidth, ctxHeight);
                    bufferctx.fillStyle = "red";
                    bufferctx.font = "italic 400 30px/2 Unknown Font,sans-serif";
                    bufferctx.fillText("Good bye!", 100, 100);
                    bufferctx.font = "italic 400 40px/2 Unknown Font, sans-serif";
                    bufferctx.fillText("Thanks for playing", 70, 150);
                    clearInterval(intervalId);
                    nDown = false;
                }
            }
        }
        //Copy the image of the buffer (invisible) to the 
        //canvas context (visible)
        ctx.drawImage(buffer, 0, 0); 
		return this;
    }
    
    /******************************************************************
                               MAIN PROGRAM
    ******************************************************************/
    
    /**
    * Init the game. Draw every X ms
    *
    * @inner
    * @param buffer {object} Buffer
    * @param bufferctx {object} Buffer context
    * @param canvas {object} Canvas
    * @param ctx {object} Canvas context
    * @param ctxWidth {number} Canvas width
    * @param ctxHeigth {number} Canvas heigth
    * @param board {Board} The board of the game
    * @param snake {Snake} The Snake of the game
    * @param fruit {Fruit} The Fruits of the game
    * @param intervalId {int} The interval of the draws
    * @return {int} To call every x ms the method draw
    */
    (function(buffer, bufferctx, canvas, ctx, ctxWidth, ctxHeight, board, snake, fruit, fps){
        buffer = document.createElement("canvas");
        bufferctx = buffer.getContext("2d");
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d");
        buffer.width = canvas.width;
        buffer.height = canvas.height;
        ctxWidth = buffer.width;
        ctxHeight = buffer.height - 15; //because of the bottom bar with Score
        
        board = new Board(bufferctx); //Init the Board     
        board.initBoard();
        fruit = new Fruit(board); //Init the Fruit
        snake = new Snake(board, fruit); //Init the Snake
        
        fruit.putNewFruit(board);
        
        intervalId = setInterval(function(){draw(bufferctx, ctx, buffer, ctxWidth, ctxHeight, board, snake, fruit)}, 50);
        return intervalId;
    }(buffer, bufferctx, canvas, ctx, ctxWidth, ctxHeight, board, snake, fruit));
    
})();
