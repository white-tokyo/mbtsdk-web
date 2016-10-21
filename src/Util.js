'use strict'

var Util = {
  test1: function () {
    console.log("hello!!");
  },
  average: (list) => {
    return list.reduce((sum, element) => sum + element) / list.length;
  },
  takeLast: (list, count) => {
    var clone = list.concat();
    if (list.length <= count) {
      return clone;
    }
    clone.splice(0, list.length - count);
    return clone;
  },
  remove: (list, item) => {
    for (var i = 0; i < list.length; i++) {
      if (list[i] === item) {
        list.splice(i, 1);
        return;
      }
    }
  },
  max: (list) => {
    return list.reduce((max, current) => max > current ? max : current);
  },
  min: (list) => {
    return list.reduce((min, current) => min < current ? min : current);
  },
}

export default Util;
