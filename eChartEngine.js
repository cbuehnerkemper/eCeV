'use strict';
console.log("10:09");

$('#control-panel-modal').on('show.bs.modal', function (e) {
  // UPDATE SETTINGS IN MODAL
  $('.selectSetting').each(function(e) { $('.selectSetting [value="'+localStorage[this.id]+'"]').prop("selected",true); });
  $('.form-control').each(function(e) { console.log([this.id, localStorage[this.id]]); $('.form-control').val(localStorage[this.id]); });
});
$('#control-panel-modal').on('hidden.bs.modal', function (e) { redraw(); });

function updateSelectSetting(setting) {
  // Updates settings chosen by a select input
  if(setting==undefined) { console.log("no setting defined"); return null; }
  else {
    console.log({
      setting:setting,
      current:localStorage[setting],
      selected:$("#"+setting+" :selected").val(),
    });
    localStorage[setting] = $("#"+setting+" :selected").val();
  }
  redraw();
}
$('.selectSetting').on('change', function() {updateSelectSetting(this.id);}); // Adds onchange event handler for settings chosen by a select input

function updateInputSetting(setting) {
  // Updates settings chosen by a standard input
  if(setting==undefined) { console.log("no setting defined"); return null; }
  else {
    console.log({
      setting:setting,
      current:localStorage[setting],
      selected:$("#"+setting).val(),
    });
    localStorage[setting] = $("#"+setting).val();
  }
  redraw();
}
$('.form-control').on('change', function() {updateInputSetting(this.id);}); // Adds onchange event handler for settings chosen by a select input

document.body.style.overflow = 'hidden'; // hide scrollbars
var canv = document.querySelector('canvas'); // Sets global variable canv to the canvas element
canv.onclick=function (e) {
  if((e.pageX>cpX[0])&&(e.pageX<cpX[1])&&(e.pageY>cpY[0])&&(e.pageY<cpY[1])) $('#control-panel-modal').modal('show');
  else {}
} // Adds click handler to the canvas to see if the control panel should be opened

canv.ondblclick=function (e) {
  navigator.usb.requestDevice({ filters: [{vendorId:1027}] })
  .then(function(device) {
    console.log(device);
    asyncRemoteListen(device)
  })
  .catch(error => { console.log(error); });
}

async function asyncRemoteListen(device) {
  await device.open()
    .then(function() {device.selectConfiguration(1)});
    //.then(function() {device.claimInterface(0)});

  // if (device.configuration === null)
  //   await device.selectConfiguration(1);
  // await device.claimInterface(0);
  // await device.controlTransferOut({
  //   requestType: 'vendor',
  //   recipient: 'interface',
  //   request: 0x01,  // vendor-specific request: enable channels
  //   value: 0x0013,  // 0b00010011 (channels 1, 2 and 5)
  //   index: 0x0000   // Interface 0 is the recipient
  // });
  // while (true) {
  //   let result = await data.transferIn(1, 6);
  //
  //   if (result.data && result.data.byteLength === 6) {
  //     console.log('Channel 1: ' + result.data.getUint16(0));
  //     console.log('Channel 2: ' + result.data.getUint16(2));
  //     console.log('Channel 5: ' + result.data.getUint16(4));
  //   }
  //
  //   if (result.status === 'stall') {
  //     console.warn('Endpoint stalled. Clearing.');
  //     await device.clearHalt(1);
  //   }
  // }
}

canv.width = window.innerWidth; // set width of canvas to width of the window
canv.height = window.innerHeight; // set height of canvas to height of the window
var c = canv.getContext('2d');
function getMaxRows() {return JSON.parse(localStorage.maxRows);};
var cpX = 0;
var cpY = 0;
//if(sessionStorage.balance == null) sessionStorage.balance = false; // Should this be stored or reset on each reload?
//var balance = JSON.parse(sessionStorage.balance);
var balance = false;
if(localStorage.mirrored == null) localStorage.mirrored = 1;
var mir = JSON.parse(localStorage.mirrored); // load the mirrored
c.setTransform(mir,0,0,1,canv.width/2,canv.height/2);
c.fillStyle = 'Black';
c.textAlign = 'center';

