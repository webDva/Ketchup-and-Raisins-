module KawaiiKetchup {
    /*
     * Boot state for only loading the loading screen
     */
    export class BootState extends Phaser.State {
        constructor() {
            super();
        }

        init() {
            // Set scale using ScaleManager
            this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        }

        preload() {
            // Load loading screen image
        }

        create() {
            // Start true loading state
            this.game.state.start("PreloadState");
        }
    }

    /*
     * Preload state for actually loading assets
     */
    export class PreloadState extends Phaser.State {
        constructor() {
            super();
        }

        preload() {
            // Display the loading screen image

            // Load assets
        }

        create() {
            this.game.state.start("MainMenuState");
        }
    }

    // Enum for the controls.
    export enum Movement {
        Left,
        Right,
        Up,
        Down
    }

    /*
     * Derived KetchupSprite class for handling ketchup bottle properties.
     */
    export class KetchupSprite extends Phaser.Sprite {
        constructor(game: Phaser.Game, x: number, y: number, key: string) {
            super(game, x, y, key);

            this.scale.setTo(0.3, 0.3);
            this.game.physics.arcade.enable(this);
            this.body.gravity = new Phaser.Point(-this.game.physics.arcade.gravity.x, PlayingState.GRAVITY_Y_COMPONENT);
            this.anchor.setTo(0.5, 0.5); // Set the center of the ketchup bottles.

            // Timers for ketchup actions.

            // TTL timer.
            let TTLTimer = this.game.time.create();
            TTLTimer.add(PlayingState.KETCHUP_TTL, () => this.destroy(), this);

            // Start the timers
            TTLTimer.start();

            // Add to the display, but the physics system already did this, so this is redundant.
            this.game.stage.addChild(this);
        }

        explode() {
            // Disable the ketchup bottle's physics body so that it will no longer collide as it's now exploding and dying.
            this.body.enable = false;

            // Change the texture of the ketchup bottle to an explosion.
            this.loadTexture('explosion');
            this.scale.setTo(0.01, 0.01); // then set its size to zero

            // An animation tween for creating an explosion effect. When done animating, kills the ketchup sprite.
            let tween = this.game.add.tween(this.scale).to({ x: 1, y: 1 }, 300, "Linear", true);
            tween.onComplete.add(() => {
                this.destroy();
            }, this);
        }
    }

    export class RaisinSprite extends Phaser.Sprite {
        constructor(game: Phaser.Game, x: number, y: number, key: string) {
            super(game, x, y, key);

            this.game.physics.arcade.enable(this);
            this.body.gravity = new Phaser.Point(-this.game.physics.arcade.gravity.x, PlayingState.GRAVITY_Y_COMPONENT * 1.65);

            // Good size!
            this.scale.setTo(0.5, 0.5);

            this.game.stage.addChild(this);

            let TTLTimer = this.game.time.create();
            TTLTimer.add(PlayingState.KETCHUP_TTL, () => this.destroy(), this);
            TTLTimer.start();
        }
    }

    /*
     * Main menu state
     */
    export class MainMenuState extends Phaser.State {

        music: Phaser.Sound;
        backgroundTile: Phaser.TileSprite;

        constructor() {
            super();
        }

        init() {
            this.game.stage.backgroundColor = "#521529";
        }

        preload() {
            this.game.load.spritesheet('startButton', 'assets/startButton.png', 640, 400);
            this.game.load.spritesheet('creditsButton', 'assets/creditsButton.png', 640, 400);
            this.game.load.image('twitter', 'assets/twitter share.png');
            this.game.load.image('happyKetchup', 'assets/happyKetchup.png');

            this.game.load.audio('newsong', 'assets/Menu_3_mp3.mp3');

            let buttonBackgroundOut = this.game.add.bitmapData(640, 400);
            buttonBackgroundOut.rect(0, 0, 640, 400, 'rgb(0, 0, 0, 0)');
            this.game.cache.addBitmapData('buttonBackgroundOut', buttonBackgroundOut);

            let buttonBackgroundOver = this.game.add.bitmapData(64, 64);
            buttonBackgroundOver.rect(0, 0, 64, 64, 'rgb(66, 134, 244)');
            this.game.cache.addBitmapData('buttonBackgroundOver', buttonBackgroundOver);
        }

        create() {
            this.music = this.game.add.audio('newsong');
            this.music.onDecoded.add(() => {
                this.music.fadeIn(10500, true);
            }, this);

            let upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            upKey.onDown.add(() => {
                currentSelection.frame ^= 1; // xor toggle
                currentSelection = selectionGroup.next();
                currentSelection.frame ^= 1;
            }, this);

            let downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
            downKey.onDown.add(() => {
                currentSelection.frame ^= 1;
                currentSelection = selectionGroup.next();
                currentSelection.frame ^= 1;
            }, this);

            let enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
            enterKey.onDown.add(() => {
                if (currentSelection.key === 'startButton') this.startGame();
                else if (currentSelection.key === 'creditsButton') this.showCredits();
            }, this);

            this.backgroundTile = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'happyKetchup');
            this.game.add.tween(this.backgroundTile.tileScale).to({ x: 0.96, y: 0.96 }, 2102, null, true, 0, -1, true);

            let startButton = this.game.add.button(this.game.world.centerX, 100, 'startButton', this.startGame, this, 0, 1);
            startButton.scale.set(0.5, 0.5);
            startButton.anchor.set(0.5, 0);

            let creditsButton = this.game.add.button(this.game.world.centerX, startButton.bottom + 10, 'creditsButton', this.showCredits, this, 1, 0);
            creditsButton.scale.set(0.5, 0.5);
            creditsButton.anchor.set(0.5, 0);

            let twitterShare = this.game.add.button(this.game.world.centerX / 3, this.game.world.centerY, 'twitter', () => {
                window.open("https://twitter.com/webDva");
            }, this);
            twitterShare.scale.set(0.3, 0.3);
            twitterShare.anchor.set(0.5, 0.5);
            twitterShare.angle = -45;

            let selectionGroup = this.game.add.group();
            selectionGroup.addMultiple([startButton, creditsButton]);

            let currentSelection = selectionGroup.getFirstAlive();
            currentSelection.frame = 0;
        }

        update() {
            this.backgroundTile.tilePosition.x += -1;
            this.backgroundTile.tilePosition.y += -1;
        }

        startGame() {
            this.game.state.start("PlayingState", true, true);
        }

        showCredits() {
            this.game.state.start("CreditsState", true, true);
        }
    }

    /*
     * Credits
     */
    export class CreditsState extends Phaser.State {

        backText: Phaser.Text;
        attributionText: Phaser.Text;
        quietMusic: Phaser.Sound;

        constructor() {
            super();
        }
        init() { }
        preload() {
            this.game.load.audio('newsong', 'assets/Menu_3_mp3.mp3');
        }
        create() {
            this.quietMusic = this.game.add.audio('newsong');
            this.quietMusic.onDecoded.add(() => {
                this.quietMusic.play('', 0, 0.3, true);
            }, this);

            this.attributionText = this.game.add.text(
                this.game.world.centerX,
                this.game.world.centerY, 'Music by Final Gate Studios\nhttps://finalgatestudios.itch.io/music-pack-1', {
                    font: '3em sans-serif',
                    fill: '#ffffff',
                    align: 'center'
                }
            );
            this.attributionText.anchor.setTo(0.5, 0.5);

            this.backText = this.game.add.text(
                this.game.world.centerX,
                this.game.height - 20,
                "Return to main menu", {
                    font: '4em Impact',
                    fill: '#ffffff',
                    align: 'center'
                }
            );
            this.backText.anchor.setTo(0.5, 1);
            this.backText.inputEnabled = true;
            this.backText.events.onInputDown.add(() => {
                this.game.state.start("MainMenuState", true, true);
            }, this);

            let enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
            enterKey.onDown.add(() => {
                this.game.state.start("MainMenuState", true, true);
            }, this);
        }
    }

    /*
     * The main game running state
     */
    export class PlayingState extends Phaser.State {

        game: Phaser.Game;

        player: Phaser.Sprite;
        currentHealth: number;
        score: number;
        textScore: Phaser.Text;

        ketchupGroup: Phaser.Group;
        foodCollectibleGroup: Phaser.Group;

        healthBar: Phaser.Graphics;

        // keyboard cursor key controls
        cursorKeys: Phaser.CursorKeys;
        wasdKeys: any;

        // onscreen controls sprites
        aButton: Phaser.Button;
        bButton: Phaser.Button;
        leftButton: Phaser.Button;
        rightButton: Phaser.Button;

        // booleans for button holding
        isAButtonPressed: boolean;
        isBButtonPressed: boolean;
        isLeftButtonPressed: boolean;
        isRightButtonPressed: boolean;

        watermark: Phaser.Text; // text for watermark for demo version

        collectRaisinSound: Phaser.Sound;
        ketchupHitSound: Phaser.Sound;

        loopMusic: Phaser.Sound;

        spawnEpisode: number;

        // A bunch of constant values.

        static MOVEMENT_SPEED: number = 365;
        static JUMPING_SPEED: number = PlayingState.MOVEMENT_SPEED + PlayingState.MOVEMENT_SPEED * 0.38;
        static GRAVITY_Y_COMPONENT: number = 400;

        static INITIAL_HEALTH: number = 10;

        static KETCHUP_SPAWN_RATE: number = 800; // Number of milliseconds for spawning ketchup bottles.
        static KETCHUP_BEGIN_ATTACK_TIME: number = 500; //Number of milliseconds to wait before attacking the player.
        static KETCHUP_TTL: number = 5000; // Number of milliseconds for each individual ketchup to live.

        static RAISIN_POINT_VALUE: number = 10; // How much collecting an individual raisin is worth.
        static HEAL_AMOUNT: number = 1; // Determines how much to increase the player's health by when a raisin is collected.
        static HEALTH_DECREASE_TIME: number = 100; // Number of milliseconds for how often to decrease the player's health.
        static HEALTH_DECREASE_AMOUNT: number = 0.03; // How much health to decrease per tick.

        static HEALTHBAR_COLOR: number = 0xC70039;
        static SCORE_TEXT_COLOR: string = "#004401";

        // Unused stuff can go here.

        foodSpritesCollected: number; // Can use this for calculating a score at the end of the game. Currently unused though.

        constructor() {
            super();
        }

        // Resetting class members' values for when this state gets started again.
        init() {
            this.score = 0;
            this.currentHealth = PlayingState.INITIAL_HEALTH
            this.foodSpritesCollected = 0;
            this.spawnEpisode = 0;

            this.game.stage.backgroundColor = "#7691D8";
        }

        // Load assets that will be used during a game session.

        preload() {
            // Load player and ketchup art assets
            this.game.load.image('player', 'assets/player.png'); // the player avatar
            this.game.load.spritesheet('player_spritesheet', 'assets/player_spritesheet.png', 842, 1191, 4);
            this.game.load.spritesheet('run_left_spritesheet', 'assets/run_left_spritesheet.png', 842, 1191, 4);
            this.game.load.image('ketchup', 'assets/ketchup.png'); // ketchup bottle
            this.game.load.image('explosion', 'assets/explosion.png'); // load the explosion graphic  

            // Load the food art assets       
            this.game.load.image('raisin', 'assets/raisin.png');

            this.game.load.image("leftButton", "assets/leftarrow.png");
            this.game.load.image("rightButton", "assets/rightarrow.png");
            this.game.load.image('aButton', 'assets/abutton.png');
            this.game.load.image('bButton', 'assets/bbutton.png');

            this.game.load.audio("raisinCollectSound", "assets/raisinCollect.wav");
            this.game.load.audio('ketchupHitSound', 'assets/ketchupHit.wav');

            this.game.load.audio('playingMusic', 'assets/Menu_2_mp3.mp3');
        }

        create() {
            this.loopMusic = this.game.add.audio('playingMusic');
            this.loopMusic.onDecoded.add(() => {
                this.loopMusic.fadeIn(30000, true);
                this.loopMusic.volume = 0.3;
            }, this);

            // Start the arcade physics system
            this.game.physics.startSystem(Phaser.Physics.ARCADE);

            // add sounds
            this.collectRaisinSound = this.game.add.audio('raisinCollectSound');
            this.ketchupHitSound = this.game.add.audio('ketchupHitSound');

            // add cursor keys controls
            this.cursorKeys = this.game.input.keyboard.createCursorKeys();

            // add WASD controls
            this.wasdKeys = this.game.input.keyboard.addKeys({ 'up': Phaser.KeyCode.W, 'down': Phaser.KeyCode.S, 'left': Phaser.KeyCode.A, 'right': Phaser.KeyCode.D });

            // Add and configure the player sprite.
            this.player = this.game.add.sprite(100, this.game.world.centerY, 'player_spritesheet', 0);
            this.player.scale.setTo(0.1, 0.1);
            this.game.physics.arcade.enable(this.player);
            this.player.body.gravity = new Phaser.Point(-this.game.physics.arcade.gravity.x, PlayingState.GRAVITY_Y_COMPONENT);
            this.player.body.collideWorldBounds = true;
            this.player.anchor.setTo(0.5, 0.5);

            // right run animation
            let runAnimation = this.player.animations.add('runRight', null, 10);
            runAnimation.onComplete.add(() => {
                this.player.loadTexture('player_spritesheet'); // reset to the original if haven't done so already
                this.player.frame = 0;
            }, this);

            // run left animation
            let runLeftAnimation = this.player.animations.add('runLeft', null, 10);
            runLeftAnimation.onComplete.add(() => {
                this.player.loadTexture('run_left_spritesheet'); // change to the left-facing texture
                this.player.frame = 0;
            });

            // Create the Groups that will hold the ketchup bottles and collectibles.
            this.ketchupGroup = this.game.add.group();
            this.foodCollectibleGroup = this.game.add.group();

            // A spawn timer for creating ketchup bottles.
            let ketchupSpawnTimer = this.game.time.create();
            ketchupSpawnTimer.loop(PlayingState.KETCHUP_SPAWN_RATE, () => {

                const maximumSpawnRate: number = 96;
                const gamma: number = 0.6

                if (this.spawnEpisode * gamma < maximumSpawnRate)
                    this.spawnEpisode++;

                if (Phaser.Utils.chanceRoll(this.spawnEpisode * gamma)) {
                    let singleKetchup = new KetchupSprite(this.game, this.game.rnd.integerInRange(0, this.game.width), -50, 'ketchup');
                    this.ketchupGroup.add(singleKetchup);
                }
            }, this);

            this.textScore = this.game.add.text(0, 50, "", {
                font: '4em "Segoe UI", Impact, sans-serif',
                fontWeight: "700",
                fill: PlayingState.SCORE_TEXT_COLOR,
                align: "center"
            });

            // Responsible for creating new collectibles.
            let foodSpawnTimer = this.game.time.create();
            foodSpawnTimer.loop(1500, () => {
                let aFoodSprite = new RaisinSprite(this.game, this.game.rnd.integerInRange(0, this.game.width - 24), -50, 'raisin');
                this.foodCollectibleGroup.add(aFoodSprite);
            }, this);

            // Create the long health bar that gets displayed at the top of the screen.
            this.healthBar = this.game.add.graphics(10, 10);
            this.drawHealthBar();

            // add oncscreen controls to the screen, but only if touch is available
            if (this.game.device.touch) {
                this.aButton = this.game.add.button(500, 390, "aButton", null, this);
                this.aButton.fixedToCamera = true; // stay in one place like a UI button
                this.aButton.alpha = 0.4; // set transparency
                this.aButton.events.onInputDown.add(() => {
                    this.isAButtonPressed = true;
                });
                this.aButton.events.onInputUp.add(() => {
                    this.isAButtonPressed = false;
                });

                this.bButton = this.game.add.button(630, 390, "bButton", null, this);
                this.bButton.fixedToCamera = true; // stay in one place like a UI button
                this.bButton.alpha = 0.4; // set transparency
                this.bButton.events.onInputDown.add(() => {
                    this.isBButtonPressed = true;
                });
                this.bButton.events.onInputUp.add(() => {
                    this.isBButtonPressed = false;
                });

                this.leftButton = this.game.add.button(40, 380, "leftButton", null, this);
                this.leftButton.fixedToCamera = true;
                this.leftButton.alpha = 0.4;
                this.leftButton.events.onInputDown.add(() => {
                    this.isLeftButtonPressed = true;
                });
                this.leftButton.events.onInputUp.add(() => {
                    this.isLeftButtonPressed = false;
                });

                this.rightButton = this.game.add.button(300, 380, "rightButton", null, this);
                this.rightButton.anchor.x = 1;
                this.rightButton.fixedToCamera = true;
                this.rightButton.alpha = 0.4;
                this.rightButton.events.onInputDown.add(() => {
                    this.isRightButtonPressed = true;
                });
                this.rightButton.events.onInputUp.add(() => {
                    this.isRightButtonPressed = false;
                });
            }

            // Decreases the player's health over time.
            let dyingHealthTimer = this.game.time.create();
            dyingHealthTimer.loop(PlayingState.HEALTH_DECREASE_TIME, () => {
                this.currentHealth -= PlayingState.HEALTH_DECREASE_AMOUNT;
            }, this);

            // Responsible for calculating the player's score.
            let calculateScoreTimer = this.game.time.create();
            calculateScoreTimer.loop(500, () => {
                this.score += 1;
            }, this);

            // Start all the timers.
            ketchupSpawnTimer.start();
            foodSpawnTimer.start();
            dyingHealthTimer.start();
            calculateScoreTimer.start();
        }

        // Class methods for the playing state.

        /*
         * controls player movement
         */
        movePlayer(direction: KawaiiKetchup.Movement) {
            // If the player is in mid-air, decrease their movement speed by 10%.
            let speedModifier = 0;
            if (!this.player.body.onFloor()) {
                speedModifier = 0.10 * PlayingState.MOVEMENT_SPEED;
            }

            if (direction === KawaiiKetchup.Movement.Left) {
                this.player.body.velocity.x = -PlayingState.MOVEMENT_SPEED - speedModifier;
                this.player.animations.play('runLeft');
            } else if (direction === KawaiiKetchup.Movement.Right) {
                this.player.body.velocity.x = PlayingState.MOVEMENT_SPEED - speedModifier;
                this.player.animations.play('runRight');
            } else if (direction === KawaiiKetchup.Movement.Up) {
                // checks to see if the player is on the ground, then jumps and plays jumping sound
                if (this.player.body.onFloor()) {
                    this.player.body.velocity.y = -PlayingState.JUMPING_SPEED;
                }
            } else if (direction === KawaiiKetchup.Movement.Down) {
                this.player.body.velocity.y = PlayingState.MOVEMENT_SPEED;
            }
        }

        /*
         * Callback for collisions between ketchup bottles and the player.
         */
        collisionKetchupPlayerCallback(player: Phaser.Sprite, ketchup: KetchupSprite) {
            ketchup.explode();
            this.currentHealth--;
            this.game.camera.shake(0.01, 250);
            this.ketchupHitSound.play();
        }

        /*
         * Callback for collisions between FoodSprite collectibles and the player.
         */
        collisionFoodCollectiblePlayerCallback(player: Phaser.Sprite, food: Phaser.Sprite) {
            // text for raisin tween
            let text: Phaser.Text = this.game.add.text(
                food.x + food.width / 2,
                food.y - food.height / 2,
                '+ ' + PlayingState.RAISIN_POINT_VALUE,
                {
                    font: '3em Bookman',
                    fontWeight: '350',
                    fill: PlayingState.SCORE_TEXT_COLOR
                }
            );

            // tweens for fading and transforming text pop up
            this.game.add.tween(text).to({ y: text.y - 50 }, 500, null, true);
            let secondTween = this.game.add.tween(text).to({ alpha: 0 }, 500, null, true);
            secondTween.onComplete.add(() => {
                text.destroy();
            }, this);

            food.destroy(); // Remove the food when it's been collected.
            this.score += PlayingState.RAISIN_POINT_VALUE; // Increment the score by a raisin point value.
            if (this.currentHealth < PlayingState.INITIAL_HEALTH - PlayingState.HEAL_AMOUNT) { // Increase the player's health, but only if they already aren't at full health.
                this.currentHealth += PlayingState.HEAL_AMOUNT;
            }

            // play the raisin collect sound
            this.collectRaisinSound.play();
        }

        /*
         * For drawing the player's health bar at the top of the screen.
         */
        drawHealthBar() {
            this.healthBar.clear();
            this.healthBar.beginFill(PlayingState.HEALTHBAR_COLOR);
            this.healthBar.drawRoundedRect(0, 0, (this.game.width - 20) * (this.currentHealth / PlayingState.INITIAL_HEALTH), 30, 9);
            this.healthBar.endFill();
            this.healthBar.beginFill(0x999999); // Not sure why this is needed, really.        
        }

        update() {
            // Perform physics calculations.
            this.game.physics.arcade.collide(this.player, this.ketchupGroup, this.collisionKetchupPlayerCallback, null, this);
            this.game.physics.arcade.overlap(this.player, this.foodCollectibleGroup, this.collisionFoodCollectiblePlayerCallback, null, this);

            // Update the score text graphic.
            this.textScore.text = "" + this.score;

            // reset the player's avatar's velocity so it won't move forever
            this.player.body.velocity.x = 0;

            // processing cursor keys or onscreen controls input to move the player avatar
            if (this.cursorKeys.left.isDown || this.wasdKeys.left.isDown || this.isLeftButtonPressed) {
                this.movePlayer(KawaiiKetchup.Movement.Left);
            }
            else if (this.cursorKeys.right.isDown || this.wasdKeys.right.isDown || this.isRightButtonPressed) {
                this.movePlayer(KawaiiKetchup.Movement.Right);
            }
            if (this.cursorKeys.up.isDown || this.wasdKeys.up.isDown || this.isAButtonPressed) {
                this.movePlayer(KawaiiKetchup.Movement.Up);
            } else if (this.cursorKeys.down.isDown || this.wasdKeys.down.isDown || this.isBButtonPressed) {
                this.movePlayer(KawaiiKetchup.Movement.Down);
            }

            this.drawHealthBar(); // Have to continously redraw the health bar like this.

            // Start the losing state when the player dies and clear everything.
            if (this.currentHealth <= 0) {
                this.game.state.start("LosingState", true, true);
            }
        }
    }

    /*
     * State for handling losing.
     */
    export class LosingState extends Phaser.State {

        message: string;
        text: Phaser.Text;
        scoreText: Phaser.Text;

        phrasesOfSoulOfWaifu: string[] = [
            "Bacon's on the to-do list!",
            "You don't have to be sad...",
            "Don't be sad!",
            "Work hard to achieve your dreams!",
            "Think of what you can still accomplish!",
            "Eat food or you'll become food.",
            "Remember the times when you felt kawaii and then remember how kawaii it made you feel.",
            "Omae wa mou shindeiru...",
            "Focus, baka!",
            "Oh dear, I'm quite certain that you're a kind person!",
            "You don't have to give up.",
            "Your feelings? You don't have to listen to them, y'know.",
            "Lifestyle is important. What is your lifestyle?"
        ];

        constructor() {
            super();
        }

        // More than likely, won't be using this. Will instead be sharing data using this.game.state.states["PlayingState"].DATA
        init() {

        }

        preload() {
            this.game.load.spritesheet('restartButton', 'assets/retryButton.png', 640, 400);
            this.game.load.spritesheet('quitButton', 'assets/quitButton.png', 640, 400);

            this.game.load.audio('lose_music', "assets/A Cop's Death_mp3.mp3");
        }

        create() {
            this.game.stage.backgroundColor = "#5E87DE";

            let endMusic = this.game.add.audio('lose_music');
            endMusic.loop = true;
            endMusic.play();

            this.message = this.phrasesOfSoulOfWaifu[this.game.rnd.integerInRange(0, this.phrasesOfSoulOfWaifu.length - 1)];

            this.text = this.game.add.text(this.game.world.centerX,
                this.game.world.centerY, '', {
                    font: '4em "Comic Sans MS"',
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    align: 'center',
                    wordWrap: true,
                    wordWrapWidth: this.game.world.width - 186
                });
            this.text.anchor.setTo(0.5, 0.5);

            this.scoreText = this.game.add.text(
                this.game.world.centerX,
                0, '', {
                    font: '4em Impact',
                    fontWeight: 'bolder',
                    fill: '#ffffff',
                    align: 'center'
                }
            );
            this.scoreText.anchor.setTo(0.5, 0);
            this.scoreText.text = `score\n${this.game.state.states['PlayingState'].score}`;

            // Display the message character by character by creating a timer for each character.
            for (let i = 0, totalTime = 0; i < this.message.length; i++) {
                this.game.time.events.add(totalTime, () => {
                    this.text.text += this.message[i];
                }, this);
                // Depending on the character's index in the message string, display it after a specific delay.
                totalTime += 150;
            }

            let retryButton = this.game.add.button(this.game.world.centerX, this.game.world.height - 10, 'restartButton', () => {
                this.game.state.start("PlayingState", true, true);
            }, this, 1, 0);
            retryButton.scale.set(0.3, 0.3);
            retryButton.anchor.set(1, 1);

            let quitButton = this.game.add.button(this.game.world.centerX + 10, this.game.world.height - 10, 'quitButton', () => {
                this.game.state.start("MainMenuState", true, true);
            }, this, 0, 1);
            quitButton.scale.set(0.3, 0.3);
            quitButton.anchor.set(0, 1);

            let leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
            leftKey.onDown.add(() => {
                currentSelection.frame ^= 1; // xor toggle
                currentSelection = selectionGroup.next();
                currentSelection.frame ^= 1;
            }, this);

            let rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
            rightKey.onDown.add(() => {
                currentSelection.frame ^= 1;
                currentSelection = selectionGroup.next();
                currentSelection.frame ^= 1;
            }, this);

            let enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
            enterKey.onDown.add(() => {
                if (currentSelection.key === 'restartButton') this.game.state.start("PlayingState", true, true);
                else if (currentSelection.key === 'quitButton') this.game.state.start("MainMenuState", true, true);
            }, this);

            let selectionGroup = this.game.add.group();
            selectionGroup.addMultiple([retryButton, quitButton]);

            let currentSelection = selectionGroup.getFirstAlive();
            currentSelection.frame = 1;
        }

        update() {

        }
    }

    export class Game {
        game: Phaser.Game;

        constructor() {
            this.game = new Phaser.Game(800, 600, Phaser.AUTO, "phaser"); // for .gif screenshots
            //this.game = new Phaser.Game("100%", "100%", Phaser.AUTO, "phaser");

            /* The boot state will contain an init() for the scale manager and will load the loading screen,
             * while the preloader will display the loading screen and load assets and then start the main game state.
             */
            this.game.state.add("BootState", BootState, true);
            this.game.state.add("MainMenuState", MainMenuState);
            this.game.state.add("CreditsState", CreditsState);
            this.game.state.add("PreloadState", PreloadState);
            this.game.state.add("PlayingState", PlayingState);
            this.game.state.add("LosingState", LosingState);
        }
    }
}

const game = new KawaiiKetchup.Game();