const EventEmitter = require('events').EventEmitter;
const vec3 = require('vec3').Vec3;

var libs = {
  fight: require('./lib/fight.js'),
  chest: require('./lib/chest.js'),
  wander: require('./lib/wander.js'),
  webinterface: require('./lib/webinterface.js'),
}

module.exports = init;

function init(mineflayer) {
  return inject;
}

function inject(bot) {
  bot.survivalgames = new EventEmitter();
  bot.survivalgames.defaultoptions = {
    'chestBlocks': [ 54, 146 ], // '168:2'
    'team': [ ],
    'breakableBlocks': [ 18, 161, 20, 46 ],
    'invertBreakable': false,
    'missRate': 0.2,
    'canCraft': true,
  };
  bot.survivalgames.running = false;
  bot.survivalgames.gamestate = 'protected'; // [ 'protected', 'deathmatch', 'ingame', 'end', 'start' ]
  bot.survivalgames.dostate = 'none'; // [ 'none', 'inventory', 'fight', 'searching', 'wandering' ]
  bot.survivalgames.options = bot.survivalgames.defaultoptions;
  bot.survivalgames.openedChests = [];
  bot.survivalgames.spawnPoint = new vec3(0, 0, 0);

  bot.survivalgames.begin = begin;
  bot.survivalgames.stop = stop;

  for(let k in libs) {
    libs[k]()(bot);
  }

  bot.webinterface.start(80);

  /* This kind of works for knockback */
  bot._client.on('entity_velocity', (jsonMsg) => {
    if(jsonMsg.entityId === bot.entity.id){
      setTimeout(() => {
        bot.entity.velocity.x = jsonMsg.velocityX / 320;
        bot.entity.velocity.y = jsonMsg.velocityY / 320;
        bot.entity.velocity.z = jsonMsg.velocityZ / 320;
      }, 10);
    }
  });

  bot.navigate.on('cannotFind', function(path) {
    navStop();
  });

  bot.navigate.on('arrived', function() {
    navStop();
  });

  bot.navigate.on('interrupted', function() {
    navStop();
  });

  bot.navigate.on('stop', function() {
    navStop();
  });

  function navStop() {
    /*
    if(['searching'].includes(bot.survivalgames.dostate)) {
      bot.survivalgames.chest.search();
    }
    */
    bot.survivalgames.dostate = 'none';
  }

  function begin(options = bot.survivalgames.defaultoptions) {
    if(!bot.survivalgames.running) {
      for(let k in options) {
        bot.survivalgames.options[k] = options[k];
      }
      bot.survivalgames.spawnPoint = bot.entity.position;
      bot.survivalgames.running = true;
      setTimeout(tick, 0);
      setTimeout(stick, 0);
      bot.survivalgames.emit('begin');
    }
  }

  function stop(reason) {
    if(bot.survivalgames.running) {
      bot.survivalgames.running = false;
      bot.navigate.stop();
      bot.setControlState('sprint', false);
      bot.setControlState('jump', false);
      bot.setControlState('forward', false);
      bot.survivalgames.emit('stop', reason);
    }
  }

  bot.survivalgames.fight.on('stop', () => {
    bot.survivalgames.dostate = 'none';
  });

  bot.survivalgames.fight.on('begin', () => {
    bot.survivalgames.dostate = 'fight';
  });

  function wait(millis) {
    return new Promise((res, rej) => {
      setTimeout(() => {
        res();
      }, millis);
    });
  }

  function lookAtRot(point) {
    const delta = point.minus(bot.entity.position.offset(0, bot.entity.height, 0));
    const yaw = Math.atan2(-delta.x, -delta.z);
    const groundDistance = Math.sqrt(delta.x * delta.x + delta.z * delta.z);
    const pitch = Math.atan2(delta.y, groundDistance);
    return { yaw: yaw, pitch: pitch };
  }

  var difference = function (a, b) { return Math.abs(a - b); }

  function isLookingAt(point, pm) {
    var l = lookAtRot(point);
    var yaw = bot.entity.yaw;
    var pitch = bot.entity.pitch;
    if(difference(l.yaw, yaw) < pm && difference(l.pitch, pitch) < pm) {
      return true;
    }else{
      return false;
    }
  }

  function tick() {
    if(!bot.survivalgames.running) {
      return;
    }
    /*
    if(['searching', 'none', 'wandering'].includes(bot.survivalgames.dostate)) {
      var blocks = bot.findBlockSync({
        point: bot.entity.position,
        matching: (block) => {
          return bot.survivalgames.options.chestBlocks.includes(block.type) || bot.survivalgames.options.chestBlocks.includes(block.type + ':' + block.metadata);
        },
        maxDistance: 5,
        count: 10,
      });
      if(blocks.length > 0) {
        for(let block of blocks) {
          if(!bot.survivalgames.openedChests.includes(block.position.toString())) {
            bot.survivalgames.openedChests.push(block.position.toString());
            bot.activateBlock(block);
            bot.survivalgames.currentPath = null;
            bot.survivalgames.dostate = 'none';
            break;
          }
        }
      }
    }
    */
    /*
    if(['searching', 'none', 'wandering'].includes(bot.survivalgames.dostate) && bot.survivalgames.currentPath != null && !bot.survivalgames.openedChests.includes(bot.survivalgames.currentPath.toString())) {
      var block = bot.blockAt(bot.survivalgames.currentPath);
      if(bot.survivalgames.currentPath.distanceTo(bot.entity.position) < 4 && (bot.survivalgames.options.chestBlocks.includes(block.type) || bot.survivalgames.options.chestBlocks.includes(block.type + ':' + block.metadata))) {
        bot.survivalgames.openedChests.push(bot.survivalgames.currentPath.toString());
        bot.activateBlock(block);
        bot.survivalgames.currentPath = null;
        bot.survivalgames.dostate = 'none';
      }
    }
    */

    if(bot.survivalgames.running) {
      setTimeout(tick, 100);
    }
  }

  function stick() {
    if(!bot.survivalgames.running) {
      return;
    }
    if(['searching', 'none', 'wandering'].includes(bot.survivalgames.dostate)) {
      (async() => {
        var smallestDistance = Number.MAX_SAFE_INTEGER;
        var nearestPlayer;
        for(let name in bot.players) {
          let player = bot.players[name];
          if(player.entity != null && player.username != bot.username && !bot.survivalgames.options.team.includes(player.username)) {
            var pp = new vec3(player.entity.position.x, 1, player.entity.position.z);
            var mp = new vec3(bot.entity.position.x, 1, bot.entity.position.z);
            var dist = pp.distanceTo(mp);
            if(smallestDistance > dist) {
              nearestPlayer = player;
              smallestDistance = dist;
            }
          }
        }
        if(smallestDistance > 32 && nearestPlayer != null && nearestPlayer.entity != null) {
          bot.survivalgames.dostate = 'none';
          bot.survivalgames.fight.stop();
          let re = bot.navigate.findPathSync(nearestPlayer.entity.position, { timeout: 800 });
          bot.navigate.walk(re.path);
        }else if(nearestPlayer != null && nearestPlayer.entity != null){
          bot.navigate.stop();
          bot.survivalgames.dostate = 'fight';
          bot.survivalgames.fight.begin(nearestPlayer);
        }else{
          if(bot.survivalgames.fight.isRunning()) {
            bot.survivalgames.fight.stop();
          }
        }
      })();
    }

    console.log(bot.survivalgames.dostate);
    if(['none', 'wandering'].includes(bot.survivalgames.dostate)) {
      bot.survivalgames.chest.search().then((success) => {
        console.log(success);
        if(success) {
          bot.survivalgames.dostate = 'searching';
        }
      });
    }

    if(bot.survivalgames.dostate === 'none') {
      bot.survivalgames.dostate = 'wandering';
      setTimeout(() => {
        if(bot.survivalgames.dostate === 'wandering') {

          var randomRadius = 400;
          var randomX = Math.floor((Math.random() - 0.5) * randomRadius * 2);
          var randomZ = Math.floor((Math.random() - 0.5) * randomRadius * 2);
          var yOffset = 5;

          let re = bot.navigate.findPathSync(bot.entity.position.offset(randomX, yOffset, randomZ), { timeout: 800 });
          bot.survivalgames.dostate = 'wandering';
          bot.navigate.walk(re.path);
        }
      }, 100);
    }


    if(bot.survivalgames.running) {
      setTimeout(stick, 1000);
    }
  }

}
