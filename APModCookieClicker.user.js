// ==UserScript==
// @name         AP_CookieClicker
// @version      2026-06-21
// @description  Archipelago client for Cookie Clicker
// @author       SX, Charlignon
// @homepageURL  https://github.com/Charlignon/AP_CookieClicker
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @grant        none
// @top-level-await
// ==/UserScript==

const {Client, itemsHandlingFlags} = await import(
  // Switched to a fork because main repo has a bug on hint ordering
  "https://unpkg.com/@airbreather/archipelago.js@2.0.5-airbreather"
  );
//'use strict';

// TODO
// Error Handling on Connection
// Logic for Achievements
// Configs for Shimmer
// Put all the agnostic stuff into a big object and export it as a lib

let nameOfSlot = ""
console.log("AP CookieClicker loaded");

//this started as Cookieclicker, but should work as a template for all browser games
//therefore code is split into Archipelago stuff, and Game specific Stuff
//so you just need to change Game Specific stuff

//ToastLibary, for Announcements
/* Not used in CC
const cssToast = document.createElement("link");
cssToast.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
cssToast.type = "text/css";
cssToast.rel = "stylesheet";
document.head.append(cssToast);
*/

const scriptToast = document.createElement("script");
scriptToast.src = "https://cdn.jsdelivr.net/npm/toastify-js";
scriptToast.type = "text/javascript";
document.head.append(scriptToast);

/* Usage
    Toastify({
        text: "This is a toast",
        duration: 3000
    }).showToast();
*/

Game.APReset = () => {
  console.log("=== GAME RESET ===");
  Game.HardReset(2);
  receivedItems = [];
  localStorage.setItem('receivedItems', "[]")
}

// To override
Game.__APResendChecks = () => {
  console.log("=== DEBUG: RESEND ALL CHECKS (please override this function) ===");
  alert("Please connect to an archipelago game.");
}
Game.__APGoalVerify = () => {
  console.log("=== DEBUG: VERIFY GOAL (please override this function) ===");
  alert("Please connect to an archipelago game.");
}

// Input fields
const apMenuContainer = document.createElement("div");
apMenuContainer.id = "apMenu";

apMenuContainer.innerHTML = `
   <div id="apMenuArrow"> < </div>
   <form id="apConnectionForm">
    <fieldset id="apConnectionFields">
      <legend>Connect to your AP server</legend>
      <input name="hostname" placeholder="Address"/>
      <input name="port" placeholder="Port (38281 for local games)"/>
      <input name="slot" placeholder="Slot Name"/>
      <input name="password" placeholder="Password" type="password"/>
      <button type="submit">Connect</button>
      <br/>
      <span id="apFormError" class="APhide"></span>
    </fieldset>
  </form>
  <form id="apHintForm">
    <fieldset id="apHintFields" disabled>
      <input name="item" placeholder="Item name" list="itemList">
      <datalist id="itemList">/* populated after connection */</datalist>
      <input type="submit" value="Hint this!">
    </fieldset>
  </form>
`;


const formStyle = `
  #apMenu {
    margin: 0;
    padding: 15px;
    position: absolute;
    top: 30%;
    left: 0;
    z-index: 99999;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    width: 20%;
    background-color: black;
    box-sizing: border-box;
    transition: 0.5s;

    &.isClosed {
      left: -20%;
    }
  }
  #apFormError {
    color: red;
    font-weight: bold;
  }
  #apMenuArrow {
    position: absolute;
    right: -20px;
    background-color: black;
    padding: 10px;
    border-radius: 10px;
  }
`;

const consoleInput = document.createElement("input")
consoleInput.id = "apCommandInput"
consoleInput.placeholder = "!command"
consoleInput.disabled = true;

// Console
consoleInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    window.client.messages.say(consoleInput.value);
    consoleInput.value = "";
  }
});
apMenuContainer.append(consoleInput);

// Settings panel
let apClientSettings = { // init for code completion <3
  splitNotifications: '',
  hideHints: '',
  hideConnection: '',
  hideOtherItems: '',
}
apClientSettings = JSON.parse(localStorage.apClientSettings || "{}");
let onApClientSettingUpdate = setting => {};

const settingsPanel = document.createElement("div");
settingsPanel.id = "apSettingsPanel";

settingsPanel.innerHTML = `
<details><summary>AP client settings</summary>
  <fieldset><legend>Notification filters</legend>
    <label><input type="checkbox" name="splitNotifications" ${apClientSettings.splitNotifications ? "checked" : ""} />Use 2 columns</label>
    <label><input type="checkbox" name="hideHints" ${apClientSettings.hideHints ? "checked" : ""} />Hide hints</label>
    <label><input type="checkbox" name="hideConnection" ${apClientSettings.hideConnection ? "checked" : ""} />Hide players joining and leaving</label>
    <label><input type="checkbox" name="hideOtherItems" ${apClientSettings.hideOtherItems ? "checked" : ""} />Hide checks for other games</label>
  </fieldset>
  <br/>
  <button onclick="Game.__APGoalVerify()">GOAL VERIFY</button>
  <button onclick="if(confirm('This will force resend ALL your checks to the server. Continue?')===true) {Game.__APResendChecks()}">RESEND CHECKS</button>
  <button class="apDanger" onclick="if(confirm('This will reset your CC save and received AP items. Continue?')===true) {Game.APReset()}">RESET SAVE</button>
</details>
`
const settingsStyle = `
  #apSettingsPanel { 
    & label {
      display: block;
    }
    & summary {
      margin-bottom: 10px;
    }
  }
  .apDanger {
    background-color: lightcoral;
  }
`;

settingsPanel.querySelectorAll('input').forEach(input => input.addEventListener("change", e => {
  apClientSettings[e.target.name] = e.target.checked;
  onApClientSettingUpdate(e.target.name)
  localStorage.apClientSettings = JSON.stringify(apClientSettings);
}));

apMenuContainer.append(settingsPanel);

document.body.prepend(apMenuContainer);


// Injecting AP client style
//#apUpgrades:before adds styling to the AP Shop
const style = document.createElement("style");
style.textContent = `
  .hinted { opacity: 1 !important }
  .APhide { display: none !important }
` + formStyle + settingsStyle;
document.head.append(style);




function typeToText(element) {
  const id = Number(element.text);

  if (element.type === "player_id" && !isNaN(id)) {
    return window.client.players.findPlayer(parseInt(element.text, 10))?.alias;
  } else if (element.type === "item_id" && !isNaN(id)) {
    return window.client.package.lookupItemName(
      window.client.players.findPlayer(element.player)?.game ?? "",
      parseInt(element.text, 10),
    );
  } else if (element.type === "location_id" && !isNaN(id)) {
    return window.client.package.lookupLocationName(
      window.client.players.findPlayer(element.player)?.game ?? "",
      parseInt(element.text, 10),
    );
  } else if (element.text !== undefined) {
    return element.text;
  } else {
    return element;
  }
}

function packetToText(packet) {
  if (packet === undefined) {
    return "";
  }
  let msg = "";
  packet.forEach((element) => {
    msg += typeToText(element);
  });
  return msg;
}

function sendCheckIdToAp(id) {
  window.client.check(id);
  // Essential to avoid discrepancies between AP server state and CC local save
  // We could do a full check after each game load to sync both, with forced Game.Win/Game.RemoveAchiev
  Game.WriteSave();
}