var layout = {};
var rowsToPrint = 0;

function initialize() { //initialize
  if (typeof(Storage) !== "undefined") {
    if((localStorage.distancetochair == null)||(localStorage.xscale == null)||(localStorage.yscale == null)) calibration();
    else {
      console.log({
        distancetochair : localStorage.distancetochair,
        xscale : localStorage.xscale,
        yscale :localStorage.yscale,
      });
    }
  } else {
    // Delete the canvas element to make sure that the page doesn't try to load anything
    canv.parentElement.removeChild(canvas);
    // Takeover message to user that browser is not supported for eChart Online
    alert("Your browser does not support localStorage which is required to use eChart Online. Please choose another browser.");
    return;
  }


  // default settings
  if(localStorage.labelSize == null) localStorage.labelSize = 10;
  if(localStorage.labelColor == null) localStorage.labelColor = 'blue';
  if(localStorage.labelNumerator == null) localStorage.labelNumerator = true;
  if(localStorage.labelUnits == null) localStorage.labelUnits = 'imperial';
  if(localStorage.maxRows == null) localStorage.maxRows = 4;
  if(sessionStorage.latchRows = null) sessionStorage.latchRows = 0;

  cpX = [window.innerWidth-100, window.innerWidth];
  cpY = [0, 100];
  //localStorage.removeItem("cpY");
  //sessionStorage.removeItem("cpY");
  console.log(sessionStorage);
  console.log(localStorage);

  //$("#controlLink").attr("coords",""+window.innerWidth/4+","+window.innerHeight/4+","+window.innerWidth/2+","+window.innerHeight/2);

  layout = {
    setSet : function(index) {
      this.ls = lettersetoptions[index];
      this.rows = this.ls.getLetterRows();
      sessionStorage.maxColumns = 999;
      console.log(lettersetoptions[index]);
      redraw();
      console.log(this.ls.description+" now live.");
    },
    updateRows : function(letterRows) {
      if (letterRows==undefined) letterRows=this.ls.getLetterRows();
      this.rows = letterRows;
      //console.log(sessionStorage);
    },
    nextSet : function() {
      console.log(this.ls.nextSet());
      redraw();
    }
  };
  layout.setSet(1);
}
initialize();

Mousetrap.bind('q', function() {console.log(layout.rows);}, 'keyup'); // Displays the currently displayed rows to the console.

function showControlPanel() {$('#control-panel-modal').modal('show');}

