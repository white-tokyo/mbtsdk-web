const AngleBlock ={
  UpperRight:0,
  UpperLeft:1,
  LowerRight:3,
  LowerLeft:2
}
function checkAngleBlock(angle){
  if (0 <= angle && angle < 90) {
    return AngleBlock.UpperRight;
  }else if (90 <= angle && angle < 180) {
    return AngleBlock.UpperLeft;
  }else if (180 <= angle && angle < 270) {
    return AngleBlock.LowerLeft;
    }
  return AngleBlock.LowerRight;
}

function Swipe(startAnglePosition,endAnglePosition,timeDuration){
  const startAnglePosition = startAnglePosition;
	const endAnglePosition = endAnglePosition;
	const timeDuration = timeDuration;

  this.getSpeed=function(){
    return Math.abs(endAnglePosition - startAnglePosition) / timeDuration;
  }
  this.getDuration = function(){
    const s = checkAngleBlock (startAnglePosition);
    const e = checkAngleBlock (endAnglePosition);
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
      }else if (e == AngleBlock.LowerRight) {
        return SwipeDirection.Down;
      }
      break;
    case AngleBlock.LowerLeft:
      if (e == AngleBlock.UpperLeft) {
        return SwipeDirection.Up;
      }else if (e == AngleBlock.LowerRight) {
        return SwipeDirection.Right;
      }
      break;
    case AngleBlock.LowerRight:
      if (e == AngleBlock.UpperRight) {
        return SwipeDirection.Up;
      }else if (e == AngleBlock.LowerLeft) {
        return SwipeDirection.Left;
      }
      break;
    }
    return startAnglePosition > endAnglePosition ? SwipeDirection.Right : SwipeDirection.Left;
  }



}

export default Swipe;
