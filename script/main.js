Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

var SpeedTester = function(testName)
{
	var tester = this;
	tester.name = testName;
	tester.counter = {};
	tester.total = 0;
	
	tester.restart = function() {
		tester.start = new Date().getTime();
	};
	
	tester.restart();
	
	tester.set = function(name) {
		var duration = new Date().getTime() - tester.start;
		if (tester.counter[name] === undefined)
		{
			tester.counter[name] = duration;
		}
		else
		{
			tester.counter[name] += duration;
		}
		tester.total += duration;
		tester.start = new Date().getTime();
	};
	
	tester.print = function() {
		var string = tester.name + "// (Total: " + tester.total + ") ";
		for (var key in tester.counter)
		{
			string += " " + key + ": " + (tester.counter[key]/tester.total);
		}
		console.log(string);
	};
}

var TimedBoolean = function(duration)
{
	var tb = this;
	tb.on = true;
	tb.duration = duration;

	tb.off = function() {
		tb.on = false;
		setTimeout( function() {
			tb.on = true;
		}, tb.duration);
	};
}

var Vector = function (x, y)
{
	var vector = this;
	
	this.x = x;
	this.y = y;
	
	this.magnitude = function() {
		return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	};
	
	this.normalize = function() {
		var mag = vector.magnitude();
		vector.x = vector.x / mag;
		vector.y = vector.y / mag;
	};
	
	this.distSquared = function(otherVector) {
		var x = otherVector.x - vector.x;
		var y = otherVector.y - vector.y;
		return x*x + y*y;
	};
	
	this.updateCoordinates = function (x, y) {
		vector.x = x;
		vector.y = y;
	};
}

var Block = function (offset, width, height)
{
	var block = this;
	this.width = width/2;
	this.height = height/2;
	this.center = new Vector(offset.left + this.width, offset.top + this.height);
	this.collisionRadius = Math.min(width, height)/2;
	
	this.collides = function (otherBlock) {
		var radiiDist = block.collisionRadius + otherBlock.collisionRadius;
		var distSquared = block.center.distSquared(otherBlock.center);
		return distSquared < (radiiDist * radiiDist);
	};
	
	this.updateCenter = function (offset) {
		block.center.updateCoordinates(offset.left + block.width, offset.top + block.height);
	};
}

var Sprite = function (id, frames, elevation, elevationDeviation, direction, speed, startPos)
{
	var this_sprite = this;
	
	this.id = id;
	this.step = 0;
	this.frames = frames;
	
	this.baseElevation = elevation;
	this.elevationDeviation = elevationDeviation;
	this.currentElevation = elevation;
	this.elevationDirection = 'up';
	
	this.direction = direction;
	this.speed = speed;
	this.left = startPos;
	
	this.updatePosition = function ()
	{
		if(this_sprite.direction == 'right')
		{
			this_sprite.left += this_sprite.speed;
		}
		else
		{
			this_sprite.left -= this_sprite.speed;
		}
		
	};
	
	this.updateElevation = function ()
	{
		if (this_sprite.elevationDeviation != 0)
		{
			if (this_sprite.elevationDirection == 'up')
			{
				this_sprite.currentElevation++;
				if (this_sprite.currentElevation >= this_sprite.baseElevation + this_sprite.elevationDeviation) this_sprite.elevationDirection = 'down';
			}
			else
			{
				this_sprite.currentElevation--;
				if (this_sprite.currentElevation <= this_sprite.baseElevation - this_sprite.elevationDeviation) this_sprite.elevationDirection = 'up';
			}
		}
	};
}

var Bat = function (sprite, reloadTime)
{
	var bat = this;
	var $bat = $('#obj' + sprite.id);
	bat.sprite = sprite;
	
	bat.canAttack = true;
	bat.reloadTime = reloadTime;
	
	bat.update = function () {
		if (bat.canAttack)
		{
			GAME.createBatBullet(bat.sprite.left, bat.sprite.currentElevation + 30);
			bat.canAttack = false;
			setTimeout(function () {
				bat.canAttack = true;
			}, bat.reloadTime);
		}
		if (bat.sprite.direction == 'right')
		{
			if (bat.sprite.left > 100) bat.sprite.direction = 'left';
			$bat.css('transform', 'rotateY(0deg)');
		}
		else
		{
			if (bat.sprite.left < 0) bat.sprite.direction = 'right';
			$bat.css('transform', 'rotateY(180deg)');
		}
	};
	
	function getBulletXPosition() {
		var left = $bat.offset().left;
		if (bat.sprite.direction == 'right')
		{
			left += $bat.width();
		}
		return left;
	};
}

