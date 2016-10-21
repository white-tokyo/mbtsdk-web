'use strict'

function Angle(degree) {
  const normalize = (degree) => { //角度を0<=angle<360に正規化
    if (degree < 0) {
      return normalize(degree + 360);
    }
    if (degree >= 360) {
      return normalize(degree - 360);
    }
    return degree;
  };

  this.degree = normalize(degree);
  this.abs = () => {
    return Math.abs(this.degree180());
  }
  this.degree180 = () => {
    if (this.degree > 180) {
      return 360 - this.degree;
    } else {
      return this.degree;
    }
  };

  this.angleBlock = () => {
    if (0 <= this.degree && this.degree < 90) {
      return "UpperRight";
    } else
    if (90 <= this.degree && this.degree < 180) {
      return "UpperLeft";
    } else if (180 <= this.degree && this.degree < 270) {
      return "LowerLeft";
    } else {
      return "LowerRight";
    }
  };

  this.add = (other) => {
    return Angle.prototype.add(this, other);
  }
  this.sub = (other) => {
    return Angle.prototype.sub(this, other);
  }
}

Angle.prototype.add = (a, b) => {
  return new Angle(a.degree + b.degree);
}
Angle.prototype.sub = (a, b) => {
  return new Angle(a.degree - b.degree);
}

export default Angle;
