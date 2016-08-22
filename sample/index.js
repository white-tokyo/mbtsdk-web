'use strict';

function SetupState(mbt, option, setupCompletedCallback, setupProgressCallback) {
  var _this = this;

  var rightLimitHistory = [];
  var leftLimitHistory = [];
  var leftLimit = 100000;
  var rightLimit = -1;
  var touchBeganPos = -1;
  var completed = false;
  var setupStageLimit = option.setupStageLimit || 10; //終了回数
  var setupTorrelance = option.setupTorrelance || 5; //終了判定許容誤差
  var setupThreshould = option.setupThreshould || 20; // セットアップがタップで進む現象の回避

  var checkCompleted = function checkCompleted() {
    if (rightLimitHistory.length != setupStageLimit) {
      return false;
    }

    var r_max = Math.max.apply(null, rightLimitHistory);
    var r_min = Math.min.apply(null, rightLimitHistory);
    console.log("rmax: " + r_max + " ,r_min: " + r_min);
    if (r_max - r_min > setupTorrelance) {
      mbt.test("r miss");
      return false;
    }
    var l_max = Math.max.apply(null, leftLimitHistory);
    var l_min = Math.min.apply(null, leftLimitHistory);
    console.log("l_max: " + l_max + " ,l_min: " + l_min);
    if (l_max - l_min > setupTorrelance) {
      mbt.test("l miss");
      return false;
    }
    return true;
  };
  var checkLimit = function checkLimit(position) {
    rightLimit = Math.max(position, rightLimit);
    leftLimit = Math.min(position, leftLimit);

    //append History
    rightLimitHistory.push(rightLimit);
    leftLimitHistory.push(leftLimit);
    if (rightLimitHistory.length > setupStageLimit) {
      rightLimitHistory.shift();
    }
    if (leftLimitHistory.length > setupStageLimit) {
      leftLimitHistory.shift();
    }
    if (typeof setupProgressCallback === "function") {
      setupProgressCallback();
    };

    // complete check.
    if (checkCompleted()) {
      if (typeof setupCompletedCallback === "function") {
        setupCompletedCallback(leftLimit, rightLimit);
        completed = true;
        _this.mousedown = function () {};
        _this.mousemove = function () {};
        _this.mouseup = function () {};
      }
    }
  };

  this.mousedown = function (position) {
    touchBeganPos = position;
  };
  this.mousemove = function (position) {};
  this.mouseup = function (position) {
    if (Math.abs(touchBeganPos - position) < setupThreshould) {
      console.log("threshould");
      return;
    }
    console.log("setup progress");
    checkLimit(touchBeganPos);
    checkLimit(position);
  };
}

function MBT(option, target) {
  var _this2 = this;

  this.eventNames = { Tap: "Tap", DoubleTap: "DoubleTap" };
  this.option = option;
  this.target = target;

  this._eventListeners = { Tap: [], DoubleTap: [] }; // eventName:callback array dictionary.

  this.addListener = function (eventName, callback) {
    if (!_this2._eventListeners[eventName]) {
      _this2._eventListeners[eventName] = [];
    }
    _this2._eventListeners[eventName].push(callback);
  };

  var _removeListener = function _removeListener(eventName, callback) {
    if (!_this2._eventListeners[eventName]) {
      return;
    }
    _this2._eventListeners[eventName].remove(callback);
    if (_this2._eventListeners[eventName].length === 0) {
      delete _this2._eventListeners[eventName];
    }
  };

  var invoke = function invoke(eventName, args) {
    var listeners = _this2._eventListeners[eventName];
    if (listeners) {
      listeners.forEach(function (listener) {
        listener.apply(_this2, args);
      });
    }
  };

  // ------- registration --------

  // setup or detect state.
  var _state = null;

  /**
   * セットアップの開始
   * @param  {[type]} doneCallback [description]
   * @return {[type]}              [description]
   */
  this.setup = function (doneCallback, progressCallback) {
    var _this3 = this;

    //TODO:再セットアップできるように。そのときdetectStateに参照が残らないように
    var completeCallback = function completeCallback(leftLimit, rightLimit) {
      console.log("completeCallback");
      _this3.leftLimit = leftLimit;
      _this3.rightLimit = rightLimit;
      // _state = new DetectState(this,{},invoke);
      // invoke("setupCompleted",[]);
      doneCallback();
    };
    _state = new SetupState(this, {}, completeCallback, progressCallback);
  };

  // logic


  this.test = function (arg) {
    invoke("test", [arg]);
  };

  //detection click event
  this.target.addEventListener("touchstart", function (e) {
    // var x = e.pageX ;
    var x = e.changedTouches[0].pageX;
    // console.log("mousedown");
    // invoke("test",["mousedown"]);
    _state.mousedown(x);
  });
  this.target.addEventListener("mousedown", function (e) {
    var x = e.pageX;
    _state.mousedown(x);
  });

  this.target.addEventListener("touchend", function (e) {
    // console.log("mouseup");
    // invoke("test",["mouseup"]);
    _state.mouseup(e.changedTouches[0].pageX);
  });
  this.target.addEventListener("mouseup", function (e) {
    _state.mouseup(e.pageX);
  });

  this.target.addEventListener("touchmove", function (e) {
    var x = e.changedTouches[0].pageX;
    // invoke("test",["mousemove"]);
    _state.mousemove(x);
  });
  this.target.addEventListener("mousemove", function (e) {
    var x = e.pageX;
    // invoke("test",["mousemove"]);
    _state.mousemove(x);
  });
}
window.MilboxTouch = MBT;