function connectAP(e) {
  e.preventDefault();
  console.debug("CONNECTION ATTEMPT", e);
  window.client = new Client();

  const fields = document.getElementById("apConnectionFields");
  const apFormError = document.getElementById("apFormError");
  fields.disabled = true;
  apFormError.classList.add("APhide");

  const handleError = error => {
      console.error("Error during connection attempt: ", error.toString())
      document.getElementById("apConnectionFields").disabled = true;
      apFormError.textContent = error.toString();
      apFormError.classList.remove("APhide");
      fields.disabled = false;
  };

  const { hostname, port, slot, password } = e.target;
  if (!hostname.value || !port.value || !slot.value) {
    handleError("Address, Port and Slot Name should not be empty!");
    return;
  }

  if (parseInt(port.value) !== parseInt(localStorage.getItem("port"))) {
    if (
      confirm(
        "Your Port changed, so this might be a new Game. DELETE LOCAL SAVE GAME?\nCancel to load your save normally.",
      ) === true
    ) {
      Game.APReset();
    }
  }

  let self = this;
  const connectionInfo = {
    password: password.value,
    items_handling: itemsHandlingFlags.all,
  };
  const url = hostname.value + ":" + port.value;

  // If connected
  window.client.socket.disconnect();

  // Set up event listeners
  window.client.socket.on("connected", async (packet) => {
    console.log("Connected to server: ", packet);
    await appendFunctions();
    save();
  });

  window.client.socket.on("roomUpdate", (packet) => {
    console.log("Room update: ", packet);
  });

  window.client.socket.on("receivedItems", async (packet) => {
    while (!Game.ApReady) {
      console.debug("Game data not ready... delaying item receiving")
      await new Promise(res => setTimeout(res, 100));
    }
    console.log("Received Items: ", packet);

    // When items.length > 1 its an reconnect
    if (packet.items.length > 1) {
      const difference = [];

      const receiveNewItem = networkItem => {
          receiveItem(networkItem.item, true);
          toast(null, {
            receiving: window.client.players.self.slot,
            item: networkItem,
            type: "ItemSend"
          })
          difference.push(networkItem.item);
      }

      const receivedItemsById = Object.groupBy(receivedItems || [], x => x);
      const networkItemsById = Object.groupBy(packet.items, x => x.item);
      for (let id in networkItemsById) {
        if (!receivedItemsById[id]) {
          // New item
          networkItemsById[id].forEach(i => receiveNewItem(i, true));
        } else if (receivedItemsById[id].length < networkItemsById[id].length) {
          // Further occurrences of fillers, progressive... any item that can appear multiple times.
          // FIXME regression: fillers obtained while away are not skipped anymore
          const missing = networkItemsById[id].length - receivedItemsById[id].length;
          for (let i = 0; i<receivedItemsById[id].length; i++) receiveItem(id, false);
          for (let i = 0; i<missing; i++) receiveNewItem(networkItemsById[id][0]);
        } else {
          networkItemsById[id].forEach(i => receiveItem(id, false));
        }
      }

      // Compare serverItems with local saved (and executed Items)
      console.log("serverItems", packet.items.map(x => x.item));
      console.log("receivedItems", receivedItems);
      console.log("difference", difference);
    } else {
      // Just one Item means its new > always use
      receiveItem(packet.items[0].item, true);
    }
  });

  window.client.socket.on("locationInfo", (packet) => {
    console.log("Hint: ", packet);
    //self.hints.concat(packet.items);
  });

  window.client.socket.on("printJSON", (packet) => {
    console.debug("Print JSON: ", packet);
    let msg = packetToText(packet.data);
    if (msg === "") {
      return;
    }
    console.log("MSG: " + msg);
    toast(msg, packet);
  });

  // Connect to the Archipelago server
  window.client
    .login(url, slot.value, gameName, connectionInfo)
    .then(() => {
      console.log("Connected to the server");
      document.getElementById("apHintFields").disabled = false;
      consoleInput.disabled = false;
      const itemList = document.getElementById("itemList");
      Object.keys(window.client.package.findPackage(gameName).itemTable).forEach(item => itemList.innerHTML +=`<option value="${item}">`);
    })
    .catch(handleError);

  // Disconnect from the server when unloading window
  window.addEventListener("beforeunload", () => {
    window.client.socket.disconnect();
  });
}

const hintItem = e => {
  e.preventDefault();
  window.client.messages.say("!hint " + e.target.item.value)
    .then(() => e.target.item.value = "");
}

const toggleMenu = () => {
  apMenuContainer.classList.toggle("isClosed");
  document.getElementById("apMenuArrow").textContent = apMenuContainer.classList.contains("isClosed") ? ">" : "<";
}

document.getElementById("apConnectionForm").addEventListener("submit", connectAP);
document.getElementById("apHintForm").addEventListener("submit", hintItem);
document.getElementById("apMenuArrow").addEventListener("click", toggleMenu);

//forDev
// hostname.value = "archipelago.gg";
//port.value = "51981";
//name.value = "Alex_CC";

/*                                   */
/*                                   */
/* GAME SPECIFIC FUNCTIONS DOWN HERE */
/*                                   */
/*                                   */

const CCStyleOverrides = document.createElement("style");
CCStyleOverrides.textContent = `
  .product { display: block !important }
  .product.toggledOff { opacity: 0.6 } /* Ugly magic number from CC code */
  .product[data-aphide="1"] { display: none !important; }
  #notes:has(+ #apNotes.split) { left: calc(50% - 142px) }
  #notes:has(+ #apNotes.split)>.sidenote { right: unset; left: -40px; }
  #apNotes { display: none }
  #apNotes.split {
    display: unset;
    left: calc(50% + 142px);
    position: absolute;
    margin-left: -125px;
    bottom: 0px;
    z-index: 100000001;
  }
  .note {
    display: flex;
    gap:8px;
    align-items: center;
    & .icon {
      min-width: 48px;
      min-heigth: 48px;
      margin:0;
    }
  }
  .note:has(.itemSend) {
    flex-direction: row-reverse;
    text-align: right;
  }
`;
document.head.append(CCStyleOverrides);

const gameName = "Cookie Clicker";
let goalAchievementCount = 1000; // Default value prevent accidental goaling
let receivedItems = [];
let locationsByDisplayOrder = [];
// Fields should be the same as Options.py
const gameOptions = {
  advancement_goal: 1000,
  traps_percentage: 0,
  enable_hints: false,
  shop_tooltip_detail: -1,
  production_multiplier: 0,
  lump_multiplier: 0,
  enable_progressive_buildings: false,
};

// FIXME: form fields should be stored in a APGame object or something but too much refacto for one commit. quick compat fix and will do at later time
const { hostname, port, slot: name, password } = document.getElementById("apConnectionForm");

/* On Site Loaded */
// Disable CookieClicker
document.getElementById("wrapper").style.visibility = "hidden";

function save() {
  localStorage.setItem("receivedItems", JSON.stringify(receivedItems));
  localStorage.setItem("host", hostname.value);
  localStorage.setItem("port", port.value);
  if (port.value === "") localStorage.setItem("port", "38281"); //Handle blank port -> default port
  localStorage.setItem("name", name.value);
  localStorage.setItem("password", password.value);
}

function load() {
  receivedItems = JSON.parse(localStorage.getItem("receivedItems")) || [];

  let urlParams = new URLSearchParams(window.location.search);
  hostname.value =
    urlParams.get("host") ||
    urlParams.get("Host") ||
    localStorage.getItem("host") ||
    hostname.value ||
    "archipelago.gg";
  port.value =
    urlParams.get("port") ||
    urlParams.get("Port") ||
    localStorage.getItem("port") ||
    port.value ||
    "";
  name.value =
    urlParams.get("name") ||
    urlParams.get("Name") ||
    localStorage.getItem("name") ||
    name.value ||
    "";
  password.value =
    urlParams.get("password") ||
    urlParams.get("Password") ||
    localStorage.getItem("password") ||
    password.value ||
    "";
}

load();