var Bullet = function (id, pos, dir, width, height)
{
	var bullet = this;
	
	bullet.id = id;
	bullet.position = pos;
	dir.normalize();
	bullet.direction = dir;
	
	bullet.width = width;
	bullet.height = height;
	
	bullet.$ = $('#obj' + id);
	bullet.block = new Block(bullet.$.offset(), 30, 30);
	
	bullet.update = function(step) {
		bullet.position.left += bullet.direction.x * step;
		bullet.position.top += bullet.direction.y * step;
	};
}

var BatBullet = function (id, left, height)
{
	var bullet = this;
	bullet.id = id;
	bullet.left = left;
	bullet.height = height;
	bullet.$ = $('#obj' + id);
	
	bullet.block = new Block(bullet.$.offset(), 25, 25);
	
	bullet.update = function (step) {
		bullet.height -= step;
	};
}

var RAND = {
	rand: function(range) {
		return Math.floor(Math.random()*range)
	},
	
	randOccurance: function(denominator) {
		return (RAND.rand(denominator) == 0);
	},
	
	randDirection: function() {
		if (RAND.randOccurance(2)) return 'right';
		return 'left';
	}
}

var GAME = {
	playing: true,
	
	left_boundary: -100,
	right_boundary: 150,
	
	groundSpeed: 0.4,
	edgeJump: 50,
	
	direction: 'right',
	moving: false,
	walk: 0,
	canStep: true,
	
	fairy: {
		step: 0,
		yPos: -50,
		distFromGround: 25,
		flightDirection: 'up',
		left: 45,
		zIndex: -1,
		direction: 'right'
	},
	
	dirtPos: -190,
	grounded: [],
	background: [],
	
	canFire: true,
	reloadTime: 2000,
	bulletSpeed: 10.0,
	magicSpeed: 20.0,
	bullets: [],
	
	bats: [],
	batBullets: [],
	
	sprites: [],
	spriteData: {
		"dragon": {
			frames: [
				"0px -191px",
				"-96px -191px",
				"-192px -192px",
				"-288px -191px"
			],
			width: 95,
			height: 95
		},
		"red_raven": {
			frames: [
				"-28px -350px",
				"-61px -350px",
				"-94px -350px",
				"-127px -350px"
			],
			width: 30,
			height: 30
		},
		"blue_raven": {
			frames: [
				"-28px -285px",
				"-61px -285px",
				"-94px -285px",
				"-127px -285px"
			],
			width: 30,
			height: 30
		},
		"yellow_raven": {
			frames: [
				"-215px -285px",
				"-248px -285px",
				"-281px -285px",
				"-314px -285px"
			],
			width: 30,
			height: 30
		},
		"green_raven": {
			frames: [
				"-215px -350px",
				"-248px -350px",
				"-281px -350px",
				"-314px -350px"
			],
			width: 30,
			height: 30
		},
		"frog": {
			frames: [
				"-195px -200px",
				"-195px -200px",
				"-228px -200px",
				"-228px -200px",
				"-195px -191px",
				"-195px -191px",
				"-258px -200px"
			],
			width: 30,
			height: 27
		},
		"chicken": {
			frames: [
				"-133px -196px",
				"-100px -196px",
				"-133px -196px",
				"-165px -196px"
			],
			width: 30,
			height: 27
		},
		"mouse": {
			frames: [
				"-294px -81px",
				"-326px -81px",
				"-358px -81px",
				"-326px -81px"
			],
			width: 19,
			height: 13
		},
		"rabbit": {
			frames: [
				"-290px -200px",
				"-290px -200px",
				"-355px -200px",
				"-355px -200px",
				"-290px -191px",
				"-290px -191px",
				"-325px -200px"
			],
			width: 30,
			height: 27
		},
		"butterfly": {
			frames: [
				"-300px -195px",
				"-330px -195px",
				"-362px -195px"
			],
			width: 8,
			height: 25
		},
		"horse": {
			frames: [
				"-128px -194px",
				"-96px -194px",
				"-128px -194px",
				"-160px -194px"
			],
			width: 32,
			height: 30
		},
		"cow": {
			frames: [
				"-32px -194px",
				"-0px -194px",
				"-32px -194px",
				"-64px -194px"
			],
			width: 32,
			height: 30
		},
		"sheep": {
			frames: [
				"-320px -66px",
				"-288px -66px",
				"-320px -66px",
				"-352px -66px"
			],
			width: 32,
			height: 30
		},
		"puppy": {
			frames: [
				"-33px -74px",
				"-1px -74px",
				"-33px -74px",
				"-65px -74px"
			],
			width: 29,
			height: 22
		},
		"kitty": {
			frames: [
				"-131px -73px",
				"-99px -73px",
				"-131px -73px",
				"-162px -73px"
			],
			width: 28,
			height: 23
		},
		"chick": {
			frames: [
				"-44px -212px",
				"-12px -212px",
				"-44px -212px",
				"-76px -212px",
			],
			width: 8,
			height: 8
		}
	},
	
	$princess: null,
	princessBlock: null,
	$bb_container: null,
	
	$magicSound: null,
	$dragonSound: null,
	dragonSoundStart: 1.4,
	
	showTitle: false,
	
	objIdCounter: 0,
	init : function() {
		createOther();
		createMenu();
		createDefaultObjects();
		createGroundedObjects("pictures/tree2.png", 230, -5, 10);
		createGroundedObjects("pictures/tree1.png", 200, -5, 20);
		createGroundedObjects("pictures/flower_pink.png", 20, 5, 20);
		createGroundedObjects("pictures/flower_blue.png", 20, 5, 20);
		createGroundedObjects("pictures/boulder.png", 20, -7, 5);
		
		createBackgroundObjects("pictures/cloud.png", [280, 320, 350], [50, 80, 100], -50, 0.15, 15);
		createBackgroundObjects("pictures/mountain.png", [0], [150, 200, 220, 290, 330, 370, 395], -100, 0.1, 10);
		
		move('right');
		
		GAME.$princess = $('#princess');
		GAME.princessBlock = new Block(GAME.$princess.offset(), 32, 53);
		GAME.$bb_container = $('#bb_container');
		
		GAME.$magicSound = $('#sfx_magic');
		GAME.$magicSound[0].volume = 0.15;
		
		GAME.$dragonSound = $('#sfx_dragon');
		GAME.$dragonSound[0].volume = 0.15;
		
		function createOther() {
			$('body').append('<div id="title"></div>')
				.append('<div id="damage"></div>')
				.append('<div id="gameOver"></div>')
				.append('<div id="batBullets"><div id="bb_container"></div></div>')
				.append('<audio id="music" loop><source type="audio/mpeg"></audio>')
				.append('<audio id="sfx_magic"><source type="audio/mpeg" src="sounds/wavy.mp3"></audio>')
				.append('<audio id="sfx_dragon"><source type="audio/mpeg" src="sounds/wonder.mp3"></audio>');
			Music.change('Intro.mp3');
				
			$('#title').append('<h1>Princess <input type="text" id="name"></h1>')
				.append('<p><span class="princess_name"></span> is the princess over all of the forest.  It is her job to guard the forest and all of it\'s creatures from anyone who seeks to harm them.  As we speak the forest is under attack from the evil dragons.  Will you help to guard the forest from the evil dragons?</p>')
				.append('<p>A/&#x25C0;: Go left || D/&#x25B6;: Go Right || <img src="pictures/mouse.png"\>: Shoot Magic</p>')
				.append('<div id="start" class="bigButton">Guard the Forest</div>')
				.hide();
			$('#name').on('keyup', function() {
				$('.princess_name').html($(this).val());
			});
			$('#start').on('click', function() {
				Music.fadeInto('DawnRise.mp3');
				Title.hide();
			});
			
			$('#gameOver').append('<h1>You scored <span id="points">0</span> points!</h1>')
				.append('<div id="retry" class="bigButton">Retry</div>');
			$('#retry').on('click', function() {
				GameOver.hide();
				Title.show();
			});
		};
		
		function createMenu() {
			$('body').append('<div id="menu"><div id="scoreContainer">SCORE: <span id="score">0</span></div><span id="princessHealth" class="meter">Princess <span class="princess_name"></span></span><div class="button" id="reset">Reset</div></div>')
				.on('click', '#reset', function (event) {
					GAME.reset();
					move('right'); // MOVE SHOULD BE INSIDE OF THE GAME CLASS...
					event.stopPropogationdd();
				});
		};
		
		function createDefaultObjects() {
			$('body').append('<div id="princess">&nbsp;<div style="position: relative;"><div id="scoreBubble">+20</div></div></div>')
				.append('<div id="fairy">&nbsp;</div>')
				.append('<div id="grass">&nbsp;</div>')
				.append('<div id="dirt">&nbsp;</div>');
		};
		
		function createGroundedObjects(img, height, zIndex, amount) {
			for (var i = 0; i < amount; i++)
			{
				var lengthOfMap = GAME.right_boundary - GAME.left_boundary;
				var startPos = RAND.rand(lengthOfMap) - 100;
				var element = '<img id="obj' + GAME.objIdCounter + '" class="grounded" src="' + img + '">';
				$('body').append(element);
				$('#obj' + GAME.objIdCounter)
					.css('height', height + "px")
					.css('left', startPos)
					.css('zIndex', zIndex);
				
				var object = {
					left: startPos
				};
				GAME.objIdCounter++;
				GAME.grounded.push(object);
			}
		};
		
		function createBackgroundObjects(img, elevation, height, zIndex, step, amount) {
			for (var i = 0; i < amount; i++)
			{
				var lengthOfMap = GAME.right_boundary - GAME.left_boundary;
				var startPos = RAND.rand(lengthOfMap/5) * 5 - 100;
				var elementElevation = elevation[RAND.rand(elevation.length)];
				var elementHeight = height[RAND.rand(height.length)];
				
				var element = '<img id="obj' + GAME.objIdCounter + '" class="background" src="' + img + '">';
				$('body').append(element);
				$('#obj' + GAME.objIdCounter)
					.css('height', elementHeight + "px")
					.css('margin-bottom', elementElevation + "px")
					.css('left', startPos)
					.css('zIndex', zIndex);
				
				var object = {
					left: startPos,
					step: step
				};
				GAME.objIdCounter++;
				GAME.background.push(object);
			}
		};
	},
	
	createAnimals: function() {
		if (GAME.playing)
		{
			switch (RAND.rand(15))
			{
				case 0:
					GAME.createBird('red_raven');
				break;
				case 1:
					GAME.createBird('blue_raven');
				break;
				case 2:
					GAME.createBird('yellow_raven');
				break;
				case 3:
					GAME.createBird('green_raven');
				break;
				case 4:
					var spriteData = GAME.spriteData["frog"];
					GAME.createGroundAnimal("sprites/animals.png", spriteData, 0.2);
				break;
				case 5:
					var spriteData = GAME.spriteData["rabbit"];
					GAME.createGroundAnimal("sprites/animals.png", spriteData, 0.2);
				break;
				case 6:
					var spriteData = GAME.spriteData["butterfly"];
					GAME.createGroundAnimal("sprites/animals2.png", spriteData, 0.3, 10);
				break;
				case 7:
					var spriteData = GAME.spriteData["chicken"];
					GAME.createGroundAnimal("sprites/animals.png", spriteData, 0.2);
				break;
				case 8:
					var spriteData = GAME.spriteData["mouse"];
					GAME.createGroundAnimal("sprites/animals.png", spriteData, 0.2);
				break;
				case 9:
					var spriteData = GAME.spriteData["horse"];
					GAME.createGroundAnimal("sprites/animals2.png", spriteData, 0.25);
				break;
				case 10:
					var spriteData = GAME.spriteData["cow"];
					GAME.createGroundAnimal("sprites/animals2.png", spriteData, 0.1);
				break;
				case 11:
					var spriteData = GAME.spriteData["sheep"];
					GAME.createGroundAnimal("sprites/animals2.png", spriteData, 0.1);
				break;
				case 12:
					var spriteData = GAME.spriteData["puppy"];
					GAME.createGroundAnimal("sprites/animals2.png", spriteData, 0.225);
				break;
				case 13:
					var spriteData = GAME.spriteData["kitty"];
					GAME.createGroundAnimal("sprites/animals2.png", spriteData, 0.2);
				break;
				case 14:
					var spriteData = GAME.spriteData["chick"];
					GAME.createGroundAnimal("sprites/animals.png", spriteData, 0.15);
				break;
			}
			setTimeout(GAME.createAnimals, 4000);
		}
	},
	
	reset: function() {
		BaddieGenerator.stop();
		GAME.clearGameData();
		GAME.init();
		Title.show();
	},
	
	clearGameData: function () {
		$('body').empty();
		GAME.sprites = [];
		GAME.bats = [];
		GAME.bullets = [];
		GAME.batBullets = [];
		GAME.background = [];
		GAME.grounded = [];
		GAME.objIdCounter = 0;
		GAME.canStep = true;
		GAME.princessHealth = 100;
		GAME.score = 0;
	},
	
	princessHealth: 100,
	damagePrincess: function() {
		GAME.princessHealth -= 20;
		$('#princessHealth').css('background-size', GAME.princessHealth + '%');
		if (GAME.princessHealth <= 0)
			GAME.gameover();
	
		var $damage = $('#damage');
		$damage.css('display', 'block');
		setTimeout(function () {
			$damage.css('display', 'none');
		}, 300);
	},
	
	score: 0,
	addScore: function(position) {
		var $bubble = $( "#scoreBubble" );
		$bubble.animate({
			opacity: 1.0
		}, 500, function() {
			$bubble.animate({
				opacity: 0.0
			}, 3000);
		});
	
		GAME.score += 20;
		$('#score').html(GAME.score);
	},
	
	gameover: function () {
		GAME.playing = false;
		var score = GAME.score;
		BaddieGenerator.stop();
		GAME.clearGameData();
		GAME.init();
		$('#points').html(score);
		GameOver.show();
	},
	
	win: function() {
		GAME.playing = false;
		var score = GAME.score;
		BaddieGenerator.stop();
		GAME.clearGameData();
		GAME.init();
		$('#gameOver').children('h1').html('You win with a score of ' + score + '!');
		GameOver.show();
	},
	
	createBatBullet: function(left, height) {
		var element = '<div id="obj' + GAME.objIdCounter + '" class="bullet">&nbsp;</div>';
		var container = $('#bb_container');
		container.append(element);
		height += container.offset().top;
		$('#obj' + GAME.objIdCounter)
			.css('backgroundImage', 'url(pictures/FireBall.png)')
			.css('height', 15 + "px")
			.css('width', 15 + "px")
			.css('bottom', 20 + "%")
			.css('margin-bottom', height + "px")
			.css('left', left + "%")
			.css('zIndex', -1);
		
		GAME.batBullets.push(new BatBullet(GAME.objIdCounter, left, height));
		GAME.objIdCounter++;
	},
	
	createBullet: function(clickLocation) {
		GAME.$magicSound[0].play();
		setTimeout(function() {
			GAME.$magicSound[0].pause();
			GAME.$magicSound[0].currentTime = 0;
		}, 1800);
	
		var pos = $('#princess').offset();
		var direction = new Vector(clickLocation.x - pos.left - 15, clickLocation.y - pos.top - 15);
		
		var element = '<div id="obj' + GAME.objIdCounter + '" class="bullet">&nbsp;</div>';
		$('body').append(element);
		$('#obj' + GAME.objIdCounter)
			.css('backgroundImage', 'url(pictures/magicBlast.png)')
			.css('height', 30 + "px")
			.css('width', 30 + "px")
			.css('top', pos.top + "px")
			.css('left', pos.left + "px")
			.css('zIndex', -1);
		
		var bullet = new Bullet(GAME.objIdCounter, pos, direction);
		GAME.bullets.push(bullet);
		GAME.objIdCounter++;
	},
	
	createSprite: function(img, frames, height, width, elevation, elevationDeviation, direction, speed, zIndex) {
		var startPos = GAME.left_boundary;
		if (direction == 'left') startPos = GAME.right_boundary;
		
		var element = '<div id="obj' + GAME.objIdCounter + '" class="sprite">&nbsp;</div>';
		$('body').append(element);
		$('#obj' + GAME.objIdCounter)
			.css('backgroundImage', 'url(' + img + ')')
			.css('height', height + "px")
			.css('width', width + "px")
			.css('margin-bottom', elevation + "px")
			.css('left', startPos + "%")
			.css('zIndex', zIndex);
		
		if (direction == 'left') $('#obj' + GAME.objIdCounter).css('transform', 'rotateY(180deg)');
		
		var sprite = new Sprite(GAME.objIdCounter, frames, elevation, elevationDeviation, direction, speed, startPos);
		GAME.sprites.push(sprite);
		GAME.objIdCounter++;
		return sprite;
	},
	
	createBird: function (bird) {
		var elevation = RAND.rand(100) + 200;
		var elevationDeviation = RAND.rand(30);
		
		var direction = RAND.randDirection();
		var speed = RAND.rand(5) / 10 + 0.5;
		
		var birdObj = GAME.spriteData[bird];
		
		GAME.createSprite('sprites/birds.png', birdObj.frames, birdObj.height, birdObj.width, elevation, elevationDeviation, direction, speed, 5);
	},
	
	createGroundAnimal: function(img, spriteData, speed, elevationDeviation) {
		elevationDeviation = typeof elevationDeviation !== 'undefined' ? elevationDeviation : 1;
		var direction = RAND.randDirection();
		
		GAME.createSprite(img, spriteData.frames,
						  spriteData.height, spriteData.width,
						  0, elevationDeviation, direction, speed, -1);
	},
}

