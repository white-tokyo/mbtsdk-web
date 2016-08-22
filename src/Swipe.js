const AngleBlock = {
  UpperRight: 0,
  UpperLeft: 1,
  LowerRight: 3,
  LowerLeft: 2
}
const SwipeDirection = {
  Right: "right",
  Left: "left",
  Up: "up",
  Down: "down"
}

function checkAngleBlock(angle) {
  const degree = angle.degree;
  if (0 <= degree && degree < 90) {
    return AngleBlock.UpperRight;
  } else if (90 <= degree && degree < 180) {
    return AngleBlock.UpperLeft;
  } else if (180 <= degree && degree < 270) {
    return AngleBlock.LowerLeft;
  }
  return AngleBlock.LowerRight;
}

function Swipe(startAnglePosition, endAnglePosition, timeDuration) {

  this.getSpeed = function() {
    return Math.abs(endAnglePosition.sub(startAnglePosition).range()) / timeDuration;
  }
  this.getDirection = function() {
    const s = checkAngleBlock(startAnglePosition);
    const e = checkAngleBlock(endAnglePosition);
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
  }



}

export default Swipe;