Mousetrap.bind('c', function() {calibration(true);}, 'keyup');
function calibration() {
  localStorage.removeItem("squareCalibrationDone");
  do {
    localStorage.distancetochair = prompt("How far is the screen from the patient's chair? (in feet)", localStorage.distancetochair);
    if (localStorage.distancetochair==0) {
      localStorage.removeItem("distancetochair");
    } else if (!isNaN(localStorage.distancetochair)) {

    } else {
      localStorage.removeItem("distancetochair");
    }
  } while (localStorage.distancetochair == null)
  console.log({distancetochair:localStorage.distancetochair});
  if (localStorage.squareCalibrationDone == null) { // Configuration is required
    localStorage.squaresize = localStorage.distancetochair*0.4433;
    var startsize = Math.min(canv.width/2, canv.height/2);
    if(localStorage.xscale==null) localStorage.xscale = startsize;
    if(localStorage.yscale==null) localStorage.yscale = startsize;
    calibrationSquare();
  }
  unbindKeys();
  Mousetrap.bind('up', function() {localStorage.yscale=Number(localStorage.yscale)+1; calibrationSquare();});
  Mousetrap.bind('+', function() {localStorage.yscale=Number(localStorage.yscale)+1; localStorage.xscale=Number(localStorage.xscale)+1; calibrationSquare();});
  Mousetrap.bind('down', function() {localStorage.yscale=Number(localStorage.yscale)-1; calibrationSquare();});
  Mousetrap.bind('-', function() {localStorage.yscale=Number(localStorage.yscale)-1; localStorage.xscale=Number(localStorage.xscale)-1; calibrationSquare();});
  Mousetrap.bind('right', function() {localStorage.xscale=Number(localStorage.xscale)+1; calibrationSquare();});
  Mousetrap.bind('left', function() {localStorage.xscale=Number(localStorage.xscale)-1; calibrationSquare();});
  Mousetrap.bind('shift+up', function() {localStorage.yscale=Number(localStorage.yscale)+10; calibrationSquare();});
  Mousetrap.bind('shift+down', function() {localStorage.yscale=Number(localStorage.yscale)-10; calibrationSquare();});
  Mousetrap.bind('shift+right', function() {localStorage.xscale=Number(localStorage.xscale)+10; calibrationSquare();});
  Mousetrap.bind('shift+left', function() {localStorage.xscale=Number(localStorage.xscale)-10; calibrationSquare();});
  Mousetrap.bind('enter', function() {
    Mousetrap.unbind('up');
    Mousetrap.unbind('+');
    Mousetrap.unbind('down');
    Mousetrap.unbind('-');
    Mousetrap.unbind('left');
    Mousetrap.unbind('right', function() {moreLetters(); redraw();}, 'keyup');
    Mousetrap.unbind('right');
    Mousetrap.unbind('shift up');
    Mousetrap.unbind('shift down');
    Mousetrap.unbind('shift left');
    Mousetrap.unbind('shift right');
    Mousetrap.unbind('enter', 'keyup');
    bindKeys();
    localStorage.squareCalibrationDone = true;
    console.log({xscale:localStorage.xscale, yscale:localStorage.yscale});
    redraw();
  }, 'keyup');
};

function calibrationSquare() {
  c.clearRect(-canv.width/2, -canv.height/2, canv.width, canv.height);
  c.font="20px Open Sans";
  c.textBaseline="middle";
  c.textAlign="center";
  c.fillText("Using the '+' and '-' keys to adjust the size of this rectangle, measure it to "+(Math.round(localStorage.squaresize * 100) / 100)+" cm.", 0, -(canv.height)/3);
  c.beginPath();
  c.rect(-localStorage.xscale/2, -localStorage.yscale/2, localStorage.xscale, localStorage.yscale);
  c.fill();
}

function lettersetSelector() {
  var footer = document.getElementById("lettersetbuttons");
  footer.innerHTML = "";
  var buttonclick = function(greeting){ layout.setSet(this); $('#lettersetselectormodal').modal('hide'); };
  for (var i = 0; i < lettersetoptions.length; i++) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary";
    button.innerHTML = lettersetoptions[i].description;
    button.onclick = _.bind(buttonclick, i);
    footer.appendChild(button);
  }
  $('#lettersetselectormodal').modal('show');
}

function redraw(letterRows) {
  if(letterRows!="DONOTUPDATE") layout.updateRows(letterRows);
  while (layout.ls.getDisplayHeight() > canv.height) {layout.updateRows(layout.ls.decreaseRow()); if (layout.rows.length==1) break;}

  if(JSON.parse(sessionStorage.latchRows)) rowsToPrint = Math.min(getMaxRows(), layout.rows.length);
  else rowsToPrint = Math.min(getMaxRows(), layout.rows.length);
  console.log({possiblerows:layout.rows.length, rowsToPrint:rowsToPrint, rowLimit:Number(localStorage.rowLimit), maxRows:getMaxRows()});
  c.clearRect(-canv.width/2, -canv.height/2, canv.width, canv.height);

  drawBalance();

  var ytop = -canv.height/2+((canv.height-layout.ls.getDisplayHeight(rowsToPrint))/2)+layout.rows[0].getFontHeight();
  var labelHeight = getLetterHeight(localStorage.labelSize);
  var ylabeltop = canv.height/2-(labelHeight*rowsToPrint*1.5);
  //console.log({rowstoprint:layout.ls.getDisplayHeight(rowsToPrint), full:layout.ls.getDisplayHeight()});
  for(var i=0; i<rowsToPrint; i++) {
    drawRow(layout.rows[i], ytop);
    if (localStorage.labelSize!="0") {
      drawLabel(layout.rows[i], ylabeltop);
      ylabeltop += labelHeight*1.5;
    };
    ytop += (layout.rows[i].getFontHeight()*2);
  }
}

