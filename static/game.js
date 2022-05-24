var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1280,
  height: 600,
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
}

var game = new Phaser.Game(config)
var graphics, total_player_lbl, total_players, player_joined_info, joined_info_pos;

function preload() {
  this.load.image('car', 'static/assets/car.png')
}

function create() {
  var self = this
  this.socket = io()
  this.otherPlayers = this.physics.add.group()

  this.socket.on('currentPlayers', function (players) {
    //console.log('currentPlayers emitted')
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id])
      } else {
        addOtherPlayers(self, players[id])
      }
    })
  })

  this.socket.on('newPlayer', function (playerInfo) {

    addOtherPlayers(self, playerInfo)
  })

  this.socket.on('playerDisconnected', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();

        //-----------------------------------------------------------
        total_players--;
        total_player_lbl.setText('Total Players ' + total_players);

        //player_joined_info.y += config.height*0.03;
        //player_joined_info.setText(otherPlayer.name+' disconnected')
        //------------------------------------------------------------

      }
    })
  })

  // this.socket.on('onlinePlayers', function (online_players) {
  //   console.log('online players - ' + online_players.length);
  //   var temp_str="";
  //   for (var i = 0; i < online_players.length; i++) {
  //     temp_str += "\n"+online_players[i]
  //   }
  //   player_joined_info.setText(temp_str)
  // })

  this.cursors = this.input.keyboard.createCursorKeys()

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation)
        otherPlayer.setPosition(playerInfo.x, playerInfo.y)
      }
    })
  })

  //------------------------------------------------------------------------------------------
  console.log('rec')
  graphics = this.add.graphics();
  graphics.fillStyle(0xffff00, 1);
  graphics.alpha = 0.5;
  graphics.fillRoundedRect(config.width * 0.8, 0, config.width * 0.2, config.height * 0.6, 32);

  total_players = 0;
  joined_info_pos = config.height * 0.08;
  total_player_lbl = this.add.text(config.width * 0.85, config.height * 0.05, 'Total Players ' + total_players, { font: '15px sans-serif', fill: 'blue' }).setOrigin(0.5)
  player_joined_info = this.add.text(config.width * 0.85, joined_info_pos, '', { font: '15px sans-serif', fill: 'blue' }).setOrigin(0.5)

  //------------------------------------------------------------------------------------------

}

function addPlayer(self, playerInfo) {
  self.car = self.physics.add.image(playerInfo.x, playerInfo.y, 'car')
    .setOrigin(0.5, 0.5)
    .setDisplaySize(50, 50)

  self.car.setCollideWorldBounds(true)
  self.car.setTint(playerInfo.color)
  self.car.setDrag(1000);
  total_players++;
  total_player_lbl.setText('Total Players ' + total_players);

  //player_joined_info.y += config.height*0.03;
  //player_joined_info.setText(playerInfo.playerId+' connected')
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, 'car')
    .setOrigin(0.5, 0.5)
    .setDisplaySize(50, 50)
    .setRotation(playerInfo.rotation)

  otherPlayer.playerId = playerInfo.playerId
  otherPlayer.setTint(playerInfo.color)
  self.otherPlayers.add(otherPlayer);

  total_players++;
  total_player_lbl.setText('Total Players ' + total_players);

  //player_joined_info.y += config.height*0.03;
  //player_joined_info.setText(playerInfo.playerId+' connected')
}

function update() {
  if (this.car) {
    if (this.cursors.left.isDown && (this.cursors.up.isDown || this.cursors.down.isDown)) {
      this.car.setAngularVelocity(-100)
    } else if (this.cursors.right.isDown && (this.cursors.up.isDown || this.cursors.down.isDown)) {
      this.car.setAngularVelocity(100)
    } else {
      this.car.setAngularVelocity(0)
    }

    const velX = Math.cos((this.car.angle - 360) * 0.01745)
    const velY = Math.sin((this.car.angle - 360) * 0.01745)
    if (this.cursors.up.isDown) {
      this.car.setVelocityX(200 * velX)
      this.car.setVelocityY(200 * velY)
    } else if (this.cursors.down.isDown) {
      this.car.setVelocityX(-100 * velX)
      this.car.setVelocityY(-100 * velY)
    } else {
      this.car.setAcceleration(0)
    }

    var x = this.car.x
    var y = this.car.y
    var r = this.car.rotation
    if (this.car.oldPosition && (x !== this.car.oldPosition.x || y !== this.car.oldPosition.y || r !== this.car.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.car.x, y: this.car.y, rotation: this.car.rotation })
    }

    this.car.oldPosition = {
      x: this.car.x,
      y: this.car.y,
      rotation: this.car.rotation
    }
  }
}
