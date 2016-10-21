'use strict';

import Rx from 'rx';
import SetupState from "./SetupState";
import DetectState from "./DetectState";
import Utils from "./Util";
import AngleFactory from "./AngleFactory";
import Angle from "./Angle";
import Swipe from "./Swipe";


Rx.Observable.prototype.list = function () {
  return this.scan((acc, current) => {
    var clone = acc.concat();
    if (clone.length > 15) {
      clone.splice(0, 1);
    }
    clone.push(current);
    return clone;
  }, []);
}
Rx.Observable.prototype.pre = function () {
  return this.scan((acc, current) => [acc[1], current], [null, null]);
}

const _ua = (function (u) {
  return {
    Tablet: (u.indexOf("windows") != -1 && u.indexOf("touch") != -1 && u.indexOf("tablet pc") == -1) ||
      u.indexOf("ipad") != -1 ||
      (u.indexOf("android") != -1 && u.indexOf("mobile") == -1) ||
      (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1) ||
      u.indexOf("kindle") != -1 ||
      u.indexOf("silk") != -1 ||
      u.indexOf("playbook") != -1,
    Mobile: (u.indexOf("windows") != -1 && u.indexOf("phone") != -1) ||
      u.indexOf("iphone") != -1 ||
      u.indexOf("ipod") != -1 ||
      (u.indexOf("android") != -1 && u.indexOf("mobile") != -1) ||
      (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1) ||
      u.indexOf("blackberry") != -1
  }
})(window.navigator.userAgent.toLowerCase());

