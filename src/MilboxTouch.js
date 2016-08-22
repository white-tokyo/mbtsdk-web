'use strict'

import SetupState from "./SetupState";
import DetectState from "./DetectState";
import Angle from "./Angle"

function MBT(option,target){
  this.eventNames = {Tap:"Tap",DoubleTap:"DoubleTap"}
  this.option = option;
  this.target = target;

  this._eventListeners = {Tap:[],DoubleTap:[]}; // eventName:callback array dictionary.

  this.addListener = (eventName,callback)=>{
    if(!this._eventListeners[eventName]){
      this._eventListeners[eventName] = [];
    }
    this._eventListeners[eventName].push(callback);
  }

  const _removeListener = (eventName,callback) => {
    if(!this._eventListeners[eventName]){
      return;
    }
    this._eventListeners[eventName].remove(callback);
    if(this._eventListeners[eventName].length === 0){
      delete this._eventListeners[eventName];
    }
  }

  const invoke = (eventName,args)=>{
    const listeners = this._eventListeners[eventName];
    if(listeners){
      listeners.forEach((listener)=>{
        listener.apply(this,args);
      });
    }
  }

  // ------- registration --------

  // setup or detect state.
  var _state = null;

  /**
   * セットアップの開始
   * @param  {[type]} doneCallback [description]
   * @return {[type]}              [description]
   */
  this.setup=function(doneCallback,progressCallback){//TODO:再セットアップできるように。そのときdetectStateに参照が残らないように
    const completeCallback = (leftLimit,rightLimit)=>{
      console.log("completeCallback");
      this.leftLimit = leftLimit;
      this.rightLimit = rightLimit;
      // _state = new DetectState(this,{},invoke);
      // invoke("setupCompleted",[]);
      doneCallback();
    };
    _state = new SetupState(this,{},completeCallback,progressCallback);
  }

  // logic



  this.test = (arg)=>{
    invoke("test",[arg]);
  }

  //detection click event
  this.target.addEventListener("touchstart", (e)=>{
    // var x = e.pageX ;
    var x= e.changedTouches[0].pageX
    // console.log("mousedown");
    // invoke("test",["mousedown"]);
    _state.mousedown(x)
  });
  this.target.addEventListener("mousedown", (e)=>{
    var x= e.pageX
    _state.mousedown(x)
  });

  this.target.addEventListener("touchend", (e)=>{
    // console.log("mouseup");
      // invoke("test",["mouseup"]);
    _state.mouseup(e.changedTouches[0].pageX);
  });
  this.target.addEventListener("mouseup", (e)=>{
    _state.mouseup(e.pageX);
  });

  this.target.addEventListener("touchmove", (e)=>{
    var x= e.changedTouches[0].pageX
      // invoke("test",["mousemove"]);
    _state.mousemove(x)
  });
  this.target.addEventListener("mousemove", (e)=>{
    var x= e.pageX
      // invoke("test",["mousemove"]);
    _state.mousemove(x)
  });
}
window.MilboxTouch = MBT;

export default MBT;
