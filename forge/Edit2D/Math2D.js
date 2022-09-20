
// Collection of simple helper functions for 2D math functions.

// Return normalized edge direction vector (b-a).normalized
var getEdgeDirection = function getEdgeDirection(a, b, target) {
  target = target || new THREE.Vector2();

  return target.copy(b).sub(a).normalize();
};

var getEdgeCenter = function getEdgeCenter(a, b, target) {
  target = target || new THREE.Vector2();

  return target.set(0.5 * (a.x + b.x), 0.5 * (a.y + b.y));
};

// Get edge length. (a, b) can just be {x, y} pairs, i.e., not required to be THREE.Vector2
var getEdgeLength = function getEdgeLength(a, b) {
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Rotates direction vector p 90 degrees to the left. (in-place)
var turnLeft = function turnLeft(p) {
  var tmp = p.x;
  p.x = -p.y;
  p.y = tmp;
  return p;
};

// Projects a point p to a line. Works in-place
//  @param {Vector2} p
//  @param {Vector2} linePoint - point on the line
//  @param {Vector2} lineDir   - line direction. Must be normalized
var projectToLine = function projectToLine(p, linePoint, lineDir) {

  // dp = dot(p-linePoint, lineDir)
  var dp = (p.x - linePoint.x) * lineDir.x + (p.y - linePoint.y) * lineDir.y;

  // return linePoint + lineDir * dp
  p.set(
  linePoint.x + dp * lineDir.x,
  linePoint.y + dp * lineDir.y);

};

// Get distance between the point p and a line given by point and direction.
//  @param {Vector2} p
//  @param {Vector2} linePoint - point on the line
//  @param {Vector2} lineDir   - line direction. Must be normalized
var pointLineDistance = function () {
  var pProj = new THREE.Vector2();
  return function (p, linePoint, lineDir) {
    projectToLine(pProj.copy(p), linePoint, lineDir);
    return p.distanceTo(pProj);
  };
}();

// Calculates the intersection point of both given lines
// assumes that the lines are not parallel
// see: http://www.paulbourke.net/geometry/pointlineplane/
var intersectLines = function intersectLines(linePoint1, lineDir1, linePoint2, lineDir2, outPoint) {

  var denom = lineDir2.y * lineDir1.x - lineDir2.x * lineDir1.y;
  if (Math.abs(denom) < 1.0e-8) {return false;}

  // diff = linePoint1 - linePoint2
  var diffX = linePoint1.x - linePoint2.x;
  var diffY = linePoint1.y - linePoint2.y;

  var u = lineDir2.x * diffY - lineDir2.y * diffX;

  if (outPoint) {
    outPoint.x = linePoint1.x + u / denom * lineDir1.x;
    outPoint.y = linePoint1.y + u / denom * lineDir1.y;
  }
  return true;
};

// Rotate a vector p around origin or a given center. Works in-place.
//  @param {Vector2} p
//  @param {number}  angle in radians
//  @param [Vector2] center 
var rotateAround = function rotateAround(p, angle, center) {

  var c = Math.cos(angle);
  var s = Math.sin(angle);

  if (center) {
    p.sub(center);
  }

  var x = p.x;
  var y = p.y;

  p.x = x * c - y * s;
  p.y = x * s + y * c;

  if (center) {
    p.add(center);
  }
  return p;
};

// Returns angle in radians formed by two direction vectors. No normalization required.
//  @param {Vector2} dir1, dir2
//  @returns {number} result in [0, 2*Pi]
var angleBetweenDirections = function angleBetweenDirections(dir1, dir2) {

  // get angle formed with positive x-axis. 
  // angle1/2 are in [-Pi, Pi]
  var angle1 = Math.atan2(dir1.y, dir1.x);
  var angle2 = Math.atan2(dir2.y, dir2.x);

  // Difference is in [-2*Pi, 2*Pi]
  var angle = angle1 - angle2;

  // Map result to [0, 2*Pi] range
  if (angle < 0) angle += 2 * Math.PI;

  return angle;
};

// see isPointOnEdge
var isPointOnLine = function isPointOnLine(p, a, b, precision) {
  return isPointOnEdge(p, a, b, precision, false);
};

// Returns true if p lies close to the edge (p1, p2). 
var isPointOnEdge = function isPointOnEdge(p, a, b, precision) {var checkInsideSegment = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

  // Compute edge length
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  var length = Math.sqrt(dx * dx + dy * dy);

  var e = {
    v1: a,
    dx: dx,
    dy: dy,
    length: length,
    length2: length * length };

  return Autodesk.Extensions.CompGeom.pointOnLine(p.x, p.y, e, checkInsideSegment, precision);
};

var pointDelta = function pointDelta(a, b) {var digits = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var delta = { x: b.x - a.x, y: b.y - a.y };
  if (digits)
  {
    var exp = Math.pow(10, digits);
    delta.x = Math.round(delta.x * exp) / exp;
    delta.y = Math.round(delta.y * exp) / exp;
  }
  if (!delta.x && !delta.y) {
    return;
  }
  return delta;
};

var edgeIsDegenerated = function edgeIsDegenerated(a, b) {var eps2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1.0e-10;
  return a.distanceToSquared(b) < eps2;
};

// Compute target point resulting from mirroring point p
// on the given center point c.
var mirrorPointOnPoint = function mirrorPointOnPoint(p, c) {var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
  target = target || new THREE.Vector2();
  target.x = c.x - (p.x - c.x);
  target.y = c.y - (p.y - c.y);
  return target;
};

var fuzzyEqual = function fuzzyEqual(a, b, precision) {
  return Math.abs(a - b) < precision;
};

// Checks if two lines are collinear.
//  @param {Vector2} p1, dir1 - First line, given as point and normalized direction.
//  @param {Vector2} p2, dir2 - Second line
//  @param {number}  precision
//  @returns {bool}
var collinear = function collinear(p1, dir1, p2, dir2, precision) {

  // Directions must be either equal or opposite
  var dirEqual = fuzzyEqual(dir1.x, dir2.x, precision) && fuzzyEqual(dir1.y, dir2.y, precision);
  var dirOpposite = fuzzyEqual(dir1.x, -dir2.x, precision) && fuzzyEqual(dir1.y, -dir2.y, precision);
  if (!dirEqual && !dirOpposite) {
    return false;
  }

  // Directions are equal or opposite => Lines are collinear if and only if p2 is on line (p1, dir1).
  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  var dot = dx * dir1.x + dy * dir1.y;
  return Math.abs(dot) < precision;
};

export var Math2D = {
  getEdgeDirection: getEdgeDirection,
  projectToLine: projectToLine,
  pointLineDistance: pointLineDistance,
  intersectLines: intersectLines,
  rotateAround: rotateAround,
  angleBetweenDirections: angleBetweenDirections,
  getEdgeCenter: getEdgeCenter,
  getEdgeLength: getEdgeLength,
  turnLeft: turnLeft,
  isPointOnEdge: isPointOnEdge,
  isPointOnLine: isPointOnLine,
  pointDelta: pointDelta,
  edgeIsDegenerated: edgeIsDegenerated,
  mirrorPointOnPoint: mirrorPointOnPoint,
  fuzzyEqual: fuzzyEqual,
  collinear: collinear };