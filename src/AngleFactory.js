'use strict';
import Angle from "./Angle";

function AngleFactory(leftBounds, rightBounds) {
  this.leftBounds = leftBounds;
  this.rightBounds = rightBounds;
  this.toAngle = (pos) => {
    if (pos < this.leftBounds) {
      pos = this.leftBounds;
    } else if (this.rightBounds < pos) {
      pos = this.rightBounds;
    }
    var dir = pos - this.leftBounds;
    var limit = this.rightBounds - this.leftBounds;
    var rate = dir / limit;
    var correction = 170;
    var angle = rate * 360 + correction;
    return new Angle(angle);
  }

  this.toAngleDelta = (delta) => {
    var limit = this.rightBounds - this.leftBounds;
    var rate = delta / limit;
    var angle = rate * 360;
    return new Angle(angle);
  }
}


export default AngleFactory;