/*** SECOND NOTE ROLLER ***/
class APNotes {
  constructor() {
    const apNotes = document.createElement("div");
    apNotes.id = "apNotes"
    document.getElementById("notes").insertAdjacentElement("afterend", apNotes)

    Game.APNotes = [];
    Game.APNotesById = [];
    Game.apNoteId = 0;
    Game.apNoteL = l('apNotes');
    Game.APNote = function (title, desc, pic, quick) {
      this.title = title;
      this.desc = desc || '';
      this.pic = pic || '';
      this.id = Game.apNoteId;
      this.date = Date.now();
      this.quick = quick || 0;
      this.life = (this.quick || 1) * Game.fps;
      this.l = 0;
      this.height = 0;
      this.tooltip = 0;
      Game.apNoteId++;
      Game.APNotesById[this.id] = this;
      Game.APNotes.unshift(this);
      if (Game.APNotes.length > 100) Game.APNotes.pop();
      //Game.APNotes.push(this);
      //if (Game.APNotes.length>50) Game.APNotes.shift();
      Game.UpdateAPNotes();
    }
    Game.CloseAPNote = function (id) {
      var me = Game.APNotesById[id];
      if (Game.tooltip.from && Game.tooltip.from.id.indexOf('apnote-') == 0) Game.tooltip.hide();
      Game.setOnCrate(0);
      Game.APNotes.splice(Game.APNotes.indexOf(me), 1);
      //Game.APNotesById.splice(Game.APNotesById.indexOf(me),1);
      Game.APNotesById[id] = null;
      Game.UpdateAPNotes();
    }
    Game.CloseAPNotes = function () {
      Game.setOnCrate(0);
      Game.APNotes = [];
      Game.APNotesById = [];
      Game.tooltip.hide();
      Game.UpdateAPNotes();
    }
    Game.UpdateAPNotes = function () {
      var str = '';
      var remaining = Game.APNotes.length;
      for (var i in Game.APNotes) {
        if (i < 5) {
          var me = Game.APNotes[i];
          var pic = '';
          if (me.pic != '') pic = '<div class="icon" style="' + writeIcon(me.pic) + '"></div>';
          str = '<div id="apnote-' + me.id + '" ' + (me.tooltip ? Game.getDynamicTooltip(me.tooltip, 'this', true) + ' ' : '') + 'class="framed note ' + (me.pic != '' ? 'haspic' : 'nopic') + ' ' + (me.desc != '' ? 'hasdesc' : 'nodesc') + '"><div class="close" onclick="PlaySound(\'snd/tick.mp3\');Game.CloseAPNote(' + me.id + ');">x</div>' + pic + '<div class="text"><h3>' + me.title + '</h3>' + (me.desc != '' ? '<div class="line"></div><h5>' + me.desc + '</h5>' : '') + '</div></div>' + str;
          remaining--;
        }
      }
      if (remaining > 0) str = '<div class="remaining">' + loc("+%1 more notification.", LBeautify(remaining)) + '</div>' + str;
      if (Game.APNotes.length > 1) {
        str += '<div class="framed close sidenote" onclick="PlaySound(\'snd/tick.mp3\');Game.CloseAPNotes();">x</div>';
      }
      Game.apNoteL.innerHTML = str;
      for (var i in Game.APNotes) {
        me.l = 0;
        if (i < 5) {
          var me = Game.APNotes[i];
          me.l = l('apnote-' + me.id);
        }
      }
    }
    Game.APNotesLogic = function () {
      for (var i in Game.APNotes) {
        if (Game.APNotes[i].quick > 0) {
          var me = Game.APNotes[i];
          me.life--;
          if (me.life <= 0) Game.CloseAPNote(me.id);
        }
      }
    }
    Game.APNotesDraw = function () {
      for (var i in Game.APNotes) {
        if (Game.APNotes[i].quick > 0) {
          var me = Game.APNotes[i];
          if (me.l) {
            if (me.life < 10) {
              me.l.style.opacity = (me.life / 10);
            }
          }
        }
      }
    }

    this.disable();
    if(apClientSettings.splitNotifications) this.enable();
  }

  APNotify = function (title, desc, pic, quick, noLog) {
    if (Game.prefs.notifs) {
      quick = Math.min(6, quick);
      if (!quick) quick = 6;
    }
    desc = replaceAll('==CLOSETHIS()==', 'Game.CloseNote(' + Game.apNoteId + ');', desc);
    if (Game.popups) new Game.APNote(title, desc, pic, quick);
    if (!noLog) Game.AddToLog('<b>' + title + '</b> | ' + desc);
  }
  APNotifyTooltip = function (content) {
    //attaches a tooltip to the last spawned note
    if (!Game.APNotesById[Game.apNoteId - 1]) return false;
    var me = Game.APNotesById[Game.apNoteId - 1];
    me.tooltip = content;
    Game.UpdateAPNotes();
  }

  enable = () => {
    Game.APNotify = this.APNotify;
    Game.APNotifyTooltip = this.APNotifyTooltip;
    Game.apNoteL?.classList.add("split");
    Game.noteL?.classList.add("split");
  }
  disable = () => {
    Game.APNotify = Game.Notify;
    Game.APNotifyTooltip = Game.NotifyTooltip;
    Game.apNoteL?.classList.remove("split");
    Game.noteL?.classList.remove("split");
  }
}
let apNotes;

onApClientSettingUpdate = setting => {
  console.debug(`Setting "${setting}" changed to ${apClientSettings[setting]}`);
  if (setting === "splitNotifications") {
    apClientSettings.splitNotifications ? apNotes?.enable() : apNotes?.disable();
  }
}


// For this game we use the Games Chat, not the default Toast
function toast(message, {receiving, item, type} = {}) {

  if (type === "error") {
    Game.APNotify("Error", message, [1, 7]); // "!" icon
    return;
  }

  const me = window.client.players.self;

  if (receiving === me.slot) {
    if (type === "ItemSend") {
      const sender = window.client.players.findPlayer(item.player);
      const senderName = sender.slot === window.client.players.self.slot ? "You" : sender.alias;
      const locationName = window.client.package.lookupLocationName(sender.game, item.location);

      let id;
      let name;
      let icon;
      if (OFFSET.ITEMS.isBuilding(item.item)) {
        id = item.item - OFFSET.ITEMS.BUILDINGS;
        name = Game.ObjectsById[id].name;
        icon = [Game.ObjectsById[id].iconColumn, 27];
      } else if (OFFSET.ITEMS.isProgressive(item.item)) {
        const receivedCount = Object.groupBy(receivedItems, x => x)[item.item]?.length || 0;
        const current= [
          "Heavenly chip secret",
          "Heavenly cookie stand",
          "Heavenly bakery",
          "Heavenly confectionery",
          "Heavenly key"
        ][receivedCount];
        const upgrade = Game.Upgrades[current];
        id = upgrade?.id;
        name = window.client.package.lookupItemName(gameName, item.item);
        icon = upgrade?.icon;
      } else if (OFFSET.ITEMS.isUpgrade(item.item)) {
        const upgrade = Game.UpgradesById[item.item - OFFSET.ITEMS.UPGRADES - 1];
        id = upgrade.id;
        name = upgrade.name;
        icon = upgrade.icon;
      } else if (OFFSET.ITEMS.isFiller(item.item)) {
        name = window.client.package.lookupItemName(gameName, item.item);
        icon = [18,10];
      } else if (OFFSET.ITEMS.isTrap(item.item)) {
        name = window.client.package.lookupItemName(gameName, item.item);
        icon = [12,8];
      } else {
        message && Game.Notify("Archipelago", message);
        return;
      }

      Game.Notify("Item received", `<span class="itemSend">${senderName} just found your <b>${name}</b> at ${locationName} !</span>`, icon);
      OFFSET.ITEMS.isUpgrade(item.item) && Game.NotifyTooltip("function(){return Game.crateTooltip(Game.UpgradesById[" + id + "]);}");
      return;
    }
  }
  if (type === "Hint") {
    const icon = [0, 8]; // Question marks
    const receiver = window.client.players.findPlayer(receiving);
    const sender = window.client.players.findPlayer(item.player);
    const itemName = window.client.package.lookupItemName(receiver.game, item.item);
    const locationName = window.client.package.lookupLocationName(sender.game, item.location);

    if (apClientSettings.hideHints) {
      console.debug("Skipped hint notification (user settings)");
      return;
    }

    Game.APNotify("Hint", `${receiver.alias}'s <b>${itemName}</b> is located at <b>${locationName}</b> in ${sender.alias}'s world</div>`, icon);
    item.player === window.client.players.self.slot
      && Game.APNotifyTooltip('function(){return Game.crateTooltip(Game.AchievementsById['+(item.location-OFFSET.ACHIEVEMENTS)+']);}');
    return;
  }

  if (apClientSettings.hideOtherItems && type === "ItemSend" && item.player !== me.slot) {
      console.debug("Skipped check notification (user settings)");
      return;
  }
  if (apClientSettings.hideConnection && (type === "Join" || type === "Part")) {
      console.debug("Skipped join/leave notification (user settings)");
      return;
  }

  Game.APNotify("Archipelago", message);
  if (type === "ItemSend" && item.player === me.slot) Game.APNotifyTooltip("function(){return Game.crateTooltip(Game.AchievementsById[" + (item.location - OFFSET.ACHIEVEMENTS) + "]);}");

  /*
  Toastify({
      text: message,
      duration: 5000
    }).showToast();
  */
}

