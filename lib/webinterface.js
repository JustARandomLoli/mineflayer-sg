const EventEmitter = require('events').EventEmitter;
const vec3 = require('vec3').Vec3;
const socketio = require('socket.io');

module.exports = init;

function init(mineflayer) {
  return inject;
}

function inject(bot) {

  bot.webinterface = new EventEmitter();
  bot.webinterface.start = start;

  bot.webinterface.io;

  function start(port) {
    bot.webinterface.io = socketio(port);
    var io = bot.webinterface.io;

    io.on('connection', (socket) => {
      socket.on('start', () => {
        bot.survivalgames.begin();
      });
      socket.on('stop', () => {
        bot.survivalgames.stop();
      });
    });


    setTimeout(tick, 10);
  }

  function tick() {

    bot.webinterface.io.emit('dostate', bot.survivalgames.dostate);
    bot.webinterface.io.emit('openedChests', bot.survivalgames.chest.opened);

    setTimeout(tick, 100);
  }

}
