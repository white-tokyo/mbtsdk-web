'use strict'

import Angle from "./Angle";
import Swipe from "./Swipe";

// イベントを検出するステート
function DetectState(mbt, option, invoke) {
  console.log("detectstate construct")
  var tapDetectTolerance = option.tapDetectTolerance || 10;
  var tapDetectDuration = option.tapDetectDuration || 1000;
  var doubleTapDetectTolerance = option.doubleTapDetectTolerance || 500;

  var tapStartAngle = 0; // タップ開始位置の記録
  var tapStartTime = 0; //タップ開始時間の記録

  //for detect doubleTap
  var lastTapAngle = null;//最終タップ位置
  var lastTapTime = 0;//最終タップ時間

  //for detect scrollBegan,scrollEnd.
  var scrolled = false;//スクロールフラグ
  var lastMovePosition = 0;

  function checkTap(endPos) { //タップしたか確認
    //タップ検出誤差より小さく動き
    //タップ時間より短い時間で.

    const b = Math.abs(tapStartAngle.sub(endPos).range()) < tapDetectTolerance;
    const duration = new Date().getTime()-tapStartTime;
    const t = duration < tapDetectDuration;
    return b && t;
  }

  function checkDoubleTap(endPos) {
    if(!lastTapAngle){
      return false;
    }
    const checkDist = Math.abs(lastTapAngle.sub(endPos).range()) < tapDetectTolerance;
    const duration = new Date().getTime() - lastTapTime;
    const checkTime = duration < doubleTapDetectTolerance;
    return checkDist && checkTime;
  }

  function checkSwipe(pos) {

     //タップ検出誤差より大きく動き
     //タップ時間より短い時間で、

    var angleCheck = Math.abs(tapStartAngle.sub(pos).range()) > tapDetectTolerance;
    const duration = new Date().getTime() - tapStartTime;
    var timeCheck = duration < tapDetectDuration;
    if (angleCheck && timeCheck) {
      return new Swipe(tapStartAngle, pos, duration);
    }
    return null;
  }



  this.mousedown = (position) => {
    tapStartTime = new Date().getTime();
    tapStartAngle = Angle.prototype.positionToAngle(position,mbt);
  }
  this.mousemove = (position) => {
    const currentPos = Angle.prototype.positionToAngle(position,mbt);
    const delta = lastMovePosition ? currentPos.sub(lastMovePosition):new Angle(0);
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
  }
  this.mouseup = (position) => {
    var anglePosition = Angle.prototype.positionToAngle(position,mbt);

    //check scroll has ended.
    if (scrolled) {
      scrolled = false;
      invoke("scrollended")
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


  }
}

export default DetectState;
