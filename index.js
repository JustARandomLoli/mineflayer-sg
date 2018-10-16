const EventEmitter = require('events').EventEmitter;
const vec3 = require('vec3').Vec3;

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
    'missRate': 0.5,
  };
  bot.survivalgames.running = false;
  bot.survivalgames.gamestate = 'protected'; // [ 'protected', 'deathmatch', 'ingame', 'end', 'start' ]
  bot.survivalgames.dostate = 'none'; // [ 'none', 'inventory', 'fight', 'searching', 'wandering' ]
  bot.survivalgames.options = bot.survivalgames.defaultoptions;
  bot.survivalgames.currentPath = null;
  bot.survivalgames.openedChests = [];

  bot.survivalgames.begin = begin;
  bot.survivalgames.stop = stop;

  bot.navigate.on('cannotFind', function(path) {
    navStop();
  });

  bot.navigate.on('arrived', function() {
    navStop();
  });

  bot.navigate.on('interrupted', function() {
    navStop();
  });

  function navStop() {
    bot.survivalgames.currentPath = null;
    bot.chat('navStop');
  }

  function begin(options = bot.survivalgames.defaultoptions) {
    if(!bot.survivalgames.running) {
      for(let k in options) {
        bot.survivalgames.options[k] = options[k];
      }
      bot.survivalgames.currentPath = null;
      bot.survivalgames.attackingPlayer = null;
      bot.survivalgames.running = true;
      setTimeout(tick, 0);
      setTimeout(stick, 0);
      bot.survivalgames.emit('begin');
    }
  }

  function stop(reason) {
    if(bot.survivalgames.running) {
      bot.survivalgames.currentPath = null;
      bot.survivalgames.running = false;
      bot.navigate.stop();
      bot.survivalgames.attackingPlayer = null;
      bot.setControlState('sprint', false);
      bot.setControlState('jump', false);
      bot.setControlState('forward', false);
      bot.survivalgames.emit('stop', reason);
    }
  }

  bot.on('windowOpen', (window) => {
    bot.survivalgames.dostate = 'inventory';
    console.log(window);
    new Promise(async(resolve, reject) => {
      for(let item of window.slots) {
        if(item != null) {
          bot.clickWindow(item.slot, 1, 0);
          //await wait(200);
          //bot.clickWindow(window.inventorySlotStart + , 1, 0);
          await wait(500);
        }
      }
      bot.closeWindow(window);
    });

  });

  bot.on('windowClose', (window) => {
    bot.survivalgames.dostate = 'none';
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

    if(bot.survivalgames.dostate === 'fight' && bot.survivalgames.attackingPlayer != null && bot.survivalgames.attackingPlayer.entity != null) {
      var dist = bot.survivalgames.attackingPlayer.entity.position.distanceTo(bot.entity.position);
      var p = bot.survivalgames.attackingPlayer.entity.position.offset(0, 1.8, 0);
      bot.lookAt(p);
      if(dist < 10) {
        if(dist >= 3 && Math.random() > bot.survivalgames.options.missRate) {
           bot._client.write('arm_animation', {hand:0});
        }else if(dist < 3){
          bot._client.write('arm_animation', {hand:0});
        }
        if(Math.random() > bot.survivalgames.options.missRate && dist < 2.5) {
          bot.attack(bot.survivalgames.attackingPlayer.entity);
        }
      }
    }else if(['searching', 'none', 'wandering'].includes(bot.survivalgames.dostate) && bot.survivalgames.currentPath != null && !bot.survivalgames.openedChests.includes(bot.survivalgames.currentPath)) {
      bot.lookAt(bot.survivalgames.currentPath);
      if(bot.survivalgames.currentPath.distanceTo(bot.entity.position) < 4) {
        bot.setControlState('sprint', false);
        bot.setControlState('jump', false);
        bot.setControlState('forward', false);
        bot.activateBlock(bot.blockAt(bot.survivalgames.currentPath));
        bot.survivalgames.openedChests.push(bot.survivalgames.currentPath);
      }
    }


    if(bot.survivalgames.running) {
      setTimeout(tick, 100);
    }
  }

  function stick() {
    if(!bot.survivalgames.running) {
      return;
    }
    if(['searching', 'fight', 'none', 'wandering'].includes(bot.survivalgames.dostate)) {
      (async() => {
        var smallestDistance = Number.MAX_SAFE_INTEGER;
        var nearestPlayer;
        for(let name in bot.players) {
          let player = bot.players[name];
          if(player.entity != null && player.username != bot.username) {
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
          bot.survivalgames.attackingPlayer = null;
          bot.setControlState('sprint', false);
          bot.setControlState('jump', false);
          bot.setControlState('forward', false);
          let re = bot.navigate.findPathSync(nearestPlayer.entity.position, { timeout: 800 });
          if( re.status === 'success' ) {
            bot.survivalgames.currentPath = nearestPlayer.entity.position;
            bot.navigate.walk(re.path);
          }else{
            bot.chat(re.status);
          }
        }else if(nearestPlayer != null && nearestPlayer.entity != null){
          bot.navigate.stop();
          bot.survivalgames.dostate = 'fight';
          bot.survivalgames.attackingPlayer = nearestPlayer;
          bot.setControlState('sprint', true);
          bot.setControlState('jump', true);
          bot.setControlState('forward', true);
        }else{
          bot.survivalgames.dostate = 'none';
        }
      })();
    }

    if(['searching', 'none', 'wandering'].includes(bot.survivalgames.dostate)) {
      setTimeout(() => {
        if(bot.survivalgames.currentPath == null) {
          var blocks = bot.findBlockSync({
            point: bot.entity.position,
            matching: (block) => {
              return bot.survivalgames.options.chestBlocks.includes(block.type) || bot.survivalgames.options.chestBlocks.includes(block.type + ':' + block.metadata);
            },
            maxDistance: 64,
            count: 10,
          });
          if (blocks.length) {
            for(let block of blocks) {
              if(!bot.survivalgames.openedChests.includes(block.position)) {
                bot.survivalgames.dostate = 'searching';
                bot.survivalgames.currentPath = block.position;
                bot.lookAt(block.position);
                bot.setControlState('sprint', true);
                bot.setControlState('jump', true);
                bot.setControlState('forward', true);
                break;
              }
            }

          }
        }
      }, 100);
    }


    if(bot.survivalgames.running) {
      setTimeout(stick, 1000);
    }
  }

}
