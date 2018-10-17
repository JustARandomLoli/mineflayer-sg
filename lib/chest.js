const EventEmitter = require('events').EventEmitter;
const vec3 = require('vec3').Vec3;

module.exports = init;

function init(mineflayer) {
  return inject;
}

function inject(bot) {
  bot.survivalgames.chest = new EventEmitter();

  bot.survivalgames.chest.search = search;

  bot.survivalgames.chest.opened = [];

  bot.on('windowOpen', (window) => {
    bot.navigate.stop();
    bot.survivalgames.dostate = 'inventory';
    console.log('opened inv ' + window.title);
    //console.log(window);
    new Promise(async(resolve, reject) => {
      for(let item of window.slots) {
        if(item != null) {
          bot.clickWindow(item.slot, 1, 0);
          //await wait(200);
          //bot.clickWindow(window.inventorySlotStart + , 1, 0);
          await wait(500);
        }
      }
      await wait(1000);
      bot.closeWindow(window);
    });

  });

  bot.on('windowClose', (window) => {
    bot.survivalgames.dostate = 'none';
  });

  function search() {
    return new Promise((resolve, reject) => {
      var blocks = bot.findBlockSync({
        point: bot.entity.position,
        matching: (block) => {
          return bot.survivalgames.options.chestBlocks.includes(block.type) || bot.survivalgames.options.chestBlocks.includes(block.type + ':' + block.metadata);
        },
        maxDistance: 32,
        count: 10,
      });
      if (blocks.length) {
        for(let block of blocks) {
          if(!bot.survivalgames.chest.opened.includes(block.position.toString())) {
            let re = bot.navigate.findPathSync(block.position, { timeout: 300 });
            if(re.path.length < 1 || (re.path.length == 1 && bot.entity.position.distanceTo(re.path[0]) < 2) || bot.entity.position.distanceTo(block.position) < 4) {
              bot.survivalgames.chest.opened.push(block.position.toString());
              if(bot.entity.position.distanceTo(block.position) < 4) {
                bot.activateBlock(block);
                resolve(true);
                return;
              }
            }else{
              bot.navigate.walk(re.path);
              resolve(true);
              return;
            }
            break;
          }
        }
      }
      resolve(false);
    });
  }

}

function wait(millis) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, millis);
  });
}