function getLetterWidth(size) {
  return Math.ceil(Number(localStorage.xscale)*(size/200));
}

function getLetterHeight(size) {
  return Math.ceil(Number(localStorage.yscale)*(size/200));
}

function drawRow(rowObject, y) {
  // maxLetters determines how many letters are allowed to be printed on each row without extending past the boundaries of the browser window
  // calculates the width of the canvas, takes away one letter width then divides the remaining length by twice the width of a letter (to account for the spacing)
  // takes the smaller of that number or the number of letters available to print
  // rounds this number down to avoid accidentally printing too many letters due to for loop counter logic
  var maxLetters = Math.min(sessionStorage.maxColumns, rowObject.letters[0].length, Math.floor((canv.width-rowObject.getFontWidth())/(2*rowObject.getFontWidth())));
  if (maxLetters <= 1) {
    maxLetters = 1;
  }
  if (sessionStorage.maxColumns!=999) {
    sessionStorage.maxColumns = maxLetters;
  }
  // collectiveWidth calculates the entire width of the row based on how many letters will be printed and the letter width, including one letter's width around any letter
  var collectiveWidth = (rowObject.getFontWidth()*((maxLetters*2)-1));
  // xleft holds the current printing position of the next letter
  // ...it starts off on the far left of the canvas then calculates how far the left the letters should start to be centered
  var xleft = -canv.width/2+((canv.width-collectiveWidth)/2)+rowObject.getFontWidth()/2;
  for(var i=0, len=maxLetters; i<len; i++) {
    // draws the next letter in the list at (xleft, y) with the appropriate size
    drawLetter(rowObject.letters[0][i], xleft, y, rowObject.getFontSize());
    // increments the x coordinate accounting for the letter just printed and spacing between letters
    xleft += (rowObject.getFontWidth()*2);
  }
}

