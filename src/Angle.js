'use strict'
function Angle(position) {
  this.degree = position;
  this.normalize = () => { //角度を0<=angle<360に正規化
    while (true) {
      if (this.degree >= 360) {
        this.degree = this.degree - 360;
        continue;
      }
      if (this.degree < 0) {
        this.degree = this.degree + 360;
        continue;
      }
    }
  }
  this.add = (other) => {
    return Angle.add(this, other);
  }
  this.sub = (other) => {
    return Angle.sub(this, other);
  }
  this.range = () => {
    if (this.degree >= 180) {
      return this.degree - 360;
    }
    return this.degree;
  }
  this.normalize();
} //TODO:Angle.prototypeにMBT参照追加

//convert position to angle degree.
Angle.prototype.positionToAngle = function(position) { //タップ位置の角度計算
  if (position < mbt.leftLimit) {
    position = mbt.leftLimit;
  } else if (mbt.rightLimit < position) {
    position = mbt.rightLimit;
  }

  const dir = position - mbt.leftLimit;
  const angleDelta = Angle.prototype.deltaToAngleDelta(dir);
  const correction = 170;
  const angle = angleDelta + correction;
  return new Angle(angle);
}

Angle.prototype.deltaToAngleDelta = function(delta) { //位置の差分から角度差を算出
  const limitSpan = mbt.rightLimit - mbt.leftLimit;
  const rate = delta / limitSpan;
  const angle = rate * 360;
  return new Angle(angle);
}

Angle.prototype.add = (a, b) => {
  return new Angle(a.degree + b.degree);
}
Angle.prototype.sub = (a, b) => {
  return new Angle(a.degree - b.degree);
}

export default Angle;
