const EventEmitter = require('events').EventEmitter;
const vec3 = require('vec3').Vec3;

module.exports = init;

function init(mineflayer) {
  return inject;
}

function inject(bot) {
  bot.survivalgames.fight = new EventEmitter();

  bot.survivalgames.fight.tick = tick;
  bot.survivalgames.fight.begin = begin;
  bot.survivalgames.fight.stop = stop;
  bot.survivalgames.fight.isRunning = isRunning;

  bot.survivalgames.fight.target = null;

  function isRunning() {
    return bot.survivalgames.fight.target != null && bot.survivalgames.fight.target.entity != null;
  }

  bot.survivalgames.on('stop', () => {
    stop();
  });

  function begin(_target) {
    if(!isRunning()) {
      bot.survivalgames.fight.emit('begin', _target);
      bot.survivalgames.fight.target = _target;
      bot.setControlState('sprint', true);
      bot.setControlState('jump', true);
      bot.setControlState('forward', true);
      doTicks();
    }else{
      stop();
      setTimeout(() => {
        begin(_target);
      }, 110);
    }
  }

  function stop() {
    bot.survivalgames.fight.target = null;
    bot.setControlState('sprint', false);
    bot.setControlState('jump', false);
    bot.setControlState('forward', false);
    bot.survivalgames.fight.emit('stop');
  }

  function doTicks() {
    tick().then(() => {
      if(isRunning()) {
        setTimeout(() => {
          doTicks();
        }, 100);
      }else{
        stop();
      }
    });

  }

  function tick() {
    return new Promise((resolve, reject) => {
      if(isRunning()) {
        var dist = bot.survivalgames.fight.target.entity.position.distanceTo(bot.entity.position);
        var p = bot.survivalgames.fight.target.entity.position.offset(0, 1.8, 0);
        bot.lookAt(p);
        if(dist < 10) {
          if(dist >= 3 && Math.random() > bot.survivalgames.options.missRate) {
            bot._client.write('arm_animation', {hand:0});
          }else if(dist < 3){
            bot._client.write('arm_animation', {hand:0});
          }
          if(Math.random() > bot.survivalgames.options.missRate && dist < 3) {
            bot.attack(bot.survivalgames.fight.target.entity);
          }
        }
      }
      resolve();
    });
  }

}
