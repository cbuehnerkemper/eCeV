function rowset(rowdata) {
  if (!(this instanceof rowset)) return new rowset(rowdata);
  var hold = [];
  if (typeof rowdata === 'string') {
    for (var j = 0; j < rowdata.length; j+=14) {
      hold.push(rowdata.slice(j,j+14).trim());
    }
  } else {
    hold.push(rowdata[0]);
    hold.push(rowdata[1]);
  }
  this.size = Number(hold[0]);
  this.letters = hold.slice(1);
  this.getFontSize = function() { // convert lettersize to fontsize
    return this.size;
  };
  this.getFontWidth = function() {
    return Math.ceil(Number(localStorage.xscale)*(this.size/200));
  }
  this.getFontHeight = function() {
    return Math.ceil(Number(localStorage.yscale)*(this.size/200));
  }
  for (var i = 0; i < this.letters.length; i++) {
    this.letters[i] = this.letters[i].split("");
  }
}

function letterset(constObj) {
  if (!(this instanceof letterset)) return new letterset(constObj);
  this.description = constObj[0];
  this.rows = Number(constObj[1].slice(1, 3).trim());
  this.sets = Number(constObj[1].slice(15, 17).trim());
  this.acuityNotationBase = Number(constObj[1].slice(29).trim());
  this.rowset = [];
  this.letterset = [];
  for (var i = 2; i < this.rows+2; i++) {
    this.rowset.push(new rowset(constObj[i]));
    this.letterset.push(this.rowset[i-2].letters);
  }
  this.letterset = _.uniq(_.flatten(this.letterset, false));
  this.top = Math.floor((this.rows-1)/2)-1;
  this.btm = (this.top+3>this.rowset.length ? this.top : this.top+3);
  this.currentSet = 0;
  this.getLetterRows = function() {
    var ret = [];
    for (var i = this.top; i <= this.btm; i++) {
      ret.push(rowset([this.rowset[i].size, this.rowset[i].letters[this.currentSet].join("")]));
    }
    return ret;
  };
  this.nextSet = function() {
    if ((this.currentSet+=1)>=this.rowset[0].letters.length) {
      this.currentSet=0;
    };
    return this.getLetterRows();
  };
  this.getDisplayHeight = function(rows) {
    if(rows==null) {
      bottom = this.btm;
      //console.log(bottom);
    }
    else bottom = this.top+rows-1;
    var displayHeight = this.rowset[this.top].getFontHeight();
    for (var i = this.top, len=bottom; i <= len; i++) displayHeight += 2*this.rowset[i].getFontHeight();
    displayHeight -= this.rowset[bottom].getFontHeight();
    return displayHeight;
  };

  this.addRow = function(bypass) {
    sessionStorage.latchRows = 0;
    // console.log({function:"addRow", latchRows:sessionStorage.latchRows});
    if(bypass==null) bypass = false;
    if ((this.btm+=1)>=this.rowset.length) {
      this.btm=this.rowset.length-1;
    };
    if (this.btm-this.top >= getMaxRows()-1) {
      this.btm = this.top+getMaxRows()-1;
    }
    return this.getLetterRows();
  };
  this.latchRowsOpen = function() {
    sessionStorage.latchRows = 1;
    // console.log({function:"latchRowsOpen", latchRows:sessionStorage.latchRows});
    rows = Math.min(getMaxRows(), (this.rowset.length-this.top));
    this.btm = this.top+rows-1;
  };
  this.increaseRow = function() {
    if ((this.btm+=1)>=this.rowset.length) {
      this.btm=this.rowset.length-1;
    };
    if (this.btm-this.top >= getMaxRows()-1) {
      this.btm = this.top+getMaxRows()-1;
    }
  }

  this.removeRow = function(bypass) {
    sessionStorage.latchRows = 0;
    // console.log({function:"removeRow", latchRows:sessionStorage.latchRows});
    if(bypass==null) bypass = false;
    if ((this.btm-=1)<this.top) {
      this.btm=this.top;
    };
    return this.getLetterRows();
  };
  this.latchRowsClosed = function() {
    sessionStorage.latchRows = -1;
    // console.log({function:"latchRowsClosed", latchRows:sessionStorage.latchRows});
    this.btm=this.top;
  }
  this.decreaseRow = function() {
    if (Math.abs(sessionStorage.latchRows)==1) {
      if ((this.btm-=1)<this.top) {
        this.btm=this.top;
      };
    } else {
      if ((this.btm-=1)<this.top) {
        this.btm=this.top;
      };
    }
  }

  this.increaseSize = function() {
    // console.log({function:"increaseSize", latchRows:sessionStorage.latchRows});
    var rows = this.btm-this.top;
    if ((this.top-=1)<0) {
      this.top=0;
    };
    this.btm=this.top+rows;
    if (sessionStorage.latchRows==1) {
      this.latchRowsOpen();
    } else if (sessionStorage.latchRows==-1) {
      this.latchRowsClosed();
    }
    console.log({top:this.top, btm:this.btm});
    return this.getLetterRows();
  };
  this.decreaseSize = function() {
    // console.log({function:"decreaseSize", latchRows:sessionStorage.latchRows});
    var rows = this.btm-this.top;
    // if ((this.top+=1)+rows>this.rowset.length-1) {
    //   this.top-=1;
    // }
    if ((this.top+=1)>this.rowset.length-1) {
      this.top = this.rowset.length-1;
    }
    if (this.top+rows>this.rowset.length-1) {
      rows = (this.rowset.length-1)-this.top;
    }
    if (sessionStorage.latchRows == 1) {
      this.latchRowsOpen();
    }
    else if (sessionStorage.latchRows == -1) {
      this.latchRowsClosed();
    }
    else this.btm=this.top+rows;
    console.log({top:this.top, btm:this.btm});
    return this.getLetterRows();
  };
}

var lettersetoptions = [];
