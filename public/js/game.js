let config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let game = new Phaser.Game(config);

function preload() {
  this.load.image('car', 'assets/black-car.png');
  this.load.image('star', 'assets/star_gold.png');
  this.load.image(
    'background',
    'https://files.twoplayergames.org/files/games/mobile/o1/Pixel_Kart/images/bg-sheet0.png'
  );
}

let bwMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0,
];

function create() {
  let self = this;
  this.socket = io();

  let background = this.add.image(400, 300, 'background');
  background.setScale(2.5);

  this.physics.world.setBounds(10, 90, background.displayWidth - 20, background.displayHeight - 30);

  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.socket.on('teamChanged', function (playerInfo) {
    if (self.socket.id === playerInfo.playerId) {
      self.car.setTint(playerInfo.team === 'blue' ? 0x3333ff : 0xff0000);
    } else {
      const otherPlayer = self.otherPlayers.getChildren().find((child) => child.playerId === playerInfo.playerId);
      otherPlayer.setTint(playerInfo.team === 'blue' ? 0xacacff : 0xff5a00);
    }
  });
  this.cursors = this.input.keyboard.createCursorKeys();

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('starLocation', function (starLocation) {
    console.log(starLocation);
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(
      self.car,
      self.star,
      function () {
        this.socket.emit('starCollected');
        this.car.data += 100;

        setTimeout(() => {
          this.car.data -= 100;
        }, 3000);
      },
      null,
      self
    );
  });

  document.getElementById('switchTeam').addEventListener('click', function () {
    changeTeam(self);
  });
}

function diagonal90DegreesBorder(x, y, numberOfPoints, downOrUp) {
  for (let i = 0; i < numberOfPoints; i++) {
    if (downOrUp === 'down') {
      this.borders
        .create(x + i, y + i, 'border')
        .setScale(0.001, 0.001)
        .refreshBody();
    } else {
      this.borders
        .create(x + i, y - i, 'border')
        .setScale(0.001, 0.001)
        .refreshBody();
    }
  }
}

function addPlayer(self, playerInfo) {
  self.car = self.physics.add.image(playerInfo.x, playerInfo.y, 'car').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    self.car.setTint(0x3333ff);
  } else {
    self.car.setTint(0xff0000);
  }

  // Outside borders
  this.borders = self.physics.add.staticGroup();

  diagonal90DegreesBorder(0, 145, 65, 'up');
  this.borders.create(155, 90, 'border').setScale(5.5, 0.001).refreshBody();
  diagonal90DegreesBorder(255, 80, 65, 'down');
  this.borders.create(310, 210, 'border').setScale(0.001, 4).refreshBody();
  diagonal90DegreesBorder(318, 260, 15, 'down');
  this.borders.create(340, 285, 'border').setScale(1, 0.001).refreshBody();
  diagonal90DegreesBorder(355, 275, 185, 'up');
  diagonal90DegreesBorder(735, 80, 65, 'down');
  diagonal90DegreesBorder(640, 520, 195, 'up');
  diagonal90DegreesBorder(0, 460, 65, 'down');

  // Inside borders
  diagonal90DegreesBorder(125, 220, 20, 'up');
  this.borders.create(165, 200, 'border').setScale(1, 0.001).refreshBody();
  diagonal90DegreesBorder(170, 200, 25, 'down');
  this.borders.create(195, 275, 'border').setScale(0.001, 3.5).refreshBody();
  diagonal90DegreesBorder(180, 330, 75, 'down');
  this.borders.create(340, 390, 'border').setScale(5, 0.001).refreshBody();
  diagonal90DegreesBorder(435, 400, 185, 'up');
  this.borders.create(645, 200, 'border').setScale(1, 0.001).refreshBody();
  diagonal90DegreesBorder(660, 200, 15, 'down');
  this.borders.create(680, 250, 'border').setScale(0.001,2.5).refreshBody();
  diagonal90DegreesBorder(570, 395, 105, 'up');
  this.borders.create(355, 405, 'border').setScale(13, 0.001).refreshBody();
  diagonal90DegreesBorder(130, 385, 10, 'down');
  this.borders.create(120, 305, 'border').setScale(0.001, 5).refreshBody();

  self.physics.add.collider(self.car, this.borders);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'car').setOrigin(0.5, 0.5).setDisplaySize(53, 40);

  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0xacacff);
  } else {
    otherPlayer.setTint(0xff5a00);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function update() {
  if (this.car) {
    if (this.cursors.left.isDown) {
      this.car.setAngularVelocity(-150 - this.car.data);
    } else if (this.cursors.right.isDown) {
      this.car.setAngularVelocity(150 + this.car.data);
    } else {
      this.car.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(this.car.rotation, 200 + this.car.data, this.car.body.velocity);
    } else if (this.cursors.down.isDown) {
      this.physics.velocityFromRotation(this.car.rotation, -200 - this.car.data, this.car.body.velocity);
    } else {
      this.car.setVelocity(0);
    }

    this.car.setCollideWorldBounds(true);

    let x = this.car.x;
    let y = this.car.y;
    let r = this.car.rotation;
    if (
      this.car.oldPosition &&
      (x !== this.car.oldPosition.x || y !== this.car.oldPosition.y || r !== this.car.oldPosition.rotation)
    ) {
      this.socket.emit('playerMovement', { x: this.car.x, y: this.car.y, rotation: this.car.rotation });
    }

    this.car.oldPosition = {
      x: this.car.x,
      y: this.car.y,
      rotation: this.car.rotation,
    };
  }
}

function changeTeam(self) {
  if (self.car) {
    self.socket.emit('teamChanged');
  }
}