var IO = {
	keyPress: function(event) {
		switch(event.which)
		{
			case 65: // Key_A
			case 37: // Left Arrow Key
				GAME.moving = true;
				GAME.direction = 'left';
			break;
			
			case 68: // Key_D
			case 39: // Right Arrow Key
				GAME.moving = true;
				GAME.direction = 'right';
			break;
			
			default: break;
		}
	},
	
	keyRelease: function(event) {
		switch(event.which)
		{
			case 65: // Key_A
			case 37: // Left Arrow Key
				if (GAME.direction == 'left')
				{
					GAME.moving = false;
				}
			break;
			
			case 68: // Key_D
			case 39: // Right Arrow Key
				if (GAME.direction == 'right')
				{
					GAME.moving = false;
				}
			break;
			
			default: break;
		}
	},
	
	click: function(event) {
		var clickLocation = new Vector(event.clientX, event.clientY);
		if (GAME.canFire && !GAME.showTitle)
		{
			GAME.createBullet(clickLocation);
			GAME.canFire = false;
			setTimeout(function () {
				GAME.canFire = true;
			}, GAME.reloadTime);
		}
		event.preventDefault();
	}
}

var Music = {
	change: function(fileName) {
		var audio = $("#music");      
		audio.children('source').attr("src", "music/" + fileName);
		audio[0].volume = 1.0;
		audio[0].pause();
		audio[0].load(); //suspends and restores all audio element
		audio[0].play();
	},
	
	fadeInto: function(fileName) {
		var audio = $('#music')[0];
		fadeHelper();
		
		function fadeHelper() {
			var volume = audio.volume - 0.01;
			audio.volume = Math.max(0, volume);
			
			if (audio.volume > 0)
			{
				setTimeout(fadeHelper, 30);
			}
			else
			{
				Music.change(fileName);
			}
		}
	}
}

