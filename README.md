# mineflayer-sg
mineflayer plugin to play survivalgames. This project is still in its very early stages, so dont expect much functionality

## TODO's
- [x] Search for Chests
- [x] Save already opened Chests and dont open again
- [ ] Run away at the start and dont fight anyone
- [ ] Create nav algorithm for wandering about(and for running away)
- [ ] Loot Chests
- [ ] Prioritize Items
- [x] Search for Players
- [x] Fight nearby Players
- [ ] Only hit player when actually looking at him
- [ ] Fighting with Bow
- [ ] Adding knockback
- [ ] Overall better Physics Engine
- [ ] Pickup prioritized Items
- [ ] Not jumping into lava when a Player is behind it
- [ ] Upgrade mineflayer-navigate so the Bot can sprint(and jump) while navigating

## Usage
(mineflayer-navigate and mineflayer-blockfinder are needed!)
This is a plugin so you can just initialize it like any other plugin:
```js
var mineflayer = require('mineflayer');
var navigatePlugin = require('mineflayer-navigate')(mineflayer);
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
var sgPlugin = require('./index.js')(mineflayer);

var bot = mineflayer.createBot();
navigatePlugin(bot);
blockFinderPlugin(bot);
sgPlugin(bot);
```

### Example Code
```js
var mineflayer = require('mineflayer');
var navigatePlugin = require('mineflayer-navigate')(mineflayer);
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
var sgPlugin = require('./index.js')(mineflayer);

var bot = mineflayer.createBot();
navigatePlugin(bot);
blockFinderPlugin(bot);
sgPlugin(bot);

bot.on('chat', function(username, message) {
  if (username === bot.username) return;
  var target = bot.players[username].entity;
  if (message === 'start') {
    bot.survivalgames.begin({
    //  'chestBlocks': [ '168:2' ]
    });
  }else if (message === 'stop') {
    bot.survivalgames.stop();
  }
});

bot.on('death', () => {
  bot.survivalgames.stop();
});

bot.survivalgames.on('begin', () => {
  bot.chat('Started SurvivalGames!');
});

bot.survivalgames.on('stop', () => {
  bot.chat('Stopped SurvivalGames!');
});

bot.on('error', (err) => {
  console.log(err);
});
```

## Ideas

### Wandering/Running-away Navigation
Create very simple mesh map where all hills are not walkable and everything wierd details are removed and or not walkable and putting 4\*4 or 8\*8 blocks into just one "block" then just let A\* go over it.

### Knockback
Should be pretty simple...
I think the server sends a velocity packet to the client, just need to interpret it.
Not sure If mineflayer support velocity but probably just need to set it, if not I(or someone else) needs to make a plugin for that or commit it to the original mineflayer.
