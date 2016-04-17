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
var gravity = 600;
var jump_velocity = -150;
var world_speed = -60;
var crate_gen_delay = 2500;
var bird_sprite = null;
var bird_scale = 1.5;
var crate_scale = 0.5;
var score = 0;

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
        // Crates
        game.load.image('crate', 'assets/Crate.png');
        game.load.image('score_tile', 'assets/score_tile.png');
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
        // Jump sound
        game.load.audio('jump_snd', 'assets/swing.wav');
        // Score sound
        game.load.audio('score_snd', 'assets/score_up.wav');
        // Hit sound
        game.load.audio('hit_snd_1', 'assets/crate_hit_1.wav');
        game.load.audio('hit_snd_2', 'assets/crate_hit_2.wav');
        // Score frame
        game.load.image('score_frame', 'assets/frame.png');
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
        } else {
            game.scale.forceOrientation(false, true);
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

        bird_sprite = this.randBird();
        this.menu_bird = game.add.sprite(
            (game.world.width / 2) - ((game.cache.getImage(bird_sprite).width / 3) / 2),
            (game.world.height / 3) - (game.cache.getImage(bird_sprite).height / 2),
            bird_sprite,
            0
        );
        this.menu_bird.scale.setTo(bird_scale, bird_scale);
        this.menu_bird.animations.add('fly_start', [0, 6, 7], 10, true).play();

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
    rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + 1;
    },
    randBird: function() {
        var rand = this.rand(0, 10);
        switch (rand) {
            case 0:
                return 'bird_black';
                break;
            case 1:
                return 'bird_blue';
                break;
            case 2:
                return 'bird_dead';
                break;
            case 3:
                return 'bird_flame';
                break;
            case 4:
                return 'bird_flame_noGlow';
                break;
            case 5:
                return 'bird_genclops';
                break;
            case 6:
                return 'bird_green';
                break;
            case 7:
                return 'bird_rainbow';
                break;
            case 8:
                return 'bird_red';
                break;
            case 9:
                return 'bird_sick';
                break;
            case 10:
                return 'bird_white';
                break;
            default:
                return 'bird_blue';
                break;
        }
    },
    startGame: function() {
        game.state.start('game');
    }
};