var Title = {
	show: function() {
		$('#title').show();
		GAME.createAnimals();
		$('#name').focus();
		GAME.showTitle = true;
	},
	
	hide: function() {
		$('#title').hide();
		BaddieGenerator.run();
		setTimeout( function() {
			GAME.showTitle = false;
		}, 200);
	}
};

var GameOver = {
	show: function() {
		$('#gameOver').show();
	},
	
	hide: function() {
		$('#gameOver').hide();
		GAME.playing = true;
	}
};

var BaddieGenerator = {
	baseTime: 20000,
	baddieTimer: 20000,
	baseChange: 0.1,
	timeChange: 0.1,
	timeoutID: 0,
	
	run: function() {
		BaddieGenerator.createGiantBat();
		BaddieGenerator.baddieTimer -= Math.floor(BaddieGenerator.baddieTimer * BaddieGenerator.timeChange);
		BaddieGenerator.timeChange -= 0.001;
		if (BaddieGenerator.baddieTimer <= 300)
		{
			BaddieGenerator.stop();
			winIfDragonsDead();
		}
		else
		{
			BaddieGenerator.timeoutID = setTimeout(BaddieGenerator.run, BaddieGenerator.baddieTimer);
		}
	},
	
	stop: function() {
		clearTimeout(BaddieGenerator.timeoutID);
		BaddieGenerator.timeChange = BaddieGenerator.baseChange;
		BaddieGenerator.baddieTimer = BaddieGenerator.baseTime;
	},
	
	createGiantBat: function() {
		var direction = RAND.randDirection();
		var bat = GAME.spriteData['dragon'];
		var sprite = GAME.createSprite("sprites/dragon.png", bat.frames, bat.height, bat.width, 300, 50, direction, 0.7, 1);
		GAME.bats.push(new Bat(sprite, GAME.reloadTime));
	},
};

