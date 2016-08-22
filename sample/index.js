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
    if (!completed && checkCompleted()) {
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

function Angle(position) {
  var _this2 = this;

  this.degree = position;
  this.normalize = function () {
    //角度を0<=angle<360に正規化
    while (true) {
      if (_this2.degree >= 360) {
        _this2.degree = _this2.degree - 360;
        continue;
      }
      if (_this2.degree < 0) {
        _this2.degree = _this2.degree + 360;
        continue;
      }
      return;
    }
  };
  this.add = function (other) {
    return Angle.prototype.add(_this2, other);
  };
  this.sub = function (other) {
    return Angle.prototype.sub(_this2, other);
  };
  this.range = function () {
    if (_this2.degree >= 180) {
      return _this2.degree - 360;
    }
    return _this2.degree;
  };
  this.normalize();
} //TODO:Angle.prototypeにMBT参照追加

//convert position to angle degree.
Angle.prototype.positionToAngle = function (position, mbt) {
  //タップ位置の角度計算
  if (position < mbt.leftLimit) {
    position = mbt.leftLimit;
  } else if (mbt.rightLimit < position) {
    position = mbt.rightLimit;
  }

  var dir = position - mbt.leftLimit;
  var angleDelta = Angle.prototype.deltaToAngleDelta(dir, mbt);
  var correction = new Angle(170);
  var angle = angleDelta.add(correction);
  return angle;
};

Angle.prototype.deltaToAngleDelta = function (delta, mbt) {
  //位置の差分から角度差を算出
  var limitSpan = mbt.rightLimit - mbt.leftLimit;
  var rate = delta / limitSpan;
  var angle = rate * 360;
  return new Angle(angle);
};

Angle.prototype.add = function (a, b) {
  return new Angle(a.degree + b.degree);
};
Angle.prototype.sub = function (a, b) {
  return new Angle(a.degree - b.degree);
};

var AngleBlock = {
  UpperRight: 0,
  UpperLeft: 1,
  LowerRight: 3,
  LowerLeft: 2
};
var SwipeDirection = {
  Right: 0,
  Left: 1,
  Up: 2,
  Down: 3
};
function checkAngleBlock(angle) {
  if (0 <= angle && angle < 90) {
    return AngleBlock.UpperRight;
  } else if (90 <= angle && angle < 180) {
    return AngleBlock.UpperLeft;
  } else if (180 <= angle && angle < 270) {
    return AngleBlock.LowerLeft;
  }
  return AngleBlock.LowerRight;
}

function Swipe(startAnglePosition, endAnglePosition, timeDuration) {

  this.getSpeed = function () {
    return Math.abs(endAnglePosition.sub(startAnglePosition).range) / timeDuration;
  };
  this.getDirection = function () {
    var s = checkAngleBlock(startAnglePosition);
    var e = checkAngleBlock(endAnglePosition);
    switch (s) {
      case AngleBlock.UpperLeft:
        if (e == AngleBlock.UpperRight) {
          return SwipeDirection.Right;
        } else if (e == AngleBlock.LowerLeft) {
          return SwipeDirection.Down;
        }
        break;
      case AngleBlock.UpperRight:
        if (e == AngleBlock.UpperLeft) {
          return SwipeDirection.Left;
        } else if (e == AngleBlock.LowerRight) {
          return SwipeDirection.Down;
        }
        break;
      case AngleBlock.LowerLeft:
        if (e == AngleBlock.UpperLeft) {
          return SwipeDirection.Up;
        } else if (e == AngleBlock.LowerRight) {
          return SwipeDirection.Right;
        }
        break;
      case AngleBlock.LowerRight:
        if (e == AngleBlock.UpperRight) {
          return SwipeDirection.Up;
        } else if (e == AngleBlock.LowerLeft) {
          return SwipeDirection.Left;
        }
        break;
    }
    return startAnglePosition > endAnglePosition ? SwipeDirection.Right : SwipeDirection.Left;
  };
}

// イベントを検出するステート
function DetectState(mbt, option, invoke) {
  console.log("detectstate construct");
  var tapDetectTolerance = option.tapDetectTolerance || 10;
  var tapDetectDuration = option.tapDetectDuration || 1000;
  var doubleTapDetectTolerance = option.doubleTapDetectTolerance || 500;

  var tapStartAngle = 0; // タップ開始位置の記録
  var tapStartTime = 0; //タップ開始時間の記録

  //for detect doubleTap
  var lastTapAngle = null; //最終タップ位置
  var lastTapTime = 0; //最終タップ時間

  //for detect scrollBegan,scrollEnd.
  var scrolled = false; //スクロールフラグ
  var lastMovePosition = 0;

  function checkTap(endPos) {
    //タップしたか確認
    //タップ検出誤差より小さく動き
    //タップ時間より短い時間で.

    var b = Math.abs(tapStartAngle.sub(endPos).range()) < tapDetectTolerance;
    var duration = new Date().getTime() - tapStartTime;
    var t = duration < tapDetectDuration;
    return b && t;
  }

  function checkDoubleTap(endPos) {
    if (!lastTapAngle) {
      return false;
    }
    var checkDist = Math.abs(lastTapAngle.sub(endPos).range()) < tapDetectTolerance;
    var duration = new Date().getTime() - lastTapTime;
    var checkTime = duration < doubleTapDetectTolerance;
    return checkDist && checkTime;
  }

  function checkSwipe(pos) {

    //タップ検出誤差より大きく動き
    //タップ時間より短い時間で、

    var angleCheck = Math.abs(tapStartAngle.sub(pos).range()) > tapDetectTolerance;
    var duration = new Date().getTime() - tapStartTime;
    var timeCheck = duration < tapDetectDuration;
    if (angleCheck && timeCheck) {
      return new Swipe(tapStartAngle, pos, duration);
    }
    return null;
  }

  this.mousedown = function (position) {
    tapStartTime = new Date().getTime();
    tapStartAngle = Angle.prototype.positionToAngle(position, mbt);
  };
  this.mousemove = function (position) {
    var currentPos = Angle.prototype.positionToAngle(position, mbt);
    var delta = lastMovePosition ? currentPos.sub(lastMovePosition) : new Angle(0);
    lastMovePosition = currentPos;
    var deltaScale = Math.abs(delta.range());

    if (0.3 < deltaScale && deltaScale < 30) {
      //detect scroll

      if (!scrolled) {
        scrolled = true;
        invoke("scrollbegan");
      }

      invoke("scroll", [delta.range()]);
    }
  };
  this.mouseup = function (position) {
    var anglePosition = Angle.prototype.positionToAngle(position, mbt);

    //check scroll has ended.
    if (scrolled) {
      scrolled = false;
      invoke("scrollended");
    }

    //check tap action detected.
    if (checkTap(anglePosition)) {
      //check tap is double tap.
      if (checkDoubleTap(anglePosition)) {
        invoke("doubletap", [anglePosition]);
        lastTapAngle = null;
        lastTapTime = 0;
      } else {
        invoke("tap", [anglePosition]);
        lastTapAngle = anglePosition;
        lastTapTime = new Date().getTime();
      }
    } else {
      //check swipe action is detected.
      var swipe = checkSwipe(anglePosition);
      if (swipe) {
        invoke("swipe", [swipe.getSpeed(), swipe.getDirection()]);
      }
    }
  };
}

function MBT(option, target) {
  var _this3 = this;

  this.option = option;
  this.target = target;

  this._eventListeners = { Tap: [], DoubleTap: [] }; // eventName:callback array dictionary.

  this.addListener = function (eventName, callback) {
    if (!_this3._eventListeners[eventName]) {
      _this3._eventListeners[eventName] = [];
    }
    _this3._eventListeners[eventName].push(callback);
  };

  var _removeListener = function _removeListener(eventName, callback) {
    if (!_this3._eventListeners[eventName]) {
      return;
    }
    _this3._eventListeners[eventName].remove(callback);
    if (_this3._eventListeners[eventName].length === 0) {
      delete _this3._eventListeners[eventName];
    }
  };

  var invoke = function invoke(eventName, args) {
    var listeners = _this3._eventListeners[eventName];
    if (listeners) {
      listeners.forEach(function (listener) {
        listener.apply(_this3, args);
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
    var _this4 = this;

    //TODO:再セットアップできるように。そのときdetectStateに参照が残らないように
    var completeCallback = function completeCallback(leftLimit, rightLimit) {
      console.log("completeCallback");
      _this4.leftLimit = leftLimit;
      _this4.rightLimit = rightLimit;
      _state = new DetectState(_this4, {}, invoke);
      doneCallback();
    };
    _state = new SetupState(this, {}, completeCallback, progressCallback);
  };

  // logic


  this.test = function (arg) {
    invoke("test", [arg]);
  };

  //detection click event
  var tapFlag = false;
  this.target.addEventListener("touchstart", function (e) {
    // var x = e.pageX ;
    var x = e.changedTouches[0].pageX;
    tapFlag = true;
    _state.mousedown(x);
  });
  this.target.addEventListener("mousedown", function (e) {
    tapFlag = true;
    var x = e.pageX;
    _state.mousedown(x);
  });

  this.target.addEventListener("touchend", function (e) {
    // console.log("mouseup");
    // invoke("test",["mouseup"]);
    _state.mouseup(e.changedTouches[0].pageX);
    tapFlag = false;
  });
  this.target.addEventListener("mouseup", function (e) {
    tapFlag = false;
    _state.mouseup(e.pageX);
  });

  this.target.addEventListener("touchmove", function (e) {
    if (!tapFlag) {
      return;
    }
    var x = e.changedTouches[0].pageX;
    // invoke("test",["mousemove"]);
    _state.mousemove(x);
  });
  this.target.addEventListener("mousemove", function (e) {
    if (!tapFlag) {
      return;
    }
    var x = e.pageX;
    // invoke("test",["mousemove"]);
    _state.mousemove(x);
  });
}
window.MilboxTouch = MBT;
