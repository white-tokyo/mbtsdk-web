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
  this.getSpeed = function () {
    return Math.abs(endAnglePosition.sub(startAnglePosition).abs()) / timeDuration * 1000;
  }
  this.getDirection = function () {
    const s = startAnglePosition.angleBlock;
    const e = endAnglePosition.angleBlock;
    switch (s) {
    case "UpperLeft":
      if (e == "UpperRight") {
        return SwipeDirection.Right;
      } else if (e == "LowerLeft") {
        return SwipeDirection.Down;
      }
      break;
    case "UpperRight":
      if (e == "UpperLeft") {
        return SwipeDirection.Left;
      } else if (e == "LowerRight") {
        return SwipeDirection.Down;
      }
      break;
    case "LowerLeft":
      if (e == "UpperLeft") {
        return SwipeDirection.Up;
      } else if (e == "LowerRight") {
        return SwipeDirection.Right;
      }
      break;
    case "LowerRight":
      if (e == "UpperRight") {
        return SwipeDirection.Up;
      } else if (e == "LowerLeft") {
        return SwipeDirection.Left;
      }
      break;
    }
    return startAnglePosition > endAnglePosition ? SwipeDirection.Right : SwipeDirection.Left;
  }



}

export default Swipe;
