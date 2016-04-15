//$(document).on("load", function() {
// var w = window.innerWidth;
// var h = window.innerHeight;

// Phaser init
var game = new Phaser.Game(
    '100',
    '100',
    Phaser.AUTO,
    '', {},
    false,
    true,
    null
);

/**
 * Global variables
 */
var gravity = 500;
var jump_velocity = -150;
var world_speed = -100;

/**
 * Create game states
 * default: [preload, create, update, render]
 */

// Init state
var fb_state_init = {
    preload: function() {
        // Background
        game.load.image('bg', 'assets/bg.png');
        // Button
        game.load.spritesheet('btn_play', 'assets/btn_play.png', 64, 64);
        // Ground
        game.load.image('ground', 'assets/ground.png');
        // Pipes
        game.load.image('crate', 'assets/Crate.png');
        // Birds
        game.load.spritesheet('bird_black', 'assets/Player_Black.png', 15, 16);
        game.load.spritesheet('bird_blue', 'assets/Player_Blue.png', 15, 16);
        game.load.spritesheet('bird_dead', 'assets/Player_Dead.png', 15, 16);
        game.load.spritesheet('bird_flame', 'assets/Player_Flame_inGame.png', 27, 27);
        game.load.spritesheet('bird_flame_noGlow', 'assets/Player_Flame_noGlow.png', 15, 16);
        game.load.spritesheet('bird_genclops', 'assets/Player_Genclops.png', 15, 16);
        game.load.spritesheet('bird_rainbow', 'assets/Player_Rainbow.png', 15, 16);
        game.load.spritesheet('bird_green', 'assets/Player_Green.png', 15, 16);
        game.load.spritesheet('bird_red', 'assets/Player_Red.png', 15, 16);
        game.load.spritesheet('bird_sick', 'assets/Player_Sick.png', 15, 16);
        game.load.spritesheet('bird_white', 'assets/Player_White.png', 15, 16);
    },
    create: function() {
        var bg_w = game.cache.getImage('bg').width;
        var bg_h = game.cache.getImage('bg').height;
        game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
        // game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        game.scale.pageAlignVertically = true;
        game.scale.pageAlignHorizontally = true;
        game.scale.setMinMax(
            bg_w / 4,
            bg_h / 4,
            bg_w,
            bg_h
        );
        if (game.device.desktop) {
            game.scale.setGameSize(bg_w, bg_h);
        }
        game.scale.refresh();

        console.log("[DEBUG] All assets loaded.");

        game.state.start('menu');
    }
};

// Menu state
var fb_state_menu = {
    create: function() {
        game.add.tileSprite(
            0,
            0,
            game.world.width,
            game.world.height,
            'bg'
        );

        game.add.button(
            game.world.centerX - (game.cache.getImage('btn_play').width / 4),
            game.world.centerY - (game.cache.getImage('btn_play').height / 2),
            'btn_play',
            this.startGame,
            this,
            0, 0, 1, 0
        );

        console.log("[DEBUG] Game menu loaded.");
    },
    startGame: function() {
        game.state.start('game');
    },
    toggleFullScreen: function() {
        if (game.scale.isFullScreen) {
            game.scale.stopFullScreen();
            game.scale.refresh();
        } else {
            game.scale.startFullScreen(false);
            game.scale.refresh();
        }
    }
};

// Game state
var fb_state_game = {
    create: function() {
        this.game_running = false;

        // Init physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Add sprites
        // Background
        this.bg = game.add.tileSprite(
            0,
            0,
            game.world.width,
            game.world.height,
            'bg'
        );

        // Ground
        this.ground = game.add.tileSprite(
            0,
            game.world.height - (game.cache.getImage('ground').height),
            game.world.width,
            game.cache.getImage('ground').height,
            'ground'
        );

        // Crates
        this.crates = game.add.group();
        this.crates.enableBody = true;

        // Bird
        this.bird_sprite = this.randBird();
        this.bird = game.add.sprite(
            (game.world.width / 3) - ((game.cache.getImage(this.bird_sprite).width / 3) / 2),
            (game.world.height / 2) - (game.cache.getImage(this.bird_sprite).height / 2),
            this.bird_sprite,
            0
        );
        this.bird.animations.add('fly_start', [0, 6, 7], 10, false);
        this.bird.animations.add('fly_game', [0, 6, 7], 15, false);

        // Enable physics on objects
        game.physics.arcade.enable([this.ground, this.bird]);

        // Config objects
        this.ground.body.setSize(this.ground.width, this.ground.height);
        this.ground.body.immovable = true;

        this.bird.anchor.setTo(0.0, 0.5);
        this.bird.scale.setTo(2, 2);
        this.bird.body.collideWorldBounds = true;
        this.bird.body.syncBounds = true;

        // Config tweens
        this.tween_fly_up = game.add.tween(this.bird);
        // this.tween_fly_up.frameBased = true;
        this.tween_fly_up.to({
            angle: -20
        }, 100);

        // Config input
        var key_space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        key_space.onDown.add(this.jump, this);

        game.input.onTap.add(this.jump, this);

        console.log("[DEBUG] Game loaded.");
    },
    update: function() {
        if (this.bird.alive) {
            this.bg.tilePosition.x -= 1;
            this.ground.tilePosition.x -= 1;

            if (!this.game_running) {
                this.bird.animations.play('fly_start');
            } else {
                this.bird.animations.play('fly_game');
            }

            game.physics.arcade.collide(this.bird, this.ground, this.groundCollision, null, this);
        }

        if (this.game_running && this.bird.body.velocity.y > 100 && !this.tween_fly_up.isRunning) {
            if (this.bird.angle < 30) {
                this.bird.angle += 5;
            } else if (this.bird.angle < 90) {
                this.bird.angle += 2;
            }
        }
    },
    render: function() {
        // game.debug.body(this.bird, "rgba(255, 0, 0, .25)");
        // game.debug.body(this.ground, "rgba(0, 255, 255, .25)");
    },
    rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + 1;
    },
    randBird: function() {
        var rand = this.rand(0, 10);
        this.bird_sprite;
        switch (rand) {
            case 0:
                this.bird_sprite = 'bird_black';
                break;
            case 1:
                this.bird_sprite = 'bird_blue';
                break;
            case 2:
                this.bird_sprite = 'bird_dead';
                break;
            case 3:
                this.bird_sprite = 'bird_flame';
                break;
            case 4:
                this.bird_sprite = 'bird_flame_noGlow';
                break;
            case 5:
                this.bird_sprite = 'bird_genclops';
                break;
            case 6:
                this.bird_sprite = 'bird_green';
                break;
            case 7:
                this.bird_sprite = 'bird_rainbow';
                break;
            case 8:
                this.bird_sprite = 'bird_red';
                break;
            case 9:
                this.bird_sprite = 'bird_sick';
                break;
            case 10:
                this.bird_sprite = 'bird_white';
                break;
            default:
                this.bird_sprite = 'bird_blue';
                break;
        }
        return this.bird_sprite;
    },
    jump: function() {
        if (this.bird.alive) {
            if (!this.game_running) {
                this.game_running = true;
                this.bird.body.gravity.y = gravity;
            };
            this.tween_fly_up.start();
            this.bird.body.velocity.y = jump_velocity;
        }
    },
    groundCollision: function() {
        this.bird.alive = false;
        this.game_running = false;
        this.bird.body.gravity.y = 0;
    }
};

/**
 * Insert game states into game instance
 */
game.state.add('init', fb_state_init, true);
game.state.add('menu', fb_state_menu, false);
game.state.add('game', fb_state_game, false);

// function rand(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + 1;
// }

//});
