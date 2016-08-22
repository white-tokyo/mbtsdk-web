'use strict'

import Angle from "./Angle";

// イベントを検出するステート
function DetectState(mbt, option, invoke) {
  var tapDetectTolerance = option.tapDetectTolerance || 10;
  var tapDetectDuration = option.tapDetectDuration || 10;
  var doubleTapDetectTolerance = option.doubleTapDetectTolerance || 10;

  var tapStartAngle = 0; // タップ開始位置の記録
  var tapStartTime = 0; //タップ開始時間の記録

  //for detect doubleTap
  var lastTapAnglePosition = 0;//最終タップ位置
  var lastTapTime = 0;//最終タップ時間

  //for detect scrollBegan,scrollEnd.
  var scrolled = false;//スクロールフラグ
  var lastMovePosition = 0;

  function checkTap(endPos) { //タップしたか確認
    //タップ検出誤差より小さく動き
    //タップ時間より短い時間で.

    const b = Math.abs(tapStartAngle.sub(endPos).range()) < tapDetectTolerance;
    const t = new Date().getTime() - tapStartTime < tapDetectDuration;
    return b && t;
  }

  function checkDoubleTap(endPos) {
    const checkDist = Math.abs(tapStartAngle.sub(endPos).range()) < tapDetectTolerance;
    const checkTime = new Date().getTime() - lastTapTime < doubleTapDetectTolerance;
    return checkDist && checkTime;
  }

  function checkSwipe(pos) {

     //タップ検出誤差より大きく動き
     //タップ時間より短い時間で、

    var angleCheck = Math.abs(tapStartAngle.sub(pos).range()) > tapDetectTolerance;
    var timeCheck = new Date().getTime() - tapStartTime < tapDetectDuration;
    if (angleCheck && timeCheck) {
      return new Swipe(tapStartAngle, pos, new Date().getTime() - tapStartTime);
    }
    return null;
  }



  this.mousedown = (position) => {
    this.tapStartTime = new Date();
    this.tapStartAngle = Angle.prototype.positionToAngle(position);
  }
  this.mousemove = (position) => {
    const currentPos = Angle.prototype.positionToAngle(position);
    const delta = currentPos.sub(lastMovePosition);
    var deltaScale = Math.abs(delta.range());

    if (0.3 < deltaScale && deltaScale < 30) {
      //detect scroll

      if (!scrolled) {
        scrolled = true;
        invoke("ScrollBegan", []);
      }

      invoke("Scroll", [delta]);
    }
  }
  this.mouseup = (position) => {
    var anglePosition = Angle.prototype.positionToAngle(position);

    //check scroll has ended.
    if (scrolled) {
      scrolled = false;
      invoke("ScrollEnded", [])
    }

    //check tap action detected.
    if (checkTap(anglePosition)) {
      //check tap is double tap.
      if (checkDoubleTap(anglePosition)) {
        invoke("DoubleTap", [anglePosition]);
        lastTapAnglePosition = 0;
        lastTapTime = 0;
      } else {
        invoke("Tap", [anglePosition]);
        lastTapAnglePosition = anglePosition;
        lastTapTime = new Date();
      }
    } else {
      //check swipe action is detected.
      var swipe = checkSwipe(anglePosition);
      if (swipe) {
        invoke("Swipe", [swipe.getSpeed(), swipe.getDuration()]);
      }
    }


  }
}

export default DetectState;