// Game state
var fb_state_game = {
    create: function() {
        score = 0;
        this.game_running = false;
        this.score_update = false;
        this.crate_size = game.cache.getImage('crate').width;

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

        // Crates
        this.crates = game.add.physicsGroup();

        // Score tiles
        this.score_tiles = game.add.physicsGroup();

        // Ground
        this.ground = game.add.tileSprite(
            0,
            game.world.height - (game.cache.getImage('ground').height),
            game.world.width,
            game.cache.getImage('ground').height,
            'ground'
        );

        // Bird
        bird_sprite = this.randBird();
        this.bird = game.add.sprite(
            (game.world.width / 3) - ((game.cache.getImage(bird_sprite).width / 3) / 2),
            (game.world.height / 2) - (game.cache.getImage(bird_sprite).height / 2),
            bird_sprite,
            0
        );
        this.bird.animations.add('fly_start', [0, 6, 7], 10, false);
        this.bird.animations.add('fly_game', [0, 6, 7], 15, false);

        // Sound init
        this.jump_snd = game.add.sound('jump_snd');
        this.score_snd = game.add.sound('score_snd');
        this.hit_snd_1 = game.add.sound('hit_snd_1');
        this.hit_snd_2 = game.add.sound('hit_snd_2');

        // Enable physics on objects
        game.physics.arcade.enable([this.ground, this.bird]);

        // Config objects
        this.ground.body.setSize(this.ground.width, this.ground.height);
        this.ground.body.immovable = true;

        this.bird.anchor.setTo(0.0, 0.5);
        this.bird.scale.setTo(bird_scale, bird_scale);
        this.bird.body.collideWorldBounds = true;
        // this.bird.body.syncBounds = true;

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

        // game.time.slowMotion = 4.0;

        this.score_lbl = game.add.text(
            0,
            0,
            '0', {
                fontSize: '30pt',
                fill: '#ffffff',
                boundsAlignH: 'center',
                stroke: '#303030',
                strokeThickness: 4
            }
        );
        this.score_lbl.reset(
            game.world.width / 2 - this.score_lbl.width / 2,
            game.world.height / 5 - this.score_lbl.height / 2
        );

        console.log("[DEBUG] Game loaded.");
    },
    update: function() {
        if (this.game_running) {
            if (this.bird.alive) {
                this.bg.tilePosition.x -= 1;
                this.ground.tilePosition.x -= 1;

                this.bird.animations.play('fly_game');

                // Collision checking
                game.physics.arcade.collide(this.bird, this.crates, this.crateCollision, null, this);
                if (this.score_update != game.physics.arcade.overlap(this.bird, this.score_tiles, null, null, this)) {
                    this.score_update = !this.score_update;
                    if (this.score_update) {
                        this.scoreUpdate();
                    }
                }
            }
            game.physics.arcade.collide(this.bird, this.ground, this.groundCollision, null, this);
        } else {
            if (this.bird.alive) {
                this.bird.animations.play('fly_start');
                this.bg.tilePosition.x -= 1;
                this.ground.tilePosition.x -= 1;
            }
        }

        if (this.game_running && !this.tween_fly_up.isRunning) {
            if (this.bird.body.velocity.y >= 0 && this.bird.angle < 0) {
                this.bird.angle++;
            }
            if (this.bird.body.velocity.y > 200) {
                if (this.bird.angle < 30) {
                    this.bird.angle += 6;
                } else if (this.bird.angle < 80) {
                    this.bird.angle += 2;
                }
            }
        }
    },
    render: function() {
        // game.debug.bodyInfo(this.bird, 30, 30, "#ff0000");
        // game.debug.body(this.bird, "rgba(255, 0, 0, .5)");
        // game.debug.body(this.ground, "rgba(0, 255, 255, .25)");
        // game.debug.body(this.crates, "rgba(255, 255, 128, 0.5)");
        // game.debug.body(this.score_tiles, "rgba(255, 0, 0, 0.5)");
    },
    rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + 1;
    },
    randBird: function() {
        var rand = this.rand(0, 10);
        switch (rand) {
            case 0:
                return 'bird_black';
                break;
            case 1:
                return 'bird_blue';
                break;
            case 2:
                return 'bird_dead';
                break;
            case 3:
                return 'bird_flame';
                break;
            case 4:
                return 'bird_flame_noGlow';
                break;
            case 5:
                return 'bird_genclops';
                break;
            case 6:
                return 'bird_green';
                break;
            case 7:
                return 'bird_rainbow';
                break;
            case 8:
                return 'bird_red';
                break;
            case 9:
                return 'bird_sick';
                break;
            case 10:
                return 'bird_white';
                break;
            default:
                return 'bird_blue';
                break;
        }
    },
    startGame: function() {
        this.game_running = true;
        this.bird.body.gravity.y = gravity;
        this.addColOfCrates();
        this.timer_crate_gen = game.time.events.loop(
            crate_gen_delay * game.time.slowMotion,
            this.addColOfCrates,
            this
        );
    },
    restartGame: function() {
        game.state.restart();
    },
    addCrate: function(x, y) {
        var crate = game.add.sprite(x, y, 'crate');
        this.crates.add(crate);
        crate.scale.setTo(crate_scale, crate_scale);
        // crate.body.syncBounds = true;
        crate.body.immovable = true;
        // crate.body.checkWorldBounds = true;
        // crate.body.outOfBoundsKill = true;
        crate.body.velocity.x = world_speed;
    },
    addScoreTile: function(x, y) {
        var crate = game.add.sprite(x + this.crate_size / 2, y, 'score_tile');
        this.score_tiles.add(crate);
        crate.scale.setTo(crate_scale, crate_scale);
        // crate.body.syncBounds = true;
        crate.body.immovable = true;
        // crate.body.checkWorldBounds = true;
        // crate.body.outOfBoundsKill = true;
        crate.body.velocity.x = world_speed;
    },
    addColOfCrates: function() {
        var limit = Math.floor(game.world.height / (this.crate_size * crate_scale) - this.ground.height / (this.crate_size * crate_scale) + 1);
        var hole = this.rand(2, limit - Math.floor((this.ground.height / (this.crate_size * crate_scale))) * 2);
        if (Math.abs(this.last_hole - hole) > 4) {
            hole = (this.last_hole > hole) ? this.last_hole - hole : hole - this.last_hole;
        }
        for (var i = 0; i < limit; i++) {
            if (i === hole) {
                this.addScoreTile(
                    game.world.width,
                    i * this.crate_size * crate_scale
                );
                continue;
            }
            if (i === hole + 1) continue;
            this.addCrate(
                game.world.width,
                i * this.crate_size * crate_scale
            );
        }
        this.last_hole = hole;
        // Delete crates and score tiles that are out of left world bound
        this.crates.forEach(function(p) {
            if (p.x + p.width < 0) {
                p.kill();
            }
        }, this);
        this.score_tiles.forEach(function(p) {
            if (p.x + p.width < 0) {
                p.kill();
            }
        }, this);
    },
    jump: function() {
        if (this.bird.alive) {
            if (!this.game_running) {
                this.startGame();
            };
            this.tween_fly_up.start();
            this.bird.body.velocity.y = jump_velocity;
            this.jump_snd.play();
        }
    },
    scoreUpdate: function() {
        score++;
        this.score_lbl.text = score;
        this.score_snd.play();
        this.score_lbl.reset(
            game.world.width / 2 - this.score_lbl.width / 2,
            game.world.height / 5 - this.score_lbl.height / 2
        );
    },
    crateCollision: function() {
        this.hit_snd_2.play();
        this.bird.alive = false;
        this.bird.body.velocity.x = 0;
        this.crates.forEach(function(p) {
            p.body.velocity.x = 0;
        }, this);
        game.time.events.remove(this.timer_crate_gen);
    },
    groundCollision: function() {
        this.hit_snd_1.play();
        this.bird.alive = false;
        this.game_running = false;
        this.bird.body.velocity.x = 0;
        this.bird.body.gravity.y = 0;
        this.crates.forEach(function(p) {
            p.body.velocity.x = 0;
        }, this);
        game.time.events.remove(this.timer_crate_gen);

        game.add.button(
            game.world.centerX - (game.cache.getImage('btn_play').width / 4),
            2 * (game.world.height / 3) - (game.cache.getImage('btn_play').height / 2),
            'btn_play',
            this.restartGame,
            this,
            0, 0, 1, 0
        );

        this.saveScore();
        this.showScore();
    },
    saveScore: function() {
        if (typeof(Storage) !== 'undefined') {
            var myStorage = localStorage;
            if (!myStorage.score || !myStorage.highScore) {
                myStorage.setItem('score', 0);
                myStorage.setItem('highScore', 0);
            }
            myStorage.score = score;
            if (myStorage.highScore < score) {
                myStorage.highScore = score;
            }
        } else {
            alert("localStorage not supported!");
        }
    },
    showScore: function() {
        var score_frame = game.add.sprite(
            game.world.centerX - (game.cache.getImage('score_frame').width / 2),
            game.world.height,
            'score_frame'
        );
        var font_conf = {
            fontSize: '16pt',
            fill: '#ffffff',
            boundsAlignH: 'center',
            stroke: '#303030',
            strokeThickness: 4
        };
        var score_txt = "Score: ";
        var hi_score_txt = "High score: ";
        myStorage = localStorage;
        score_txt += myStorage.score;
        hi_score_txt += myStorage.highScore;
        var score_lbl = game.add.text(
            0,
            0,
            score_txt,
            font_conf
        );
        score_lbl.reset(
            game.world.centerX - (score_lbl.width / 2),
            game.world.height
        );
        var hi_score_lbl = game.add.text(
            0,
            0,
            hi_score_txt,
            font_conf
        );
        hi_score_lbl.reset(
            game.world.centerX - (hi_score_lbl.width / 2),
            game.world.height
        );

        game.add.tween(score_frame).to({
            y: (game.world.height / 3)
        }, 100).start();

        game.add.tween(score_lbl).to({
            y: (game.world.height / 3) + (score_frame.height / 3) - (score_lbl.height / 2)
        }, 250).start();

        game.add.tween(hi_score_lbl).to({
            y: (game.world.height / 3) + (score_frame.height / 3) + (score_lbl.height) - (hi_score_lbl.height / 2)
        }, 250).start();
    }
};

/**
 * Insert game states into game instance
 */
game.state.add('init', fb_state_init, true);
game.state.add('menu', fb_state_menu, false);
game.state.add('game', fb_state_game, false);