function MBT(option, target) {
  this.option = option || {};
  this.target = target;

  this.setupStageLimit = this.option.setupStageLimit || 10; //終了回数
  this.setupTorrelance = this.option.setupTorrelance || 5; //終了判定許容誤差
  this.tapDetectTolerance = this.option.tapDetectTolerance || 10; //タップ検出距離誤差
  this.tapDetectDuration = this.option.tapDetectDuration || 300; //タップ検出時間誤差(ms)

  const _eventListeners = {}; // eventName:callback array dictionary.

  this.addListener = (eventName, callback) => {
    if (!_eventListeners[eventName]) {
      _eventListeners[eventName] = [];
    }
    _eventListeners[eventName].push(callback);
  };

  this.removeListener = (eventName, callback) => {
    if (!_eventListeners[eventName]) {
      return;
    }
    _eventListeners[eventName].remove(callback);
    if (_eventListeners[eventName].length === 0) {
      delete _eventListeners[eventName];
    }
  };

  const invoke = (eventName, args) => {
    const listeners = _eventListeners[eventName];
    if (listeners) {
      listeners.forEach((listener) => {
        listener.apply(this, args);
      });
    }
  }

  // ------- registration --------

  const onTapSubject = new Rx.Subject();
  const onDoubleTapSubject = new Rx.Subject();
  const onScrollBeganSubject = new Rx.Subject();
  const onScrollEndedSubject = new Rx.Subject();
  const onScrollSubject = new Rx.Subject();
  const onSwipeSubject = new Rx.Subject();

  const onSetupProgressSubject = new Rx.Subject();
  const onSetupCompletedSubject = new Rx.Subject();
  const touchBeganSubject = new Rx.Subject();
  const touchMovedSubject = new Rx.Subject();
  const touchEndedSubject = new Rx.Subject();

  onSetupProgressSubject.subscribe(() => { invoke("setupprogress"); });
  onSetupCompletedSubject.subscribe(() => { invoke("setupcompleted"); });
  onTapSubject.subscribe(() => { invoke("tap"); });
  onDoubleTapSubject.subscribe(() => { invoke("doubletap"); });
  onScrollBeganSubject.subscribe(() => { invoke("scrollbegan"); });
  onScrollSubject.subscribe((delta) => { invoke("scroll", [delta]); });
  onScrollEndedSubject.subscribe(() => { invoke("scrollended"); });
  onSwipeSubject.subscribe((swipe) => { invoke("swipe", [swipe.speed, swipe.direction]); });

  const subscriptions = [];
  this.reset = () => {
      subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      })
      subscriptions.length = 0;
    }
    /**
     * セットアップの開始
     * @param  {[type]} doneCallback [description]
     * @return {[type]}              [description]
     */
  this.setup = function () {
    //setup subscribe
    console.log("setupStart")
    this.reset();
    var angleFactory = new AngleFactory(500, 590);
    var upOrDown = Rx.Observable.merge(touchBeganSubject, touchEndedSubject);
    var moveOverBounds = touchMovedSubject.bufferWithCount(2, 1)
      .filter((val, index) => Math.abs(val[0] - val[1]) > 100)
      .flatMap((it) => Rx.Observable.of(it[0], it[1]));

    var setupSignal = Rx.Observable.merge(upOrDown, moveOverBounds);
    var average = setupSignal.list().map(list => Utils.average(list));
    var left = Rx.Observable.zip(setupSignal, average).filter(it => it[0] < it[1]).map(it => it[0]);
    var right = Rx.Observable.zip(setupSignal, average).filter(it => it[0] >= it[1]).map(it => it[0]);

    var leftFin = left.list().map(it => Utils.takeLast(it, 10))
      .doOnNext(x => { onSetupProgressSubject.onNext(null) }).filter(it => it.length == 10).filter(it => {
        var clone = it.concat();
        const max = Utils.max(clone);
        const min = Utils.min(clone);
        Utils.remove(clone, max);
        Utils.remove(clone, min);
        var diff = max - min;
        console.log("left diff: " + diff)
        return diff < 50;
      });
    var rightFin = right.list().map(it => Utils.takeLast(it, 10))
      .doOnNext(x => { onSetupProgressSubject.onNext(null) }).filter(it => it.length == 10).filter(it => {
        var clone = it.concat();
        const max = Utils.max(clone);
        const min = Utils.min(clone);
        Utils.remove(clone, max);
        Utils.remove(clone, min);
        var diff = max - min;
        console.log("right diff: " + diff)
        return diff < 50;
      });
    subscriptions.push(Rx.Observable.combineLatest(leftFin.timestamp(), rightFin.timestamp())
      .filter(it => Math.abs(it[0].timestamp - it[1].timestamp) < 5000).first().subscribe(it => {
        angleFactory.leftBounds = Utils.average(it[0].value);
        angleFactory.rightBounds = Utils.average(it[1].value);
        // console.log("aaa", "complete!! left:" + angleFactory.leftBounds + " right: " + angleFactory.rightBounds);
        onSetupCompletedSubject.onNext(null);
      }));


    var detectAngles = Rx.Observable.merge(touchBeganSubject.map(it => ["began", it]), touchMovedSubject.map(it => ["moved", it]), touchEndedSubject.map(it => ["ended", it]))
      .skipUntil(onSetupCompletedSubject).map(it => [it[0], angleFactory.toAngle(it[1])]).publish();
    var sequence = detectAngles.skipWhile(it => it[0] !== "began").takeUntil(detectAngles.debounce(50).filter(it => it[0] === "ended"));

    var seq_began = sequence.map(it => it[1]).filter((x, idx) => idx === 0).repeat().publish();
    var seq_move = sequence.skip(1).map(it => it[1]).repeat().publish();
    var seq_ended = sequence.last({ defaultValue: null }).filter(x => x).map(it => it[1]).repeat().publish();
    seq_began.connect();
    seq_move.connect();
    seq_ended.connect();
    detectAngles.connect();

    var tap = sequence.first({ defaultValue: null }).filter(x => x).timestamp()
      .zip(sequence.last({ defaultValue: null }).timestamp()).repeat()
      .filter(it => it[1].timestamp - it[0].timestamp < this.tapDetectDuration) //時間制限
      .filter(it => it[1].value[1].sub(it[0].value[1]).abs() < this.tapDetectTolerance) //移動距離制限
      .map(it => it[1]) //publish?

    subscriptions.push(tap.pre().map(it => {
      var preTime = it[0] ? it[0].timestamp : 0;
      var cond = it[1].timestamp - preTime < 500;
      return cond ? "doubleTap" : "tap";
    }).subscribe(it => {
      if (it === "tap") {
        onTapSubject.onNext(null)
      } else {
        onDoubleTapSubject.onNext(null)
      }
    }));

    var moveDelta = seq_move.pre().map(it => { return [it[1], it[1].sub(it[0] || it[1])] }); //move,moveDelta
    var scrollStart = moveDelta.map(it => it[1].degree180()).filter(deltaScale => 0.3 < Math.abs(deltaScale) && Math.abs(deltaScale) < 30);
    var scrollStroke = scrollStart.takeUntil(seq_ended);
    subscriptions.push(scrollStroke.take(1).doOnNext(it => {
      onScrollBeganSubject.onNext(null);
    }).zip(scrollStroke.count()).repeat().subscribe());
    subscriptions.push(scrollStroke.count().repeat().subscribe(it => {
      if (it !== 0) {
        onScrollEndedSubject.onNext(null);
      }
    }));
    subscriptions.push(scrollStroke.repeat().subscribe(delta => {
      onScrollSubject.onNext(delta)
    }));

    subscriptions.push(sequence.timestamp().toArray().repeat().filter(it => it.length >= 2).subscribe(it => {
      var startAngle = it[0].value[1];
      var endAngle = it[it.length - 1].value[1];
      var angleDelta = startAngle.sub(endAngle).abs();
      var timeDelta = it[it.length - 1].timestamp - it[0].timestamp;

      var positionCondition = angleDelta > this.tapDetectTolerance;
      var timeCondition = timeDelta < this.tapDetectDuration;
      if (positionCondition && timeCondition) { //swipe
        var swipe = new Swipe(startAngle, endAngle, timeDelta);
        onSwipeSubject.onNext({ speed: swipe.getSpeed(), direction: swipe.getDirection() });
      }
    }));
  }


  this.test = (arg) => {
    invoke("test", [arg]);
  }

  //detection click event
  var tapFlag = false;
  if (_ua.Mobile) {
    console.log("agent is mobile");
    this.target.addEventListener("touchstart", (e) => {
      // var x = e.pageX ;
      var x = e.changedTouches[0].pageX
      tapFlag = true;
      //_state.mousedown(x);
      touchBeganSubject.onNext(x);
    });
    this.target.addEventListener("touchmove", (e) => {
      if (!tapFlag) {
        return;
      }
      var x = e.changedTouches[0].pageX
        //_state.mousemove(x);
      touchMovedSubject.onNext(x);
    });
    this.target.addEventListener("touchend", (e) => {
      //_state.mouseup(e.changedTouches[0].pageX);
      touchEndedSubject.onNext(e.changedTouches[0].pageX);
      tapFlag = false;
    });
  } else {
    console.log("agent is not mobile")
    this.target.addEventListener("mousedown", (e) => {
      tapFlag = true;
      var x = e.pageX
        //_state.mousedown(x);
      touchBeganSubject.onNext(x);
    });
    this.target.addEventListener("mouseup", (e) => {
      tapFlag = false;
      //_state.mouseup(e.pageX);
      touchEndedSubject.onNext(e.pageX);
    });
    this.target.addEventListener("mousemove", (e) => {

      if (!tapFlag) {
        return;
      }
      touchMovedSubject.onNext(e.pageX);
      //_state.mousemove(e.pageX);
    });
  }
}
window.MilboxTouch = MBT;

export default MBT;
