'use strict'

function SetupState(mbt, option, setupCompletedCallback, setupProgressCallback) {
  var rightLimitHistory = [];
  var leftLimitHistory = [];
  var leftLimit = 100000;
  var rightLimit = -1;
  var touchBeganPos = -1;
  var completed=false;
  const setupStageLimit = option.setupStageLimit || 10; //終了回数
  const setupTorrelance = option.setupTorrelance || 5; //終了判定許容誤差
  const setupThreshould = option.setupThreshould || 20; // セットアップがタップで進む現象の回避

  const checkCompleted = () => {
    if (rightLimitHistory.length != setupStageLimit) {
      return false;
    }

    var r_max = Math.max.apply(null, rightLimitHistory);
    var r_min = Math.min.apply(null, rightLimitHistory);
    console.log("rmax: " + r_max + " ,r_min: " + r_min);
    if (r_max - r_min > setupTorrelance) {
      mbt.test("r miss")
      return false;
    }
    var l_max = Math.max.apply(null, leftLimitHistory);
    var l_min = Math.min.apply(null, leftLimitHistory);
    console.log("l_max: " + l_max + " ,l_min: " + l_min);
    if (l_max - l_min > setupTorrelance) {
      mbt.test("l miss")
      return false;
    }
    return true;

  }
  const checkLimit = (position) =>{
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
    if(typeof setupProgressCallback === "function"){
      setupProgressCallback();
    };

    // complete check.
    if (!completed && checkCompleted()) {
      if(typeof setupCompletedCallback === "function"){
        setupCompletedCallback(leftLimit,rightLimit);
        completed = true;
        this.mousedown=()=>{}
        this.mousemove=()=>{}
        this.mouseup=()=>{}
      }
    }
  };


  this.mousedown = (position) => {
    touchBeganPos = position;
  };
  this.mousemove = (position) => {}
  this.mouseup = (position) => {
    if (Math.abs(touchBeganPos - position) < setupThreshould) {
      console.log("threshould")
      return;
    }
    console.log("setup progress")
    checkLimit(touchBeganPos);
    checkLimit(position);
  }
}

export default SetupState;