function drawLabel(rowObject, y) {
  switch (localStorage.labelUnits) {
    case "metric":
      var chars = new String(getMetric(rowObject.getFontSize())).split("");
      break;
    case "decimal":
      var chars = new String(Math.round(20/rowObject.getFontSize()*100)/100).split("");
      break;
    case "imperial":
    default:
      var chars = new String(rowObject.getFontSize()).split("");
      break;
  }
  switch (localStorage.labelNumerator) {
    case "true":
      switch (localStorage.labelUnits) {
        case "metric":
          chars.unshift("6","/");
          break;
        case "imperial":
          chars.unshift("2","0","/");
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  var labelWidth = getLetterWidth(localStorage.labelSize);
  var labelX = (-canv.width/2+labelWidth)*mir;
  for (var i = 0; i < chars.length; i++) {
    letters[chars[i]].draw(labelX, y, JSON.parse(localStorage.labelSize), localStorage.labelColor, true);
    labelX += labelWidth*mir;
  }
}

function lessLetters() {
  if(sessionStorage.maxColumns == 999) {
    var rowLength = [];
    for(var i=0, rowsToPrint=layout.rows.length; i<rowsToPrint; i++) {
      rowLength.push(Math.min(layout.rows[i].letters[0].length, Math.floor((canv.width-layout.rows[i].getFontWidth())/(2*layout.rows[i].getFontWidth())) ));
      if (_.uniq(rowLength,false).length==1) sessionStorage.maxColumns = rowLength[0]-1;
      else sessionStorage.maxColumns = rowLength[0];
    }
  } else {
    sessionStorage.maxColumns-=1;
  }
  sessionStorage.maxColumns = Math.max(sessionStorage.maxColumns, 1);
  console.log({maxColumns:sessionStorage.maxColumns});
}
function latchColumnsClosed() {
  sessionStorage.maxColumns = 1;
  console.log({maxColumns:sessionStorage.maxColumns});
}
function moreLetters() {
  if(sessionStorage.maxColumns != 999) sessionStorage.maxColumns = Math.min(Number(sessionStorage.maxColumns)+1, layout.rows[0].letters[0].length, Math.floor((canv.width-layout.rows[0].getFontWidth())/(2*layout.rows[0].getFontWidth())) );
  console.log({maxColumns:sessionStorage.maxColumns});
}
function latchColumnsOpen() { sessionStorage.maxColumns = 999; console.log({maxColumns:sessionStorage.maxColumns}); }

function drawLetter(letter, x, y, characterSize, color) {
  if(color==undefined) color = "black"
  // looks up the letter in the letters array, then calls the draw function
  letters[letter].draw(x, y, characterSize, color);
}

// cycles to the next letterset
Mousetrap.bind('space', function() {layout.nextSet();}, 'keyup');

// Is supposed to randomize the leters displayed on the screen
// Will not change the size, number of rows, or number of letters displayed
Mousetrap.bind('r', function() {randomize();}, 'keyup');
function randomize() {
  console.log("randomize");
  for(var i=0, leni=layout.rows.length; i<leni; i++) for(var j=0, lenj=layout.rows[i].letters[0].length; j<lenj; j++) layout.rows[i].letters[0][j] = randomLetter({not:layout.rows[i].letters[0].slice(0,j)});
  redraw("DONOTUPDATE"); // redraw the screen but don't update the rows from storage otherwise the letters will return to default
}

function randomLetter(options) {
  // returns a random letter from the provided letterArray, unless none is provided, then it looks to the currently selected letterSet...otherwise it looks to the default set
  if(options.letterArray==undefined) { // checks if letters have already been provided to choose from, if not look for defaults
    if(layout.ls.letterset==undefined) { // checks to see if the current letterset has letters available, if not look for global defaults
      // Need to change this default list of letters to what is actually allowed...
      // Since building the letterset is part of the object constructor this may not be necessary but is a good idea just in case.
      options.letterArray = ["A", "B", "C", "D", "E", "F", "G"];
    } else { options.letterArray = layout.ls.letterset; } // if available, use the current letterset's available letters
  }
  if(options.not!=undefined) { options.letterArray = _.difference(options.letterArray, options.not); } // Removes letters in the not array from the letters to choose from, to avoid duplicates in a row
  return options.letterArray[Math.floor(Math.random() * (options.letterArray.length-1))];
}

Mousetrap.bind('mod+r', function(e) {
    if (e.preventDefault) { e.preventDefault(); } else { /** internet explorer **/ e.returnValue = false; } // prefent the default behavior
    mir = mir*-1; updateMirrored(); // change the mir setting global variable and saved setting
    c.setTransform(mir,0,0,1,canv.width/2,canv.height/2); // change the canvas coordinate settings
    redraw("DONOTUPDATE"); // redraw the screen but don't update the rows from storage just in case the letters are randomized
});

// resizes the canvas anytime the window is resized but
window.onresize = _.debounce(function() { // debounce prevents this from being called more than once per 1 ms (0.01 second)
  canv.width = window.innerWidth;
  canv.height = window.innerHeight;
  c.setTransform(mir,0,0,1,canv.width/2,canv.height/2);
  redraw();
  if(( window.innerHeight == screen.height)||( window.innerWidth == screen.width)) {
    // browser is fullscreen
    console.log("fullscreen?");
  } else {console.log("not fullscreen?");}
}, 1) // change to 500 for .5 seconds, 1000 for 1 second.

Mousetrap.bind(['mod+-','mod+shift+=','mod+='], function(e) {if (e.preventDefault) { e.preventDefault(); } else { /** internet explorer **/ e.returnValue = false; } /** prefent the default behavior **/ console.log("NO ZOOMING");})
Mousetrap.bind(['mod+s','mod+p','mod+p'], function(e) {if (e.preventDefault) { e.preventDefault(); } else { /** internet explorer **/ e.returnValue = false; } /** prefent the default behavior **/})

function bindKeys() {
  Mousetrap.bind('+', function() {redraw(layout.ls.increaseSize());}, 'keydown');
  Mousetrap.bind('-', function() {redraw(layout.ls.decreaseSize());}, 'keydown');

  Mousetrap.bind('down', function() {layout.ls.removeRow(); redraw();}, 'keydown');
  Mousetrap.bind('alt+down', function(e) {e.preventDefault(); e.stopPropagation(); layout.ls.latchRowsClosed(); redraw();}, 'keydown');
  Mousetrap.bind('up', function() {layout.ls.addRow(); redraw();}, 'keydown');
  Mousetrap.bind('alt+up', function(e) {e.preventDefault(); e.stopPropagation(); layout.ls.latchRowsOpen(); redraw();}, 'keydown');

  Mousetrap.bind('left', function() {lessLetters(); redraw();}, 'keydown');
  Mousetrap.bind('alt+left', function(e) {e.preventDefault(); e.stopPropagation(); latchColumnsClosed(); redraw();}, 'keydown');
  Mousetrap.bind('right', function() {moreLetters(); redraw();}, 'keydown');
  Mousetrap.bind('alt+right', function(e) {e.preventDefault(); e.stopPropagation(); latchColumnsOpen(); redraw();}, 'keydown');

  Mousetrap.bind('.', function(e) {e.preventDefault(); e.stopPropagation(); layout.ls.latchRowsClosed(); latchColumnsClosed(); redraw();}, 'keydown');
  Mousetrap.bind('=', function(e) {e.preventDefault(); e.stopPropagation(); layout.ls.latchRowsClosed(); latchColumnsOpen(); redraw();}, 'keydown');
  Mousetrap.bind('/', function(e) {e.preventDefault(); e.stopPropagation(); layout.ls.latchRowsOpen();   latchColumnsClosed(); redraw();}, 'keydown');
  Mousetrap.bind('_', function(e) {e.preventDefault(); e.stopPropagation(); layout.ls.latchRowsOpen();   latchColumnsOpen(); redraw();}, 'keydown');
}
function unbindKeys() {
  Mousetrap.unbind('+', 'keydown'); Mousetrap.unbind('-', 'keydown');
  Mousetrap.unbind('down', 'keydown'); Mousetrap.unbind('alt+down', 'keydown'); Mousetrap.unbind('up', 'keydown'); Mousetrap.unbind('alt+up', 'keydown');
  Mousetrap.unbind('left', 'keydown'); Mousetrap.unbind('alt+left', 'keydown'); Mousetrap.unbind('right', 'keydown'); Mousetrap.unbind('alt+right', 'keydown');
  Mousetrap.unbind('.', 'keydown'); Mousetrap.unbind('=', 'keydown'); Mousetrap.unbind('/', 'keydown'); Mousetrap.unbind('_', 'keydown');
}
bindKeys();

function getMetric(feet) {
  return feet*3/10;
}

function updateMirrored() {localStorage.mirrored = mir;}

//localStorage Graveyard
function localStorageGraveyard() {
  var array = ["rowLimit","labelVisibility"];
  for (var i = 0; i < array.length; i++) {
    localStorage.removeItem(array[i]);
  }
}
localStorageGraveyard(); // Trash unused localStorage Variables
function localStorageEmpty() {
  localStorage.clear()
}

Mousetrap.bind('b', function() {toggleBalance(); redraw();});
function toggleBalance() {
  balance = !balance;
  sessionStorage.balance = balance;
}
function drawBalance() {
  if(balance) {
    c.fillStyle="red";
    c.fillRect(-canv.width/2, -canv.height/2, canv.width/2, canv.height);
    c.fillStyle="green";
    c.fillRect(0, -canv.height/2, canv.width/2, canv.height);
  }
}