function winIfDragonsDead()
{
	if (GAME.princessHealth > 0 && GAME.playing)
	{
		if (GAME.bats.length <= 0) GAME.win();
		else setTimeout(winIfDragonsDead, 1000);
	}
}

$(function () {
	GAME.init();
	Title.show();
	mainLoop();
	$('body').keydown( IO.keyPress )
		.keyup( IO.keyRelease )
		.click( IO.click );
});

function mainLoop()
{
	if (GAME.moving)
	{
		move(GAME.direction);
	}
	updateFairy(0.3);
	updateBullets();
	updateSprites();
	
	setTimeout(mainLoop, 100);
}

var other_speed = GAME.groundSpeed/100.0 * $('body').width();
function move(direction)
{
	updateObjects();
	if (GAME.canStep)
	{
		GAME.walk = (GAME.walk + 1) % 4;
		$('#princess').css('backgroundPosition', getPrincessImagePosition());
		GAME.canStep = false;
		setTimeout( function() {
			GAME.canStep = true;
		}, 140);
	}
	
	function updateObjects()
	{
		updateGround();
		updateBackgroundObjects();
		function updateGround()
		{
			updateGroundedObjects(GAME.groundSpeed);
			updateOtherObjectsWithGround();
			
			if (GAME.direction == 'right') GAME.dirtPos -= GAME.groundSpeed;
			else GAME.dirtPos += GAME.groundSpeed;
			if (GAME.dirtPos <= -200) GAME.dirtPos += 200;
			if (GAME.dirtPos >= 0) GAME.dirtPos -= 200;
			$('#dirt').add('#grass')
				.css('left', GAME.dirtPos + "%");
				
			function updateGroundedObjects(step)
			{
				$('.grounded').each( function(index) {
					var obj = GAME.grounded[index];
					if (GAME.direction == 'left') obj.left += step;
					else obj.left -= step;
					if (obj.left < GAME.left_boundary) obj.left = GAME.right_boundary - RAND.rand(GAME.edgeJump);
					if (obj.left > GAME.right_boundary) obj.left = GAME.left_boundary + RAND.rand(GAME.edgeJump);
					$(this).css('left', obj.left + "%");
				});
			}
			function updateOtherObjectsWithGround()
			{
				for (var i = 0; i < GAME.bullets.length; i++)
				{
					var bullet = GAME.bullets[i];
					
					if (GAME.direction == 'right')
					{
						bullet.position.left -= other_speed;
					}
					else
					{
						bullet.position.left += other_speed;
					}
					
					bullet.$.css('left', bullet.position.left + "px");
				}
				
				for (var i = 0; i < GAME.batBullets.length; i++)
				{
					var bullet = GAME.batBullets[i];
					
					if (GAME.direction == 'right')
					{
						bullet.left -= GAME.groundSpeed;
					}
					else
					{
						bullet.left += GAME.groundSpeed;
					}
					
					bullet.$.css('left', bullet.left + "%");
				}

				for (var i = 0; i < GAME.sprites.length; i++)
				{
					var sprite = GAME.sprites[i];
					if (GAME.direction == 'right')
					{
						sprite.left -= GAME.groundSpeed;
					}
					else
					{
						sprite.left += GAME.groundSpeed;
					}
					$('#obj' + sprite.id).css('left', sprite.left + "%");
				}
				
			}	
		}
		function updateBackgroundObjects()
		{
			$('.background').each( function(index) {
				var obj = GAME.background[index];
				if (GAME.direction == 'left') obj.left += obj.step;
				else obj.left -= obj.step;
				if (obj.left < GAME.left_boundary) obj.left = GAME.right_boundary - RAND.rand(GAME.edgeJump);
				if (obj.left > GAME.right_boundary) obj.left = GAME.left_boundary + RAND.rand(GAME.edgeJump);
				$(this).css('left', obj.left + "%");
			});
		}
	}
	function getPrincessImagePosition()
	{
		var xPos = 0 - (32 * GAME.walk);
		var yPos = 0;
		if (GAME.direction == 'right') yPos = -65;
		return xPos + "px " + yPos + "px";
	}
}

