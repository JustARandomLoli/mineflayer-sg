# mineflayer-sg
mineflayer-sg is a mineflayer plugin to play survivalgames. This project is still in its very early stages, so dont expect much functionality.

## Contribute
Contributions are very much welcomed!

## TODO's
- [x] Search for Chests
- [x] Save already opened Chests and dont open again
- [ ] Run away at the start and dont fight anyone
- [ ] (prob dont need this)Create more efficient nav algorithm for wandering about(and for running away) <- (maybe)
- [ ] Loot Chests
- [ ] Prioritize Items
- [ ] Sort Inventory
- [ ] Realign Inventory when something breaks or all food got aten or new Item got into Inventory
- [x] Search for Players
- [x] Fight nearby Players
- [ ] Only hit player when actually looking at him
- [ ] Fighting with Bow
- [x] Adding knockback
- [ ] Overall better Physics Engine
- [ ] Pickup prioritized Items
- [ ] Not jumping into lava when a Player is behind it
- [ ] Upgrade mineflayer-navigate so the Bot can sprint(and jump) while navigating
- [ ] Sprint/Jump Food Logic
- [ ] Break breakable blocks if they are an obsticle
- [ ] Making the code look fancy and sorted
- [ ] Make a terrain simplifyer for the navigation algorithm
- [ ] Open Doors,etc... if they are an obsticle
- [ ] Dont jump on fences and stand on open fence gates
- [ ] More natural navigation
- [ ] Logic to stay near team players
- [ ] Logic to team boost near enemy that is running away (alternativly using the rod self boosting)
- [ ] Logic for when its best to fight and when its best to run or hide or go loot
- [ ] Currently cant go through doors,etc... fix that
- [ ] Press Buttons and Levers to open doors

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