const OFFSET = {
  ITEMS: {
    BUILDINGS: 10000000,
    UPGRADES: 20000000,
    PROGRESSIVE: 21000000,
    FILLERS: 50000000,
    TRAPS: 60000000,
    isBuilding: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.BUILDINGS,
    isUpgrade: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.UPGRADES,
    isProgressive: id => Math.floor(id / 1000000) * 1000000 === OFFSET.ITEMS.PROGRESSIVE,
    isFiller: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.FILLERS,
    isTrap: id => Math.floor(id / 10000000) * 10000000 === OFFSET.ITEMS.TRAPS,
  },
  ACHIEVEMENTS: 42069001
}

function receiveItem(itemId, firstTime) {
  itemId = parseInt(itemId);

  function receiveUpgrade(upgrade) {
    let u = upgrade || Game.UpgradesById[itemId - OFFSET.ITEMS.UPGRADES - 1];
    u.unlocked = 1;
    u.basePrice = -1;
    if (u.buy?.() !== 1) {
      // If there is no buy function, set it to bought manually
      u.bought = 1;
    }
  }

  if (firstTime) {
    receivedItems.push(itemId);
    console.log(`I apply a new item! ${itemId}`);
  }

  save();

  if (OFFSET.ITEMS.isFiller(itemId) && firstTime) {
    switch (itemId) {
      case OFFSET.ITEMS.FILLERS + 0 :
        Game.Earn(Game.cookies * 2 - Game.cookies);
        console.log("*2 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 1 :
        Game.Earn(Game.cookies * 999 - Game.cookies);
        console.log("*999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 2 :
        Game.Earn(Game.cookies * 9999 - Game.cookies);
        console.log("*9999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 3 :
        Game.Earn(Game.cookies * 9999999 - Game.cookies);
        console.log("*9999999 Cookies");
        break;
      // No + 4, this legacy filler has been removed
      case OFFSET.ITEMS.FILLERS + 5 :
        Game.Earn(Game.cookies * 10 - Game.cookies);
        console.log("*10 Cookies");
        break;
    }
  }

  if (OFFSET.ITEMS.isBuilding(itemId)) {
    let progressiveBuildingsEnabled = gameOptions.enable_progressive_buildings;

    /* If progressive buildings is enabled, then each additional copy unlocks a new tier (capped to tier 3)
     *    Note: 3 is an ugly magic number because at the moment ALL progressive buildings have *exactly* 3 tiers
     * If no progressive buildings, then any additional copy will just re-unlock the building (ie do nothing)
     */
    const receivedCount = progressiveBuildingsEnabled
      ? Math.min(Object.groupBy(receivedItems, x => x)[itemId]?.length || 0, 3)
      : 1;

    switch (itemId) {
      case OFFSET.ITEMS.BUILDINGS + 0 : // Unlock Cursor
        [
          () => document.getElementById("product0").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Thousand fingers"]),
          () => receiveUpgrade(Game.Upgrades["Starter kit"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 1 : // Unlock Grandma (just in case)
        document.getElementById("product1").dataset.aphide = "";
        console.warn("I guess we are unlocking grandma's again, someone might want to check that out");
        break;
      case OFFSET.ITEMS.BUILDINGS + 2 : // Unlock Farm
        [
          () => document.getElementById("product2").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Future almanacs"]),
          () => receiveUpgrade(Game.Upgrades["Rain prayer"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 3 : // Unlock Mine
        [
          () => document.getElementById("product3").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Seismic magic"]),
          () => receiveUpgrade(Game.Upgrades["Asteroid mining"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 4 : // Unlock Factory
        [
          () => document.getElementById("product4").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Quantum electronics"]),
          () => receiveUpgrade(Game.Upgrades["Temporal overclocking"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 5 : // Unlock Bank
        [
          () => document.getElementById("product5").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Contracts from beyond"]),
          () => receiveUpgrade(Game.Upgrades["Printing presses"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 6 : // Unlock Temple
        [
          () => document.getElementById("product6").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Paganism"]),
          () => receiveUpgrade(Game.Upgrades["God particle"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 7 : // Unlock Wizard Tower
        [
          () => document.getElementById("product7").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Arcane knowledge"]),
          () => receiveUpgrade(Game.Upgrades["Magical botany"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 8 : // Unlock Shipment
        [
          () => document.getElementById("product8").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Fossil fuels"]),
          () => receiveUpgrade(Game.Upgrades["Shipyards"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 9 : // Unlock Alchemy Lab
        [
          () => document.getElementById("product9").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Primordial ores"]),
          () => receiveUpgrade(Game.Upgrades["Gold fund"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 10 : // Unlock Portal
        [
          () => document.getElementById("product10").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Infernal crops"]),
          () => receiveUpgrade(Game.Upgrades["Abysmal glimmer"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 11 : // Unlock Time Machine
        [
          () => document.getElementById("product11").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Relativistic parsec-skipping"]),
          () => receiveUpgrade(Game.Upgrades["Primeval glow"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 12 : // Unlock Antimatter Condenser
        [
          () => document.getElementById("product12").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Extra physics funding"]),
          () => receiveUpgrade(Game.Upgrades["Chemical proficiency"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 13 : // Unlock Prism
        [
          () => document.getElementById("product13").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Light magic"]),
          () => receiveUpgrade(Game.Upgrades["Mystical energies"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 14 : // Unlock Chancemaker
        [
          () => document.getElementById("product14").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Gemmed talismans"]),
          () => receiveUpgrade(Game.Upgrades["Charm quarks"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 15 : // Unlock Fractal Engine
        [
          () => document.getElementById("product15").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Recursive mirrors"]),
          () => receiveUpgrade(Game.Upgrades["Mice clicking mice"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 16 : // Unlock Javascript Console
        [
          () => document.getElementById("product16").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Script grannies"]),
          () => receiveUpgrade(Game.Upgrades["Tombola computing"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 17 : // Unlock Idleverse
        [
          () => document.getElementById("product17").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Perforated mille-feuille cosmos"]),
          () => receiveUpgrade(Game.Upgrades["Infraverses and superverses"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 18 : // Unlock Cortex Baker
        [
          () => document.getElementById("product18").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Thoughts & prayers"]),
          () => receiveUpgrade(Game.Upgrades["Fertile minds"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
      case OFFSET.ITEMS.BUILDINGS + 19 : // Unlock You
        [
          () => document.getElementById("product19").dataset.aphide = "",
          () => receiveUpgrade(Game.Upgrades["Accelerated development"]),
          () => receiveUpgrade(Game.Upgrades["Peer review"])
        ].slice(0, receivedCount).forEach(callback => callback());
        break;
    }
  }

  if (OFFSET.ITEMS.isUpgrade(itemId)) {
    if (OFFSET.ITEMS.isProgressive(itemId)) {
      const receivedCount = Object.groupBy(receivedItems, x => x)[itemId]?.length || 0;
      switch (itemId) {
        case OFFSET.ITEMS.PROGRESSIVE + 0 : // Heavenly upgrades
          [
            "Heavenly chip secret",
            "Heavenly cookie stand",
            "Heavenly bakery",
            "Heavenly confectionery",
            "Heavenly key"
          ].slice(0, receivedCount).forEach(up => receiveUpgrade(Game.Upgrades[up]));
      }
    } else {
      receiveUpgrade();
    }
  }
  if (OFFSET.ITEMS.isTrap(itemId) && firstTime) {
    const buildings = Game.ObjectsById.filter(a => a.amount);
    let building = buildings[Math.floor(Math.random() * buildings.length)];

    switch (itemId) {
      case OFFSET.ITEMS.TRAPS + 0 :
        building.amount = Math.max(building.amount - 1, 0);
        Game.Notify("Archipelago", "-1 " + building.name);
        console.log("-1 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 1 :
        building.amount = Math.max(building.amount - 10, 0);
        Game.Notify("Archipelago", "-10 " + building.name);
        console.log("-10 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 2 :
        building.amount = Math.max(building.amount - 100, 0);
        Game.Notify("Archipelago", "-100 " + building.name);
        console.log("-100 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 3 :
        Game.cookies *= 0.9;
        console.log("-10% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 4 :
        Game.cookies *= 0.8;
        console.log("-20% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 5 :
        Game.cookies *= 0.7;
        console.log("-30% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 6 :
        Game.cookies *= 0.6;
        console.log("-40% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 7 :
        Game.cookies *= 0.5;
        console.log("-50% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 8 :
        Game.cookies *= 0.4;
        console.log("-60% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 9 :
        Game.cookies *= 0.3;
        console.log("-70% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 10 :
        Game.cookies *= 0.2;
        console.log("-80% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 11 :
        Game.cookies *= 0.1;
        console.log("-90% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 12 :
        Game.cookies = 0;
        console.log("-100% Cookies");
        break;
    }
  }
}

function loadAchieveNum() {
  // Game.AchievementsOwned does not include shadow achievements
  return Object.values(Game.Achievements).filter(achv => achv.won).length;
}

function debounceAndMergeInputs(func, delay) {
  let timeout;
  let allArgs = []
  return function (...args) {
    allArgs.push(...args);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, allArgs);
      allArgs = [];
    }, delay);
  };
}

/*
 When buying buildings by 100, many consecutive achievements are unlocked at once
 To prevent hinting locations that are unlocked right after, we apply a debounce and batch the request
*/
const scoutLocations = debounceAndMergeInputs((...locations) => {
  console.log("Scouting locations ", locations);
  window.client.scout(locations.filter(me => !me.won).map(me => me.id + OFFSET.ACHIEVEMENTS), 2)
}, 3000); // 500 deemed not enough by testers

// Reveal item locked behind adjacent achievements when completing one
function hintAdjacentLocations(it) {
  const aaa = locationsByDisplayOrder.findIndex(loc => loc.name === it.name)
  const prev = locationsByDisplayOrder[aaa - 1]
  const next = locationsByDisplayOrder[aaa + 1]
  if (!!prev && !prev.won) { scoutLocations(prev) }
  if (!!next && !next.won) { scoutLocations(next) }
}

// Append functions which need to be set or overwritten after Connection during Runtime
async function appendFunctions() {
  //enable CookieClicker
  document.getElementById("wrapper").style.visibility = "visible";

  function fixedHardcore() {
	  hasCookieUpgrade = Game.UpgradesByPool["cookie"].some(me => me.bought);
	if (Game.cookiesEarned>=1000000000000000 && !hasCookieUpgrade && (Game.ascensionMode==1 || Game.resets==0)) Game.Win('Hardcore');
}

//add hardcore logic
Game.registerHook('logic', fixedHardcore);

Game.Achievements['Hardcore'].ddesc = 'Get to <b>1 quadrillion cookies</b> baked with <b>no cookie upgrades purchased</b>.';

  apNotes = new APNotes();

  // Override debug functions
  Game.__APResendChecks = () => {
    console.log("=== DEBUG: RESEND ALL CHECKS ===");
    Object.values(Game.Achievements).forEach(achv => achv.won && sendCheckIdToAp(achv.id + OFFSET.ACHIEVEMENTS));
  }

  Game.__APGoalVerify = () => {
    console.log("=== DEBUG: GOAL VERIFY ===");
    alert(`You have completed ${loadAchieveNum()} achievements out of your ${goalAchievementCount} goal (${Math.floor(loadAchieveNum() / goalAchievementCount * 1000)/10}%).`);
  }

  //lock all Stores
  document.getElementById("product0").dataset["aphide"] = "1";
  // document.getElementById("product1").dataset["aphide"] = "1"; Grandmas are enabled from start
  document.getElementById("product2").dataset["aphide"] = "1";
  document.getElementById("product3").dataset["aphide"] = "1";
  document.getElementById("product4").dataset["aphide"] = "1";
  document.getElementById("product5").dataset["aphide"] = "1";
  document.getElementById("product6").dataset["aphide"] = "1";
  document.getElementById("product7").dataset["aphide"] = "1";
  document.getElementById("product8").dataset["aphide"] = "1";
  document.getElementById("product9").dataset["aphide"] = "1";
  document.getElementById("product10").dataset["aphide"] = "1";
  document.getElementById("product11").dataset["aphide"] = "1";
  document.getElementById("product12").dataset["aphide"] = "1";
  document.getElementById("product13").dataset["aphide"] = "1";
  document.getElementById("product14").dataset["aphide"] = "1";
  document.getElementById("product15").dataset["aphide"] = "1";
  document.getElementById("product16").dataset["aphide"] = "1";
  document.getElementById("product17").dataset["aphide"] = "1";
  document.getElementById("product18").dataset["aphide"] = "1";
  document.getElementById("product19").dataset["aphide"] = "1";

  // Read all game options
  await window.client.players.self.fetchSlotData().then((slotData) => {
    // Set advancement_goal as goalAchievementCount
    goalAchievementCount = slotData.advancement_goal;
    Object.keys(gameOptions).forEach(optionName => gameOptions[optionName] = slotData[optionName]);
    console.log("Game options:", gameOptions);
    nameOfSlot = slotData.player_name
    console.log(slotData);
  });

  // Build a list of achievements ordered by their order field (ie. their display order)
  for (let i in Game.Achievements)//sort the achievements
  {
    locationsByDisplayOrder.push(Game.Achievements[i]);
  }
  let sortMap = function (a, b) {
    if (a.order > b.order) return 1;
    else if (a.order < b.order) return -1;
    else return 0;
  }
  locationsByDisplayOrder.sort(sortMap);

  // TODO add a client config panel and make hint display toggleable
  // Overwrite menu drawing so hinted locations are emphasized
  const CCUpdateMenu = Game.UpdateMenu;
  Game.UpdateMenu = (me, context) => {
    CCUpdateMenu(me, context);
    const menu = document.getElementById("menu");
    let menuItems = new Map(Object.values(menu.querySelectorAll(".achievement:not(.enabled)")).map(i => [i.dataset.id, i]))
    const hints = window.client.items.hints.filter(o => !o.found && o.item.locationGame === gameName)
    hints.forEach(h => {
      menuItems.get(String(h.item.locationId - OFFSET.ACHIEVEMENTS))?.classList.add("hinted")
    })
  }

  // Display hinted item name in the tooltip
  const mysterious = "???"
  const CCcrateTooltip = Game.crateTooltip;
  Game.crateTooltip = (me, context) => {
    let str = CCcrateTooltip(me, context);
    if (me.type === "achievement") {
      let h = window.client.items.hints.find(o => !o.found && o.item.locationId === me.id + OFFSET.ACHIEVEMENTS);
      if (!!h) {
        str = str
          .replace(mysterious, `${h.item.locationName}`)
          .replace(mysterious, `<b>Condition: </b>${me.ddesc}<div class="line"></div>Will send item <b>${h.item.name}</b> to <b>${h.item.receiver.name}</b>`)
      }
    }
    return str
  }

  function applyProductionMultiplier() {
    new Game.buffType('AP cookies', function (time, pow) {
      return {
        name: '[AP] Blessing from another world',
        desc: `Cookie production x${pow} forever!`,
        icon: [23, 16],
        time: 1000000000 * Game.fps,
        add: false,
        multCpS: pow,
        aura: 1
      };
    });
    Game.gainBuff('AP cookies', null, 10 ** gameOptions.production_multiplier);
  }

  function applyLumpMultiplier() {
    new Game.buffType('AP lumps', function (time, pow) {
      return {
        name: '[AP] Sugar from another world',
        desc: `All sugar lump harvests will yield x${pow} lumps forever!`,
        icon: [33, 0],
        time: 1000000000 * Game.fps,
        add: false,
        aura: 1
      };
    });
    Game.gainBuff('AP lumps', null, gameOptions.lump_multiplier);
    Game.CCgainLumps = Game.CCgainLumps || Game.gainLumps;
    Game.gainLumps = total => Game.CCgainLumps(total * gameOptions.lump_multiplier);
  }

  if (gameOptions.production_multiplier && gameOptions.production_multiplier > 0) applyProductionMultiplier();
  if (gameOptions.lump_multiplier && gameOptions.lump_multiplier > 1) applyLumpMultiplier();

  // Overwrite for win function CookieClicker
  Game.Win = function (what) {
    if (typeof what === "string") {
      if (Game.Achievements[what]) {
        let it = Game.Achievements[what];
        if (it.won == 0) {
          let name = it.shortName ? it.shortName : it.dname;
          it.won = 1;
          Game.Notify(
            loc("Achievement unlocked"),
            '<div class="title" style="font-size:18px;margin-top:-2px;">' +
            name +
            "</div>",
            it.icon,
          );
          Game.NotifyTooltip(
            "function(){return Game.crateTooltip(Game.AchievementsById[" +
            it.id +
            "]);}",
          );
          if (Game.CountsAsAchievementOwned(it.pool)) Game.AchievementsOwned++;
          Game.recalculateGains = 1;
          if (App && it.vanilla) App.gotAchiev(it.id);

          // Send AchievementID to AP
          sendCheckIdToAp(it.id + OFFSET.ACHIEVEMENTS);
          if (gameOptions.enable_hints) hintAdjacentLocations(it);

          const gameWon = window.client.items.received.some(i => i.id === 42000000)
          if (!gameWon && loadAchieveNum() >= goalAchievementCount) {
            console.log("Win-condition met!");
            sendCheckIdToAp(42000000)
            window.client.goal();
          }
        }
      }
    } else {
      for (let i in what) {
        Game.Win(what[i]);
      }
    }
  };

  // Overwrite Cookies
  //10x Shimmers
  let shimmersFactor = 10;

  Game.updateShimmers = function () {
    // Run shimmer functions, kill overtimed shimmers and spawn new ones
    for (var i in Game.shimmers) {
      Game.shimmers[i].update();
    }

    // Cookie storm!
    if (Game.hasBuff("Cookie storm") && Math.random() < 0.5) {
      var newShimmer = new Game.shimmer(
        "golden",
        {type: "cookie storm drop"},
        1,
      );
      newShimmer.dur = Math.ceil(Math.random() * 4 + 1);
      newShimmer.life = Math.ceil(Game.fps * newShimmer.dur);
      //newShimmer.force='cookie storm drop';
      newShimmer.sizeMult = Math.random() * 0.75 + 0.25;
    }

    // Spawn shimmers
    for (var i in Game.shimmerTypes) {
      let me = Game.shimmerTypes[i];
      if (me.spawnsOnTimer && me.spawnConditions()) {
        // Only run on shimmer types that work on a timer
        if (!me.spawned) {
          // No shimmer spawned for this type? Check the timer and try to spawn one
          //me.time++;
          me.time = me.time + shimmersFactor;
          if (
            Math.random() <
            Math.pow(
              Math.max(0, (me.time - me.minTime) / (me.maxTime - me.minTime)),
              5,
            )
          ) {
            var newShimmer = new Game.shimmer(i);
            newShimmer.spawnLead = 1;
            if (
              Game.Has("Distilled essence of redoubled luck") &&
              Math.random() < 0.01
            )
              var newShimmer = new Game.shimmer(i);
            me.spawned = 1;
          }
        }
      }
    }
  };

  // Setup for later
  let prestigeUps = ["How to bake your dragon", "Synergies Vol. I", "Synergies Vol. II"];
  if (gameOptions.enable_progressive_buildings) prestigeUps.push("Starter kit");

  // Extend
  const CCAscend = Game.Ascend;
  Game.Ascend = function (bypass) {
    // Force display and prevent buying prestige upgrades handled directly in AP
    if (bypass) prestigeUps.forEach(u => Game.Upgrades[u].bought = 1);
    CCAscend(bypass);
  }

  const CCReincarnate = Game.Reincarnate;
  Game.Reincarnate = function (bypass) {
    // Disable these upgrades again so their effect is not applied by accident
    if (bypass) prestigeUps.forEach(u => {
      // Don't relock items that were received for real
      if (!Game.Upgrades[u].unlocked) {
        Game.Upgrades[u].bought = 0
      }
    });

    CCReincarnate(bypass);

    if (bypass) {
      // Reapply custom buffs cleared during ascension
      if (gameOptions.production_multiplier && gameOptions.production_multiplier > 0) applyProductionMultiplier();
      if (gameOptions.lump_multiplier && gameOptions.lump_multiplier > 1) applyLumpMultiplier();
      // Reapply all items
      receivedItems.forEach((id) => {
        receiveItem(id, false);
      });
    }
  }

  // Boost lump times by default. Max ripe time is 10mn instead of 24h
  Game.computeLumpTimes = function () {
    let minute = 1000 * 60;
    Game.lumpMatureAge = minute * 9;
    Game.lumpRipeAge = minute * 10;
    if (Game.Has("Stevia Caelestis")) Game.lumpRipeAge -= minute;
    if (Game.Has("Diabetica Daemonicus")) Game.lumpMatureAge -= minute;
    if (Game.Has("Ichor syrup")) Game.lumpMatureAge -= minute/60 * 7;
    if (Game.Has("Sugar aging process"))
      // In vanilla, 600 grandmas ~= 4% timer reduction
      Game.lumpRipeAge -= minute/600 * Math.min(600, Game.Objects["Grandma"].amount); // Capped at 600 grandmas
    if (Game.hasGod && Game.BuildingsOwned % 10 == 0) {
      let godLvl = Game.hasGod("order");
      if (godLvl == 1) Game.lumpRipeAge -= minute;
      else if (godLvl == 2) Game.lumpRipeAge -= (minute / 3) * 2;
      else if (godLvl == 3) Game.lumpRipeAge -= minute / 3;
    }
    //if (Game.hasAura('Dragon\'s Curve')) {Game.lumpMatureAge/=1.05;Game.lumpRipeAge/=1.05;}
    Game.lumpMatureAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
    Game.lumpRipeAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
    Game.lumpOverripeAge = Game.lumpRipeAge + minute;
    // Note : Applying every single buffs is equivalent to ~20% timer reduction

    // Debug upgrade
    if (Game.Has("Glucose-charged air")) {
      Game.lumpMatureAge /= 2000;
      Game.lumpRipeAge /= 2000;
      Game.lumpOverripeAge /= 2000;
    }
  };

  const CCUnlock = Game.Unlock;
  Game.Unlock = (what) => {
    if (typeof what==='string') {
      // If item is in the AP pool, then prevent unlocking it (so it won't display in shop)
      if (window.client.package.findPackage(gameName).reverseItemTable[Game.Upgrades[what].id + OFFSET.ITEMS.UPGRADES + 1]) {
        return;
      }
      if (["Heavenly chip secret", "Heavenly cookie stand", "Heavenly bakery", "Heavenly confectionery", "Heavenly key"].find(x => x === what)) return;
    }
    CCUnlock(what)
  }

  //AP-Shop
  //Quick-sort algorythim ("borrowed" from medium.com, slightly modified) that sorts by baseprice
  //WARNING: ONLY WORKS FOR SHOP DUE TO HOW ITS SET UP
  function quickSort(arr) {
    if (arr.length <= 1) return arr;

    const p = arr.pop();
    const leftArr = [];
    const rightArr = [];

    for (const itemArr of arr) {
      let item = itemArr[0]
      if (item.basePrice <= p[0].basePrice) {
        leftArr.push(itemArr);
      } else {
        rightArr.push(itemArr);
      }
    }

    return [...quickSort(leftArr), p, ...quickSort(rightArr)];
  }

  //Create the AP items
  const UPGRADE_CHECK_OFFSET = 4306900
  function createAPupgrade(upg) {
    return {
        id: upg.id,
        name: upg.name,
        desc: upg.desc,
        requiredBuilding: -1, //if someone wants to update this to be building-lock based, feel free to use this unused var
        icon: [0,0], //Gets overridden later anyways
        basePrice: upg.basePrice,
        tier: upg.tier, //Unused as of writing this

        idWithOffset: upg.id + UPGRADE_CHECK_OFFSET,
    };
  }

  //get a list of all upgrade object
  let allUpgrades = []
  for (let upg of Object.values(Game.Upgrades)) {
    allUpgrades.push(upg)
  }

  //Filter out any non-poolless upgrades
  let allPoollessAPUpgrades = []
  for (let item of allUpgrades) {
    if (item.pool == "") {
      allPoollessAPUpgrades.push(createAPupgrade(item))
    }
  }

  //check if check was already sent 
  let apUpgradeWithSentStatus = [] //true >> sent, false >> not sent [item, sentBool]
  let missingChecks = client.room.missingLocations
  
  for (let item of allPoollessAPUpgrades) {
    let checkID = item.idWithOffset
    if (missingChecks.includes(checkID)){
      apUpgradeWithSentStatus.push([item, false])
    } else {
      apUpgradeWithSentStatus.push([item, true])
    }
  } 

  
  
  const APUPGRADE_DESCRIPT_BASICS = [
    "They didnt seam too intrested in this item",                             								//filler
    "They Seamed Intrested in this item",                                     								//usefull
    "They Were Eager for you to get it to them",                              								//progression
    "Someone is going to have questions about this one... but a little troll never hurt anyone, right?",  	//trap
    "I However could not tell you if they are intrested in it or not"         								//backup incase something fails
  ]

  const APUPGRADE_DESCRIPT_SELF = [
    "This could Come in handy!",                                                        //filler
    "This Seams Quite usefull!",                                                        //usefull
    "This will make your life a Whole lot easier",                                      //progression
    "oh wait... its a trap... well thats a waste of shop space",                        //trap
    "But uhh... i dont know if this is usefull or not, server is being awfully quiet",  //backup incase something fails
  ]
  /**
   * Create descriptions for the items
   * TODO: Refactor to be more dynamic and less hardcoded
   * 
   * @param {string} forPlayer - Who will be reciving the item
   * @param {string} item - What will be sent (ONLY THE NAME HERE, NOT A OBJECT)
   * @param {number} flagCase - What flagCase it is (0: filler, 1: usefull, 2: progression, 3: trap, 4: backup if undetermined) 
   * @param {number} type - What description type it is {Feel free to expand} (0: Basic, 1: your own item, 2: Item for a fellow CCAP player) 
   * 
   * @returns {string} The Finished Description string
  */
  function createShopDescription(forPlayer, item, flagCase, type) {
    if (type === -1) {throw new RangeError("Hey dev, you broke the WHOLE description creator... The type should NEVER be at -1... you removed the else... didnt you?")}

    //defines What Type of description is needed based on settings
    let desc = ""
    let detail = gameOptions.shop_tooltip_detail
    if (detail == 0) { //minimal
      desc  = "A Item From Another World\n\n" 
      desc += "<q> I Wonder What it could be...</q>"
      return desc //this is intentional as its not meant to get a Flavortext
    } else if (detail == 1) { //basic
      switch (type) {
        case 0:
          desc = "A Item From <b>" + forPlayer + "</b>'s World\n\n"
          break
        case 1:
          desc = "Its Something for <b>Yourself</b>!\n\n"
          break
        case 2:
          desc = "A Item For Yourse- Wait no, its for <b>" + forPlayer + "</b>, Our Fellow Cookie Clicker enthusiast\n\n"
          break
        default:
          throw new RangeError("Failed to Create Description: Excpeted a num for type, got one out of range of available types (got " + type.toString() + ")")
      }
    } else if (detail == 2) { //full
      if (type === 0) {
        desc = "A <b>" + item + "</b> For <b>" + forPlayer + "</b>\n\n"
      } else if (type === 1) {
        desc = "Its <b>" + item + "</b> For Yourself, How Fun!\n\n"
      } else if (type === 2) {
        desc = "A <b>" + item + "</b> For Our Fellow Cookie Clicker enthusiast <b>" + forPlayer + "</b>!\n\n" 
      } else {
        throw new RangeError("Failed to Create Description: Excpeted a num for type, got one out of range of available types (got " + type.toString() + ")")
      }
    } else { //error
      throw new RangeError("Failed to Create Description: Excpeted a num for detail, got one out of range of available detail-levels (got " + type.toString() + ")")
    }

    //Info descript for how usefull
    desc = desc + "<q>"
    if (type === 0 || type === 2) {
      desc = desc + APUPGRADE_DESCRIPT_BASICS[flagCase]
    } else if (type === 1) {
      desc = desc + APUPGRADE_DESCRIPT_SELF[flagCase]
    } else {
      throw new RangeError("Failed to Create Description: Used a Valid num for type to start creating description, however there is no valid info-description to add to it")
    }
    desc = desc + "</q>"
    /*
    For those who want to add their own situations with type:
    1. make a const list[] above with 5 strings (1 for each flagCase)
    2. Add a else-if here (BEFORE THE end-else) calling that Description const with index flagCase
    3. profit idk
    */

    return desc
  }

  /**
   * Gets a Custom icon for the Shop-icon depending on its name
   * @param {string} itemname - the name of the item 
   * 
   * @returns The icon cords (plus spritesheet if needed)
   */
  function getIconFromIconsheet(itemname) {
    //sets the icon based on what it is
    //For any future devs: to add custom icons, get a custom icon sprite sheet, import it, then set the 3rd item in the list to the Modded spritesheet
    // (if something should take priority over something else (example: "progressive grandmas" over "grandmas"), just place it earlier in the list)
    /*
     * list of all added possibilitys so far:
     * - all CC Buildings [Not always 100% of the name so will also hit non-CC items]
     * - Cat/kitten
     * - egg
     * - banner
	 * - Default CC Icon (Last resort if nothing else fits && its a CC Upgrade)
    */
    
    //SECTION FOR CUSTOM SPRITESHEETS (remember: 1 icon is 48x48 big)



    //get the icon
    let icon = []
    let itemLower = itemname.toLowerCase()
    if (itemLower.includes("cursor")) {
      icon = [0, 27]
    } else if (itemLower.includes("progressive grandma")) {
      icon = [1, 27]
    } else if (itemLower.includes("grandma")) {
      icon = [10, 9]
    } else if (itemLower.includes("farm")) {
      icon = [2, 27]
    } else if (itemLower.includes("mine")) {
      icon = [3, 27]
    } else if (itemLower.includes("factory")) {
      icon = [4, 27]
    } else if (itemLower.includes("shipment")) {
      icon = [5, 27]
    } else if (itemLower.includes("lab")) {
      icon = [6, 27]
    } else if (itemLower.includes("portal")) {
      icon = [7, 27]
    } else if (itemLower.includes("time machine")) {
      icon = [8, 27]
    } else if (itemLower.includes("antimatter condenser")) {
      icon = [13, 27]
    } else if (itemLower.includes("prism")) {
      icon = [14, 27]
    } else if (itemLower.includes("bank")) {
      icon = [15, 27]
    } else if (itemLower.includes("temple")) {
      icon = [16, 27]
    } else if (itemLower.includes("wizard tower")) {
      icon = [17, 27]
    } else if (itemLower.includes("cat") || itemLower.includes("kitten")) {
      icon = [18, 27]
    } else if (itemLower.includes("chance maker")) {
      icon = [19, 27]
    } else if (itemLower.includes("fractal engine")) {
      icon = [20, 27]
    } else if (itemLower.includes("console")) {
      icon = [32, 27]
    } else if (itemLower.includes("idleverse")) {
      icon = [33, 27]
    } else if (itemLower.includes("cortex baker")) {
      icon = [34, 27]
    } else if (itemLower.includes("you")) {
      icon = [35, 27]
    } else if (itemLower.includes("egg")) {
      icon = [21, 12]
    } else if (itemLower.includes("banner")) {
      icon = [21, 29]
    } else { //DO NOT ADD ANY NEW ICONS BELOW HERE, ONLY ABOVE
      try {
        icon = Game.Upgrades[itemname].icon
      } catch (_) {
        icon = [0, 0] //TODO Replace with custom AP Icon
      }
    }

    return icon
  }

  //sort all items by price
  let apUpgradeByPrice = quickSort(apUpgradeWithSentStatus)

  //seperate list with only id's for scouting
  let apItemIDS = []
  for (let apItemArr of apUpgradeByPrice) {
    let apItem = apItemArr[0]
    apItemIDS.push(apItem.idWithOffset)
  }

  //adding the upgrades to shop
  let apShopScouts = await client.scout(apItemIDS, 0) //scouts locations to properly name everything
  let scoutCounter = 0

  let firstUnlockCounter = 5 //0 >> all 5 starting upgrades unlocked
  for (let apItemArr of apUpgradeByPrice) {
    let apItem = apItemArr[0]


    //scout the location
    let locationItemScout = apShopScouts[scoutCounter]
    scoutCounter++
    let locationItemScout_Game = locationItemScout.receiver.game
    let locationItemScout_ItemName = locationItemScout.name
    let locationItemScout_PlayerName = locationItemScout.receiver.name

    //Determin its flagCase
    let flagCase = -1
    if (locationItemScout.filler) {
      flagCase = 0
    } else if (locationItemScout.useful) {
      flagCase = 1
    } else if (locationItemScout.progression) {
      flagCase = 2
    } else if (locationItemScout.trap) {
      flagCase = 3
    } else {
      console.warn("could not determin flag of following location:\n", locationItemScout)
      flagCase = 4
    }

    //determin its type
    let typeOfDescription = -1
    if (locationItemScout_PlayerName == nameOfSlot) { 
      typeOfDescription = 1
    } else if (locationItemScout_Game == gameName) {
      typeOfDescription = 2
    } else {
      typeOfDescription = 0
    }
    let description = createShopDescription(locationItemScout_PlayerName, locationItemScout_ItemName, flagCase, typeOfDescription)


    apItem.icon = getIconFromIconsheet(locationItemScout_ItemName)

    //adds the upgrade
    new Game.Upgrade("[AP] " + apItem.name, description, apItem.basePrice, apItem.icon, function(){ //NOSONAR (Non-used Object initiation, but its used in a different way)
      //send check
      window.client.check(apItem.idWithOffset);
      
      //Unlock next item
      //if someone knows how to make this prettier, feel free to do so
      try {
        console.log("Unlocking Next APITEM Inside the shop")
        let nextUnlockId = this.id + 1
        while (Game.UpgradesById[nextUnlockId].unlocked == 1 || Game.UpgradesById[nextUnlockId].bought == 1) {
          nextUnlockId++
        }
        Game.Upgrades[Game.UpgradesById[nextUnlockId].name].unlocked = 1
      } catch (caughtError) { 
        console.log("No New Upgrade Unlocked: Max Reached")
        console.log("PRINTING CAUGHT ERROR BELOW:")
        console.log(caughtError)
      }
    })

    //gets the upgrade to modify it (as it doesnt properly create it)
    let upg = Game.Upgrades["[AP] " + apItem.name]
    
    //fixes description
    upg.ddesc = description

    //unlocks the first 5 Upgrades (by price) && ensure the already sent checks are ignored
    if (apItemArr[1]) {
      upg.bought = 1
      continue
    }
    if (firstUnlockCounter > 0) {
      upg.unlocked = 1
      firstUnlockCounter--
    }
  }

  // Disable buying upgrades that are in the item pool.
  // Must stay after Game.Unlock override to prevent re-unlock happening during init
  Object.values(window.client.package.findPackage(gameName).itemTable)
    .forEach(apId => {
      if (OFFSET.ITEMS.isUpgrade(apId) && !OFFSET.ITEMS.isProgressive(apId)) {
        let up = Game.UpgradesById[apId - OFFSET.ITEMS.UPGRADES - 1];
        up.unlocked = 0;
        if (up.pool === "prestige") {
          up.bought = 1;
          up.basePrice = -1;
        }
      }
    });
  // Manually lock upgrades that are progressive (ie not in the pool). Ugly code but hopefully we don't add more
  [
    "Heavenly chip secret",
    "Heavenly cookie stand",
    "Heavenly bakery",
    "Heavenly confectionery",
    "Heavenly key"
  ].forEach(up => Game.Upgrades[up].unlocked = 0);
  // Same for  Prestige upgrades linked to pool items, or used as progressive buildings but not in the item pool
  prestigeUps.forEach(up => {
        Game.Upgrades[up].basePrice = -1;
        Game.Upgrades[up].parents = [];
      })
  Game.RebuildUpgrades();
  Game.ApReady = true;
}