function updateFairy(step)
{
	var fairy = GAME.fairy;
	if (fairy.flightDirection == 'up')
	{
		fairy.distFromGround++;
		if (fairy.distFromGround >= 35) fairy.flightDirection = 'down';
	}
	else
	{
		fairy.distFromGround--;
		if (fairy.distFromGround <= 15) fairy.flightDirection = 'up';
	}
	if (fairy.direction == 'right')
	{
		fairy.left += step;
		if (fairy.left >= 53)
		{
			fairy.direction = 'left';
			fairy.yPos = -25;
			fairy.zIndex = -1;
		}
	}
	else
	{
		fairy.left -= step;
		if (fairy.left <= 46)
		{
			fairy.direction = 'right';
			fairy.yPos = -50;
			fairy.zIndex = 1;
		}
	}
	fairy.step = (fairy.step + 1) % 4;
	$('#fairy').css('left', fairy.left + "%")
		.css('backgroundPosition', getFairySpritePosition())
		.css('marginBottom', fairy.distFromGround + "px")
		.css('zIndex', fairy.zIndex);
	
	function getFairySpritePosition()
	{
		var xPos =  0 - (GAME.fairy.step * 25);
		var yPos = GAME.fairy.yPos;
		return xPos + "px " + yPos + "px";
	}
}

