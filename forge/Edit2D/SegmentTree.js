function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;} // 
// SegmentTree is a spatial datastructure that helps to quickly find all segments (lines, arcs) within a given 2d bbox.
//

var SegmentType = {
  Line: 1,
  CircularArc: 2,
  EllipticalArc: 3 };


// A segment is an object that describes a single line or arc segment.
// Properties depend on segment type (see functions below)
var createLineSegment = function createLineSegment(x1, y1, x2, y2, vpId) {return { type: SegmentType.Line, x1: x1, y1: y1, x2: x2, y2: y2, vpId: vpId };};
var createCircularArcSegment = function createCircularArcSegment(cx, cy, start, end, radius, vpId) {return { type: SegmentType.CirularArc, cx: cx, cy: cy, start: start, end: end, radius: radius, vpId: vpId };};
var createEllipticalArcSegment = function createEllipticalArcSegment(cx, cy, start, end, major, minor, tilt, vpId) {return { type: SegmentType.EllipticalArc, cx: cx, cy: cy, start: start, end: end, major: major, minor: minor, tilt: tilt, vpId: vpId };};

// Triggers the corresponding callbacks (onLineSegment, onCircularArc...) from a given segment object.
//  @param {Object} s             - Segment object whose data are sent to geomCb
//  @param {Object} geomCallbacks - Provides handlers for different segments. Same as used by VertexBufferReader.
var processSegment = function processSegment(s, geomCallbacks) {
  switch (s.type) {
    case SegmentType.Line:geomCallbacks.onLineSegment(s.x1, s.y1, s.x2, s.y2, s.vpId);break;
    case SegmentType.CirularArc:geomCallbacks.onCircularArc(s.cx, s.cy, s.start, s.end, s.radius, s.vpId);break;
    case SegmentType.EllipticalArc:geomCallbacks.onEllipticalArc(s.cx, s.cy, s.tart, s.end, s.major, s.minor, s.tilt, s.vpId);break;}

};

// Implements required functions to allow organizing segments in a quadtree
var SegmentHandler = /*#__PURE__*/function () {

  function SegmentHandler() {_classCallCheck(this, SegmentHandler);

    // Used BoundsCallback to get segment bboxes
    this.boundsCb = new Autodesk.Viewing.Private.BoundsCallback(new THREE.Box2());

    // Reused tmp values
    this.queryBox = new THREE.Box2();
    this.tmpPoint = new THREE.Vector2();
  }_createClass(SegmentHandler, [{ key: "getSegmentBox", value: function getSegmentBox(

    segment) {
      this.boundsCb.bounds.makeEmpty();
      processSegment(segment, this.boundsCb);
      return this.boundsCb.bounds;
    } }, { key: "getQueryBox", value: function getQueryBox(

    minx, miny, maxx, maxy) {
      // get query box
      this.queryBox.min.set(minx, miny);
      this.queryBox.max.set(maxx, maxy);
      return this.queryBox;
    } }, { key: "intersectsBox", value: function intersectsBox(

    segment, minx, miny, maxx, maxy) {
      var queryBox = this.getQueryBox(minx, miny, maxx, maxy);
      var segmentBox = this.getSegmentBox(segment);
      return queryBox.isIntersectionBox(segmentBox);
    }

    // Note that outPoint is just an {x,y} pair, not a Vector2
  }, { key: "getPoint", value: function getPoint(segment, outPoint) {
      // Just use bbox center for all segment types
      var center = this.getSegmentBox(segment).center(this.tmpPoint);
      outPoint.x = center.x;
      outPoint.y = center.y;
    } }]);return SegmentHandler;}();var


SegmentTree = /*#__PURE__*/function () {function SegmentTree() {_classCallCheck(this, SegmentTree);}_createClass(SegmentTree, [{ key: "buildFromModel",

    // Build SegmentTree from 2D vector-data model (PDF or F2D).
    // Note: Make sure that the model is fully loaded - otherwise, the tree will be incomplete.
    value: function buildFromModel(model) {

      // The quadtree must know the extents in advance.
      var box = model.getBoundingBox();

      // Init quadtree that manages segments
      this.tree = new Autodesk.Extensions.CompGeom.QuadTree(box.min.x, box.min.y, box.max.x, box.max.y, 0.0, new SegmentHandler());

      // Add geomtry for all fragments
      var frags = model.getFragmentList();
      var count = frags.getCount();
      for (var i = 0; i < count; i++) {
        var geom = frags.getGeometry(i);
        this.addGeometry(geom);
      }
    }

    // Adds all segments from a given 2D LineShader geometry.
    //  @param {BufferGeometry} geom
    //
    // Precondition: Can only be called if tree has been initialized and geom is within the bbox used to initialize the tree
  }, { key: "addGeometry", value: function addGeometry(geom) {var _this = this;

      // GeometryCallback that just collects all segments as objects and adds them to the tree
      var collectSegment = {
        onLineSegment: function onLineSegment() {return _this.tree.addItem(createLineSegment.apply(void 0, arguments));},
        onCircularArc: function onCircularArc() {return _this.tree.addItem(createCircularArcSegment.apply(void 0, arguments));},
        onEllipticalArc: function onEllipticalArc() {return _this.tree.addItem(createEllipticalArcSegment.apply(void 0, arguments));} };


      var vbr = new Autodesk.Viewing.Private.VertexBufferReader(geom);
      vbr.enumGeoms(null, collectSegment);
    }

    //  @param {Object} geomCallbacks - Visitor that provides callbacks to handle different segments. Same as used by VertexBufferReader.
  }, { key: "enumSegments", value: function enumSegments(minx, miny, maxx, maxy, geomCallbacks) {

      // Find all segments in the tree and invoke corresponding call on GeometryCallback
      this.tree.enumInBox(minx, miny, maxx, maxy, function (s) {return processSegment(s, geomCallbacks);});
    } }]);return SegmentTree;}();export { SegmentTree as default };