var bb_container_top = 0;
function updateBullets()
{
	for (var i = 0; i < GAME.bullets.length; i++)
	{
		var bullet = GAME.bullets[i];
		
		bullet.block.updateCenter(bullet.$.offset());
		var collided = collidesWithBat(bullet.block);
		
		bullet.update(GAME.magicSpeed);
		
		bullet.$
			.css('left', bullet.position.left)
			.css('top', bullet.position.top);
		
		if (collided ||
			bullet.position.left > 2000 ||
			bullet.position.left < -100 ||
			bullet.position.top < -100 ||
			bullet.position.top > 1500)
		{
			GAME.bullets.remove(bullet);
			bullet.$.remove();
		}
	}
	
	bb_container_top += 5;
	GAME.$bb_container.css('top', bb_container_top);
	for (var i = 0; i < GAME.batBullets.length; i++)
	{
		var bullet = GAME.batBullets[i];
		
		bullet.block.updateCenter(bullet.$.offset());
		var collides = GAME.princessBlock.collides(bullet.block);
		if (collides) GAME.damagePrincess();

		if(collides || bullet.$.offset().top > $('body').height())
		{
			GAME.batBullets.remove(bullet);
			bullet.$.remove();
		}
	}
	
	function collidesWithBat(block)
	{
		if (GAME.bats.length > 0)
		{
			for (var i = 0; i < GAME.bats.length; i++)
			{
				var bat = GAME.bats[i];
				var $bat = $('#obj' + bat.sprite.id);
				
				var batBlock = new Block($bat.offset(), 95, 95);
				
				if (block.collides(batBlock))
				{
					GAME.$dragonSound[0].currentTime = GAME.dragonSoundStart;
					GAME.$dragonSound[0].play();
					setTimeout(function() {
						console.log(GAME.$dragonSound[0].currentTime);
						GAME.$dragonSound[0].pause();
					}, 3000);
					
					GAME.addScore(batBlock.center);
					GAME.sprites.remove(bat.sprite);
					GAME.bats.remove(bat);
					$bat.remove();
					return true;
				}
			}
		}
		return false;
	}
}

function updateSprites()
{
	for (var i = 0; i < GAME.sprites.length; i++)
	{
		var sprite = GAME.sprites[i];
		sprite.step = (sprite.step + 1) % sprite.frames.length;
		
		sprite.updateElevation();
		sprite.updatePosition();
		
		$('#obj' + sprite.id).css('backgroundPosition', sprite.frames[sprite.step])
			.css('marginBottom', sprite.currentElevation + "px")
			.css('left', sprite.left + "%");
		
		if (sprite.left > GAME.right_boundary ||
			sprite.left < GAME.left_boundary)
		{
			GAME.sprites.remove(sprite);
			$('#obj' + sprite.id).remove();
		}
	}
	for (var i = 0; i < GAME.bats.length; i++)
	{
		var bat = GAME.bats[i];
		bat.update();
	}
}











