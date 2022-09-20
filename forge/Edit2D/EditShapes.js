function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}
function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);
      if (desc.get) {
        return desc.get.call(receiver);
      }
      return desc.value;
    };
  }
  return _get(target, property, receiver || target);
}
function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }
  return object;
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
import { Math2D } from "./Math2D.js";

var nextShapeId = 1;

var av = Autodesk.Viewing;
var domParser = new DOMParser();

var toColor = function toColor(r, g, b) {
  return "rgb(" + r + "," + g + "," + b + ")";
};

var cloneVectorArray = function cloneVectorArray(src) {
  return src.map(function (p) {
    return { x: p.x, y: p.y };
  });
};

var exp4 = Math.pow(10, 4);
var limitDigits = function limitDigits(value) {
  var digits =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (!value || digits === null) {
    return value;
  }
  // like value.toFixed(), but removing trailing zeros
  var exp = digits === 4 ? exp4 : Math.pow(10, digits);
  return Math.round(value * exp) / exp;
};

export var Style = /*#__PURE__*/ (function () {
  /**
   * Creates a new Style for the Edit 2D tools.
   * @param {object} [params]           - various style values to overwrite the default style.
   * @param {string} [params.color]     - sets the color for the line and fill area
   * @param {number} [params.alpha]     - sets the alpha value for the line and fill area
   * @param {string} [params.lineColor] - sets the color for the line
   * @param {number} [params.lineAlpha] - sets the alpha value for the line
   * @param {number} [params.lineWidth] - sets the line width for the line.
   * @param {number} [params.lineStyle] - sets the style of the line
   * @param {string} [params.fillColor] - sets the color for the fill area
   * @param {number} [params.fillAlpha] - sets the alpha value for the fill area
   */
  function Style() {
    var params =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, Style);
    this.lineColor = params.lineColor || params.color || "rgb(0,0,128)";
    this.lineAlpha =
      params.lineAlpha !== undefined
        ? params.lineAlpha
        : params.alpha !== undefined
        ? params.alpha
        : 1.0;
    this.lineWidth = params.lineWidth !== undefined ? params.lineWidth : 3.0;

    this.fillColor = params.fillColor || params.color || "rgb(0,0,128)";
    this.fillAlpha =
      params.fillAlpha !== undefined
        ? params.fillAlpha
        : params.alpha !== undefined
        ? params.alpha
        : 0.2;

    // lineStyle is an index into a list of dash/dot patterns defined in See LineStyleDef.js.
    // Examples:
    //   0:  Solid line:    ______________
    //   10: Dashes long:   __ __ __ __ __
    //   11: Dashes short:  _ _ _ _ _ _ _
    //   12: Dashes longer: ___ ___ ___ ___
    //   16: Dots:          . . . . . . .
    //   17: Dots dense:    ..............
    //   18: Dots sparse:   .  .  .  .  .
    this.lineStyle = params.lineStyle || 0;

    // By default, we interpret line widths in screen-space
    this.isScreenSpace =
      params.isScreenSpace !== undefined ? params.isScreenSpace : true;
  }

  // Components r,b,g are in [0,255]
  _createClass(Style, [
    {
      key: "setFillColor",
      value: function setFillColor(r, g, b) {
        this.fillColor = toColor(r, g, b);
      },
    },
    {
      key: "setLineColor",
      value: function setLineColor(r, g, b) {
        this.lineColor = toColor(r, g, b);
      },
    },
    {
      key: "clone",
      value: function clone() {
        return new Style().copy(this);
      },
    },
    {
      key: "copy",
      value: function copy(from) {
        this.lineColor = from.lineColor;
        this.lineAlpha = from.lineAlpha;
        this.lineWidth = from.lineWidth;
        this.fillColor = from.fillColor;
        this.fillAlpha = from.fillAlpha;
        this.lineStyle = from.lineStyle;
        this.isScreenSpace = from.isScreenSpace;
        return this;
      },
    },
  ]);
  return Style;
})();

Style.toColor = toColor;

var DefaultStyle = new Style();

// Set dstBox to bbox of all points
var pointArrayBBox = function pointArrayBBox(points, dstBox) {
  dstBox.makeEmpty();
  for (var i = 0; i < points.length; i++) {
    dstBox.expandByPoint(points[i]);
  }
};

export var Shape = /*#__PURE__*/ (function () {
  function Shape() {
    var style =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : DefaultStyle.clone();
    _classCallCheck(this, Shape);
    this.style = style;

    // assign unique id
    this.id = nextShapeId++;

    this.bbox = new THREE.Box2();
    this.bboxDirty = true;

    // Should be set by creator by something more descriptive.
    this.name = this.id.toString();
  }

  // Must be provided by derivaties
  _createClass(
    Shape,
    [
      { key: "draw", value: function draw() /*ctx, overrideStyle*/ {} },
      {
        key: "hitTest",
        value: function hitTest() /*x, y, hitRadius*/ {}, // hitRadius is a distance in layer-coords used for line feature hit-tests.

        // Todo: Clarify whether Shapes should have an own matrix or always modified in-place
      },
      {
        key: "move",
        value: function move() /*dx, dy*/ {
          return this;
        },
      },
      {
        key: "clone",
        value: function clone() {
          return new Shape().copy(this);
        },
      },
      {
        key: "copy",
        value: function copy(from) {
          this.style = from.style.clone();
          return this;
        },
      },
      {
        key: "toSVG",
        value: function toSVG() {
          var precision =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 0;
          var digits =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : null;
          var path = this.toSVGPath(precision, digits);
          if (!path) {
            return;
          }
          return '<path d="'.concat(path.join(" "), '"/>');
        },
      },
      {
        key: "toSVGPath",
        value: function toSVGPath() {
          var precision =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 0;
          var digits =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : null;
          console.error("Must be implemented by derived class.");
        },
      },
      {
        key: "computeBBox",
        value: function computeBBox() {
          console.error("Must be implemented by derived class.");
        },
      },
      {
        key: "modified",
        value: function modified() {
          this.bboxDirty = true;
        },
      },
      {
        key: "updateBBox",
        value: function updateBBox() {
          if (this.bboxDirty) {
            this.computeBBox();
            this.bboxDirty = false;
          }
        },
      },
    ],
    [
      {
        key: "fromSVG",
        value: function fromSVG(svg) {
          if (!svg) {
            return;
          }
          var dom = domParser.parseFromString(svg, "application/xml");
          if (dom.childNodes.length !== 1) {
            throw "Function does only support svg with a single element: path, circle";
          }
          var node = dom.firstChild;
          if (node.nodeName === "circle") {
            return Circle._fromDOMNode(node);
          } else if (node.nodeName === "path") {
            return Path._fromDOMNode(node);
          }
          throw "Unsupported svg node type: ".concat(node.nodeName);
        },
      },
    ]
  );
  return Shape;
})();

av.GlobalManagerMixin.call(Shape.prototype);

// Common base class for Polygons and Polylines
export var PolyBase = /*#__PURE__*/ (function (_Shape) {
  _inherits(PolyBase, _Shape);

  function PolyBase() {
    var _this;
    var points =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var style =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : DefaultStyle.clone();
    _classCallCheck(this, PolyBase);
    _this = _possibleConstructorReturn(
      this,
      _getPrototypeOf(PolyBase).call(this, style)
    );

    // Array of points, each represented as an object {x, y}
    _this.points = points;
    return _this;
  }
  _createClass(PolyBase, [
    {
      key: "isPolygon",
      value: function isPolygon() {
        return this instanceof Polygon;
      },
    },
    {
      key: "isPolyline",
      value: function isPolyline() {
        return this instanceof Polyline;
      },
    },
    {
      key: "isPath",
      value: function isPath() {
        return this instanceof Path;
      },
    },

    {
      key: "addPoint",
      value: function addPoint(x, y) {
        var point = { x: x, y: y };
        this.points.push(point);
        this.modified();
        return point;
      },
    },

    {
      key: "getPoint",
      value: function getPoint(index, target) {
        target = target || new THREE.Vector2();
        return target.copy(this.points[index]);
      },
    },

    {
      key: "removePoint",
      value: function removePoint(index) {
        this.points.splice(index, 1);
      },
    },

    {
      key: "updatePoint",
      value: function updatePoint(index, x, y) {
        var p = this.points[index];
        p.x = x;
        p.y = y;
        this.modified();
      },
    },

    {
      key: "insertPoint",
      value: function insertPoint(index, p) {
        this.points.splice(index, 0, p);
      },

      // Add an extra vertex right after the given index that obtains the same coordinates.
    },

    {
      key: "duplicateVertex",
      value: function duplicateVertex(index) {
        var p = this.points[index];
        this.insertPoint(index + 1, { x: p.x, y: p.y });
      },
    },

    {
      key: "clear",
      value: function clear() {
        this.points.length = 0;
        this.modified();
      },

      // Enumerate all edges (a,b).
      //  @param {function(a, b, ai, bi)} cb - For each edge, we trigger cb(a, b, ai, bi), where (a,b) are the points and (ai, bi) the indices of the edge.
      //                                       If cb() returns true, the traversal stops.
    },

    {
      key: "enumEdges",
      value: function enumEdges(cb) {
        // get edge count
        var edgeCount = this.getEdgeCount();

        // check for each edge whether p is close to it.
        for (var i = 0; i < edgeCount; i++) {
          // get indices
          var ai = i;
          var bi = this.nextIndex(i);

          // get points
          var a = this.getPoint(ai);
          var b = this.getPoint(bi);

          // pass all to cb
          var stop = cb(a, b, ai, bi);

          // allow early out
          if (stop) {
            return;
          }
        }
      },

      // Given a polyline or polygon, it checks if the position is close to any edge of the shape.
      // If so, it returns the index of that edge, otherwise -1.
      // All values are in layer coords.
    },

    {
      key: "findEdgeIndex",
      value: function findEdgeIndex(p, precision) {
        var edgeIndex = -1;

        // Callback to find edge containing p
        var findEdgeCb = function findEdgeCb(a, b, ai) {
          // If edge contains p, store its edge index
          var containsP = Math2D.isPointOnEdge(p, a, b, precision);
          if (containsP) {
            edgeIndex = ai;
          }

          // Stop on success
          return containsP;
        };
        this.enumEdges(findEdgeCb);
        return edgeIndex;
      },
    },

    {
      key: "move",
      value: function move(dx, dy) {
        for (var i = 0; i < this.points.length; i++) {
          this.points[i].x += dx;
          this.points[i].y += dy;
        }
        this.modified();
        return this;
      },
    },

    {
      key: "copy",
      value: function copy(from) {
        _get(_getPrototypeOf(PolyBase.prototype), "copy", this).call(
          this,
          from
        );
        this.points = cloneVectorArray(from.points);
        this.modified();
        return this;
      },
    },

    {
      key: "toSVGPath",
      value: function toSVGPath() {
        var precision =
          arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var digits =
          arguments.length > 1 && arguments[1] !== undefined
            ? arguments[1]
            : null;
        if (!this.vertexCount) {
          return;
        }

        var previousIndex = 0;
        var reduceToPath = function reduceToPath(result, current, index, list) {
          if (!index) {
            result.push(
              "M "
                .concat(limitDigits(current.x, digits), ",")
                .concat(limitDigits(current.y, digits))
            );
            return result;
          }

          var prefix, value;
          var previous = list[previousIndex];
          var delta = Math2D.pointDelta(previous, current, digits);
          // skip empty/duplicate points
          if (!delta) {
            return result;
          }
          if (Math.abs(delta.x) <= precision) {
            prefix = "V";
            value = limitDigits(current.y, digits);
          } else if (Math.abs(delta.y) <= precision) {
            prefix = "H";
            value = limitDigits(current.x, digits);
          } else {
            prefix = "L";
            value = ""
              .concat(limitDigits(current.x, digits), ",")
              .concat(limitDigits(current.y, digits));
          }
          result.push("".concat(prefix, " ").concat(value));
          previousIndex = index;
          return result;
        };

        var path = this.points.reduce(reduceToPath, []);
        if (this.isPolygon()) {
          path.push("Z");
        }
        return path;
      },
    },
    {
      key: "computeBBox",
      value: function computeBBox() {
        pointArrayBBox(this.points, this.bbox);
      },
    },
    {
      key: "nextIndex",
      value: function nextIndex(index) {
        return (index + 1) % this.vertexCount;
      },
    },
    {
      key: "prevIndex",
      value: function prevIndex(index) {
        return (index + this.vertexCount - 1) % this.vertexCount;
      },
    },
    {
      key: "edgeIndexValid",
      value: function edgeIndexValid(edgeIndex) {
        var edgeCount = this.getEdgeCount();
        return edgeIndex >= 0 && edgeIndex < edgeCount;
      },

      // Copy start/end of an edge into outA, outB out params (Vector2).
      // edgeIndex must be valid.
    },
    {
      key: "getEdge",
      value: function getEdge(edgeIndex, outA, outB) {
        var ia = edgeIndex;
        var ib = this.nextIndex(edgeIndex);
        this.getPoint(ia, outA);
        this.getPoint(ib, outB);
      },
    },
    {
      key: "getEdgeDirection",
      value: function getEdgeDirection(edgeIndex, target) {
        var ia = edgeIndex;
        var ib = this.nextIndex(edgeIndex);
        target = target || new THREE.Vector2();
        return Math2D.getEdgeDirection(
          this.points[ia],
          this.points[ib],
          target
        );
      },
    },
    {
      key: "getEdgeCount",
      value: function getEdgeCount() {
        return this.isPolygon() ? this.vertexCount : this.vertexCount - 1;
      },

      // Return the summed edge length for Polygons and Polylines.
      //
      //  @param {MeasureTransform} [measureTransform] - Optional: To allow doing calculation in another coordinate space
    },
    {
      key: "getLength",
      value: function getLength(measureTransform) {
        var a = new THREE.Vector2();
        var b = new THREE.Vector2();
        var sum = 0.0;
        for (var i = 0; i < this.getEdgeCount(); i++) {
          this.getEdge(i, a, b);

          // apply optional measure transform
          if (measureTransform) {
            measureTransform.apply(a);
            measureTransform.apply(b);
          }

          sum += a.distanceTo(b);
        }
        return sum;
      },
    },
    {
      key: "length",
      get: function get() {
        console.warn(
          "poly.length is deprecated and will be removed. Please use poly.vertexCount property instead."
        );
        return this.points.length;
      },
    },
    {
      key: "vertexCount",
      get: function get() {
        return this.points.length;
      },
    },
  ]);
  return PolyBase;
})(Shape);

export var Polygon = /*#__PURE__*/ (function (_PolyBase) {
  _inherits(Polygon, _PolyBase);

  function Polygon() {
    var points =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var style =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : DefaultStyle.clone();
    _classCallCheck(this, Polygon);
    return _possibleConstructorReturn(
      this,
      _getPrototypeOf(Polygon).call(this, points, style)
    );
  }

  // Draw Polygon into LmvCanvasContext
  _createClass(Polygon, [
    {
      key: "draw",
      value: function draw(ctx, overrideStyle) {
        if (!this.vertexCount) {
          return;
        }

        var style = overrideStyle || this.style;

        ctx.dbId = this.id;
        ctx.lineStyle = style.lineStyle;
        ctx.isScreenSpace = style.isScreenSpace;

        ctx.beginPath();

        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (var i = 1; i < this.points.length; i += 1) {
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.closePath();

        var c = ctx.canvasContext;

        c.fillStyle = style.fillColor;
        c.globalAlpha = style.fillAlpha;

        ctx.fill();

        c.strokeStyle = style.lineColor;
        c.globalAlpha = style.lineAlpha;
        c.lineWidth = style.lineWidth;

        // Adjust lineWidth so that specified 1px widths will be drawn as 3px on screens with devicePixelRatio == 3.
        // For human eyes the line width is then the same width.
        var _window = this.getWindow();
        if (style.isScreenSpace) c.lineWidth *= _window.devicePixelRatio;

        ctx.stroke();

        // restore default values
        ctx.dbId = -1;
        ctx.lineStyle = 0;
        ctx.isScreenSpace = false;
      },
    },
    {
      key: "hitTest",
      value: function hitTest(x, y) {
        var cp = new Autodesk.Extensions.CompGeom.ComplexPolygon(this.points);

        // create dummy contour
        // TODO: Consider generalizing pointInCountour() to make it usable for non-indexed polygons
        var contour = [];
        for (var i = 0; i < this.vertexCount; i++) {
          contour.push(i);
        }

        return cp.pointInContour(x, y, contour);
      },
    },
    {
      key: "clone",
      value: function clone() {
        return new Polygon().copy(this);
      },

      //  @param {MeasureTransform} [measureTransform] - Optional: To allow doing calculation in another coordinate space
    },
    {
      key: "getArea",
      value: function getArea(measureTransform) {
        if (this.points.length < 3) {
          return 0.0;
        }

        var area = 0.0;
        this.enumEdges(function (a, b) {
          // apply optional transform
          measureTransform && measureTransform.apply(a);
          measureTransform && measureTransform.apply(b);

          // sum up signed areas
          area += a.x * b.y - b.x * a.y;
        });

        return Math.abs(0.5 * area);
      },
    },
  ]);
  return Polygon;
})(PolyBase);

export var Polyline = /*#__PURE__*/ (function (_PolyBase2) {
  _inherits(Polyline, _PolyBase2);

  function Polyline() {
    var points =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var style =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : DefaultStyle.clone();
    _classCallCheck(this, Polyline);
    return _possibleConstructorReturn(
      this,
      _getPrototypeOf(Polyline).call(this, points, style)
    );
  }
  _createClass(Polyline, [
    {
      key: "makeLine",
      value: function makeLine() {
        var x0 =
          arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y0 =
          arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var x1 =
          arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var y1 =
          arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        if (this.vertexCount !== 2) {
          this.clear();
          this.addPoint(x0, y0);
          this.addPoint(x1, y1);
        } else {
          this.updatePoint(0, x0, y0);
          this.updatePoint(1, x1, y1);
        }
        return this;
      },

      // Draw Polyline into LmvCanvasContext
    },
    {
      key: "draw",
      value: function draw(ctx, overrideStyle) {
        if (!this.vertexCount) {
          return;
        }

        var style = overrideStyle || this.style;

        ctx.dbId = this.id;
        ctx.lineStyle = style.lineStyle;
        ctx.isScreenSpace = style.isScreenSpace;

        ctx.beginPath();

        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (var i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        var c = ctx.canvasContext;

        c.strokeStyle = style.lineColor;
        c.globalAlpha = style.lineAlpha;
        c.lineWidth = style.lineWidth;

        // Adjust lineWidth so that specified 1px widths will be drawn as 3px on screens with devicePixelRatio == 3.
        // For human eyes the line width is then the same width.
        var _window = this.getWindow();
        if (style.isScreenSpace) c.lineWidth *= _window.devicePixelRatio;

        ctx.stroke();

        // restore default values
        ctx.dbId = -1;
        ctx.lineStyle = 0;
        ctx.isScreenSpace = false;
      },
    },
    {
      key: "clone",
      value: function clone() {
        return new Polyline().copy(this);
      },
    },
    {
      key: "computeBBox",
      value: function computeBBox() {
        pointArrayBBox(this.points, this.bbox);
      },

      // hitRadius is in layer-coords
    },
    {
      key: "hitTest",
      value: function hitTest(x, y, hitRadius) {
        var edgeIndex = this.findEdgeIndex({ x: x, y: y }, hitRadius);
        return edgeIndex !== -1;
      },
    },
  ]);
  return Polyline;
})(PolyBase);

var ArcType = {
  Bezier: 1,
};

export var Path = /*#__PURE__*/ (function (_PolyBase3) {
  _inherits(Path, _PolyBase3);

  function Path(points) {
    var style =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : DefaultStyle.clone();
    _classCallCheck(this, Path);
    return _possibleConstructorReturn(
      this,
      _getPrototypeOf(Path).call(this, points, style)
    );
  }
  _createClass(
    Path,
    [
      {
        key: "updatePoint",
        value: function updatePoint(index, x, y) {
          var p = this.points[index];

          // If p is adjacent to a BezierArc segment, the tangent should keep the same after changing the position
          // Therefore, we change the corresponding control points as well
          var dx = x - p.x;
          var dy = y - p.y;

          // Control point for the start tangent of the arc segment starting at p
          if (this.isBezierArc(index)) {
            p.cp1x += dx;
            p.cp1y += dy;
          }

          // Control point for the end tangent of the arc segment ending at p
          if (this.vertexCount > 1) {
            var prevIndex = this.prevIndex(index);
            if (this.isBezierArc(prevIndex)) {
              var pPrev = this.points[prevIndex];
              pPrev.cp2x += dx;
              pPrev.cp2y += dy;
            }
          }

          p.x = x;
          p.y = y;
          this.modified();
        },

        // Change segment into BezierArc
      },
      {
        key: "setBezierArc",
        value: function setBezierArc(segmentIndex, cp1x, cp1y, cp2x, cp2y) {
          var p = this.points[segmentIndex];

          p.arcType = ArcType.Bezier;
          p.cp1x = cp1x;
          p.cp1y = cp1y;
          p.cp2x = cp2x;
          p.cp2y = cp2y;
        },
      },
      {
        key: "isBezierArc",
        value: function isBezierArc(segmentIndex) {
          return this.points[segmentIndex].arcType === ArcType.Bezier;
        },

        // Return ctrl point of Bezier Arc. Only allowed if isBezierArc(segmentIndex) is true
        // @param {number} segmentIndex
        // @param {number} ctrlPointIndex - Must be 1 or 2. Note that ctrlPoints 0 and 3 are defined by
        //                                  current vertex position
      },
      {
        key: "getControlPoint",
        value: function getControlPoint(
          segmentIndex,
          ctrlPointIndex,
          optionalTarget
        ) {
          var result = optionalTarget || new THREE.Vector2();
          var p = this.points[segmentIndex];

          if (ctrlPointIndex === 1) {
            result.x = p.cp1x;
            result.y = p.cp1y;
          } else {
            result.x = p.cp2x;
            result.y = p.cp2y;
          }
          return result;
        },

        // Return ctrl point of Bezier Arc. Only allowed if isBezierArc(segmentIndex) is true
        // @param {number} segmentIndex
        // @param {number} ctrlPointIndex - Must be 1 or 2. Note that ctrlPoints 0 and 3 are defined by
        //                                  current vertex position
      },
      {
        key: "updateControlPoint",
        value: function updateControlPoint(segmentIndex, ctrlPoint, x, y) {
          var p = this.points[segmentIndex];
          if (ctrlPoint === 1) {
            p.cp1x = x;
            p.cp1y = y;
          } else {
            p.cp2x = x;
            p.cp2y = y;
          }
          this.modified();
        },

        // Draw Polygon into LmvCanvasContext
      },
      {
        key: "draw",
        value: function draw(ctx, overrideStyle) {
          if (!this.vertexCount) {
            return;
          }

          var style = overrideStyle || this.style;

          ctx.dbId = this.id;
          ctx.lineStyle = style.lineStyle;
          ctx.isScreenSpace = style.isScreenSpace;

          ctx.beginPath();

          ctx.moveTo(this.points[0].x, this.points[0].y);

          for (var i = 1; i < this.points.length; i += 1) {
            // The segment start point defines the type (line or arc)
            var prev = this.points[i - 1];
            var p = this.points[i];

            if (prev.arcType === ArcType.Bezier) {
              ctx.bezierCurveTo(
                prev.cp1x,
                prev.cp1y,
                prev.cp2x,
                prev.cp2y,
                p.x,
                p.y
              );
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }

          // close path
          var pLast = this.points[this.points.length - 1];
          var pFirst = this.points[0];
          if (pLast.arcType === ArcType.Bezier) {
            ctx.bezierCurveTo(
              pLast.cp1x,
              pLast.cp1y,
              pLast.cp2x,
              pLast.cp2y,
              pFirst.x,
              pFirst.y
            );
          } else {
            ctx.lineTo(pFirst.x, pFirst.y);
          }

          ctx.closePath();

          var c = ctx.canvasContext;

          c.fillStyle = style.fillColor;
          c.globalAlpha = style.fillAlpha;

          ctx.fill();

          c.strokeStyle = style.lineColor;
          c.globalAlpha = style.lineAlpha;
          c.lineWidth = style.lineWidth;

          // Adjust lineWidth so that specified 1px widths will be drawn as 3px on screens with devicePixelRatio == 3.
          // For human eyes the line width is then the same width.
          if (style.isScreenSpace) c.lineWidth *= window.devicePixelRatio;

          ctx.stroke();

          // restore default values
          ctx.dbId = -1;
          ctx.lineStyle = 0;
          ctx.isScreenSpace = false;
        },

        // TODO: Consider arcs properly
      },
      {
        key: "hitTest",
        value: function hitTest(x, y) {
          var cp = new Autodesk.Extensions.CompGeom.ComplexPolygon(this.points);

          // create dummy contour
          // TODO: Consider generalizing pointInContour() to make it usable for non-indexed polygons
          var contour = [];
          for (var i = 0; i < this.vertexCount; i++) {
            contour.push(i);
          }

          return cp.pointInContour(x, y, contour);
        },
      },
      {
        key: "clone",
        value: function clone() {
          return new Path().copy(this);
        },
      },
      {
        key: "copy",
        value: function copy(from) {
          _get(_getPrototypeOf(Path.prototype), "copy", this).call(this, from);

          // Copy extra information for arcs
          for (var i = 0; i < from.points.length; i++) {
            if (from.isBezierArc(i)) {
              var src = from.points[i];
              var dst = this.points[i];

              dst.arcType = src.arcType;
              dst.cp1x = src.cp1x;
              dst.cp1y = src.cp1y;
              dst.cp2x = src.cp2x;
              dst.cp2y = src.cp2y;
            }
          }
          return this;
        },
      },
      {
        key: "toSVGPath",
        value: function toSVGPath() {
          var precision =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 0;
          var digits =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : null;
          if (!this.vertexCount) {
            return [];
          }

          var path = [];
          path.push(
            "M "
              .concat(limitDigits(this.points[0].x, digits), ",")
              .concat(limitDigits(this.points[0].y, digits))
          );
          for (var i = 1; i < this.points.length; i += 1) {
            // The segment start point defines the type (line or arc)
            var prev = this.points[i - 1];
            var p = this.points[i];
            var value = void 0;
            if (prev.arcType === ArcType.Bezier) {
              value = "C "
                .concat(limitDigits(prev.cp1x, digits), ",")
                .concat(limitDigits(prev.cp1y, digits), ",")
                .concat(limitDigits(prev.cp2x, digits), ",")
                .concat(limitDigits(prev.cp2y, digits), ",")
                .concat(limitDigits(p.x, digits), ",")
                .concat(limitDigits(p.y, digits));
            } else {
              var delta = Math2D.pointDelta(prev, p, digits);
              // skip empty/duplicate points
              if (!delta) {
                continue;
              }
              if (Math.abs(delta.x) <= precision) {
                value = "V ".concat(limitDigits(p.y, digits));
              } else if (Math.abs(delta.y) <= precision) {
                value = "H ".concat(limitDigits(p.x, digits));
              } else {
                value = "L "
                  .concat(limitDigits(p.x, digits), ",")
                  .concat(limitDigits(p.y, digits));
              }
            }
            path.push(value);
          }

          // close path
          var pLast = this.points[this.points.length - 1];
          if (pLast.arcType === ArcType.Bezier) {
            var pFirst = this.points[0];
            var _value = "C "
              .concat(limitDigits(pLast.cp1x, digits), ",")
              .concat(limitDigits(pLast.cp1y, digits), ",")
              .concat(limitDigits(pLast.cp2x, digits), ",")
              .concat(limitDigits(pLast.cp2y, digits), ",")
              .concat(limitDigits(pFirst.x, digits), ",")
              .concat(limitDigits(pFirst.y, digits));
            path.push(_value);
          }
          path.push("Z");

          return path;
        },
      },
      {
        key: "move",
        value: function move(dx, dy) {
          _get(_getPrototypeOf(Path.prototype), "move", this).call(
            this,
            dx,
            dy
          );

          // Move affected control points as well
          for (var i = 0; i < this.points.length; i++) {
            if (!this.isBezierArc(i)) {
              continue;
            }

            var p = this.points[i];
            p.cp1x += dx;
            p.cp1y += dy;
            p.cp2x += dx;
            p.cp2y += dy;
          }

          this.modified();
          return this;
        },
      },
    ],
    [
      {
        key: "_fromDOMNode",
        value: function _fromDOMNode(pathNode) {
          var d = pathNode.getAttribute("d");
          if (!d) {
            return;
          }
          var _Path$_parsePath = Path._parsePath(d),
            points = _Path$_parsePath.points,
            isPolygon = _Path$_parsePath.isPolygon;
          if (
            points.find(function (p) {
              return p.arcType !== undefined;
            })
          ) {
            return new Path(points);
          } else if (isPolygon) {
            return new Polygon(points);
          }
          return new Polyline(points);
        },
      },
      {
        key: "_parsePath",
        value: function _parsePath(svgPath) {
          // split at all chars but keep the char using positive look ahead
          // sample payload for path d = M 13.882,4.8592 L 14.6757,4.738 L 13.9668,4.4896 L 14.005,4.4896 C 15.3211,5.4567,14.79,3.1599,14.6624,4.155 L 13.9189,3.8945 L 13.9189,3.8 L 14.6234,3.7516 Z
          // results into list with glyph with position array:
          // ['M 13.882,4.8592', 'L 14.6757,4.738', 'L 13.9668,4.4896', 'L 14.005,4.4896', 'C 15.3211,5.4567,14.79,3.1599,14.6624,4.155', 'L 13.9189,3.8945', 'L 13.9189,3.8', 'L 14.6234,3.7516', 'Z']
          var pointStrings = svgPath.split(/ (?=[a-zA-Z])/gi);
          var validChars = "MLHVCZ";
          var previousPoint = { x: 0, y: 0 };
          var newPoint;
          var points = [];
          var isPolygon = false;
          for (var i = 0; i < pointStrings.length; i++) {
            var pointString = pointStrings[i];
            if (!validChars.contains(pointString[0])) {
              throw '"'
                .concat(
                  pointString[0],
                  '" is not a supported or invalid glyph: '
                )
                .concat(pointString);
            }
            var value = pointString.substring(1);
            switch (pointString[0]) {
              case "M":
              case "L":
                var coords = value.split(",");
                newPoint = {
                  x: parseFloat(coords[0]),
                  y: parseFloat(coords[1]),
                };
                if (pointString[0] === "M") {
                  // remove the initial 0,0 point
                  points.shift();
                }
                break;
              case "H":
                newPoint = { x: parseFloat(value), y: previousPoint.y };
                break;
              case "V":
                newPoint = { x: previousPoint.x, y: parseFloat(value) };
                break;
              case "C":
                var bezierCoords = value.split(",");
                newPoint = {
                  x: parseFloat(bezierCoords[4]),
                  y: parseFloat(bezierCoords[5]),
                };
                previousPoint.arcType = ArcType.Bezier;
                previousPoint.cp1x = parseFloat(bezierCoords[0]);
                previousPoint.cp1y = parseFloat(bezierCoords[1]);
                previousPoint.cp2x = parseFloat(bezierCoords[2]);
                previousPoint.cp2y = parseFloat(bezierCoords[3]);
                break;
              case "Z": // we are done
                isPolygon = true;
                continue;
            }
            previousPoint = newPoint;
            points.push(newPoint);
          } // Bezier applied to the last point will create an additional point which is equal to the endpoint to close the path
          // see Path.toSVGPath(). Path is always closed, therefore we can remove the duplicate end point.
          var delta = Math2D.pointDelta(
            points[0],
            points[points.length - 1],
            0
          );
          if (!delta) {
            points.pop(); // remove the duplicate last point which the same as the first point.
          }
          return { points: points, isPolygon: isPolygon };
        },
      },
    ]
  );
  return Path;
})(PolyBase);

export var Circle = /*#__PURE__*/ (function (_Shape2) {
  _inherits(Circle, _Shape2); // Note: The tessSegments parameter will be removed later when the implementation uses arcs from LineShader directly.

  function Circle() {
    var _this2;
    var centerX =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.0;
    var centerY =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.0;
    var radius =
      arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1.0;
    var style =
      arguments.length > 3 && arguments[3] !== undefined
        ? arguments[3]
        : DefaultStyle.clone();
    var tessSegments =
      arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 20;
    _classCallCheck(this, Circle);
    _this2 = _possibleConstructorReturn(
      this,
      _getPrototypeOf(Circle).call(this, style)
    );
    _this2.polygon = new Polygon([], style);
    // Force polygon.id to be the same, so that its geometry is associated with this Circle.
    // This is a bit hacky, but can be removed as soon as we use native arcs for circle rendering.
    _this2.polygon.id = _this2.id;

    _this2.centerX = centerX;
    _this2.centerY = centerY;
    _this2.radius = radius;
    _this2.tessSegments = tessSegments;

    _this2.needsUpdate = true;
    return _this2;
  }

  _createClass(
    Circle,
    [
      {
        key: "draw",
        value: function draw(ctx, overrideStyle) {
          this.polygon.points.length = 0;

          // angle delta in degrees
          var stepSize = 360 / this.tessSegments;
          for (var angle = 0; angle < 360; angle += stepSize) {
            var a = (angle * Math.PI) / 180;
            var x = this.radius * Math.cos(a);
            var y = this.radius * Math.sin(a);

            this.polygon.addPoint(this.centerX + x, this.centerY + y);
          }

          this.needsUpdate = false;

          this.polygon.draw(ctx, overrideStyle);
        },
      },
      {
        key: "setCenter",
        value: function setCenter(x, y) {
          this.centerX = x;
          this.centerY = y;
          this.modified();
        },
      },
      {
        key: "move",
        value: function move(dx, dy) {
          this.centerX += dx;
          this.centerY += dy;
          this.modified();
        },
      },
      {
        key: "hitTest",
        value: function hitTest(x, y) {
          var dx = x - this.centerX;
          var dy = y - this.centerY;
          return dx * dx + dy * dy < this.radius * this.radius;
        },
      },
      {
        key: "clone",
        value: function clone() {
          return new Circle().copy(this);
        },
      },
      {
        key: "copy",
        value: function copy(from) {
          _get(_getPrototypeOf(Circle.prototype), "copy", this).call(
            this,
            from
          );
          this.polygon = from.polygon.clone();
          this.centerX = from.centerX;
          this.centerY = from.centerY;
          this.radius = from.radius;
          this.tessSegments = from.tessSegments;
          this.modified();
          return this;
        },
      },
      {
        key: "toSVG",
        value: function toSVG() {
          var precision =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 0;
          var digits =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : null;
          return '<circle cx="'
            .concat(limitDigits(this.centerX, digits), '" cy="')
            .concat(limitDigits(this.centerY, digits), '" r="')
            .concat(limitDigits(this.radius, digits), '"/>');
        },
      },
      {
        key: "computeBBox",
        value: function computeBBox() {
          this.bbox.min.set(
            this.centerX - this.radius,
            this.centerY - this.radius
          );
          this.bbox.max.set(
            this.centerX + this.radius,
            this.centerY + this.radius
          );
        },
      },
    ],
    [
      {
        key: "_fromDOMNode",
        value: function _fromDOMNode(circleNode) {
          if (!circleNode.hasAttributes || !circleNode.hasAttributes()) {
            throw "No attributes available on the <circle/> node";
          }
          var circle = new Circle();
          for (var i = circleNode.attributes.length - 1; i >= 0; i--) {
            var attr = circleNode.attributes[i];
            switch (attr.name) {
              case "cx":
                circle.centerX = parseFloat(attr.value);
                break;
              case "cy":
                circle.centerY = parseFloat(attr.value);
                break;
              case "r":
                circle.radius = parseFloat(attr.value);
                break;
            }
          }
          return circle;
        },
      },
    ]
  );
  return Circle;
})(Shape);

export var ShapeWrapper = /*#__PURE__*/ (function (_Shape3) {
  _inherits(ShapeWrapper, _Shape3);

  // @param {Shape} shape - must not be null
  function ShapeWrapper(shape) {
    var _this3;
    _classCallCheck(this, ShapeWrapper);
    _this3 = _possibleConstructorReturn(
      this,
      _getPrototypeOf(ShapeWrapper).call(this)
    );
    _this3.shape = shape;

    Object.defineProperty(_assertThisInitialized(_this3), "bbox", {
      get: function get() {
        return _this3.shape.bbox;
      },
      set: function set(bbox) {
        _this3.shape.bbox = bbox;
      },
    });

    Object.defineProperty(_assertThisInitialized(_this3), "id", {
      get: function get() {
        return _this3.shape.id;
      },
      set: function set(id) {
        _this3.shape.id = id;
      },
    });

    Object.defineProperty(_assertThisInitialized(_this3), "bboxDirty", {
      get: function get() {
        return _this3.shape.bboxDirty;
      },
      set: function set(dirty) {
        _this3.shape.bboxDirty = dirty;
      },
    });

    Object.defineProperty(_assertThisInitialized(_this3), "name", {
      get: function get() {
        return _this3.shape.name;
      },
      set: function set(name) {
        _this3.shape.name = name;
      },
    });
    return _this3;
  }
  _createClass(ShapeWrapper, [
    {
      key: "draw",
      value: function draw() {
        var _this$shape;
        return (_this$shape = this.shape).draw.apply(_this$shape, arguments);
      },
    },
    {
      key: "hitTest",
      value: function hitTest() {
        var _this$shape2;
        return (_this$shape2 = this.shape).hitTest.apply(
          _this$shape2,
          arguments
        );
      },
    },
    {
      key: "move",
      value: function move() {
        var _this$shape3;
        return (_this$shape3 = this.shape).move.apply(_this$shape3, arguments);
      },
    },
    {
      key: "modified",
      value: function modified() {
        var _this$shape4;
        return (_this$shape4 = this.shape).modified.apply(
          _this$shape4,
          arguments
        );
      },
    },
    {
      key: "computeBBox",
      value: function computeBBox() {
        var _this$shape5;
        return (_this$shape5 = this.shape).computeBBox.apply(
          _this$shape5,
          arguments
        );
      },
    },
    {
      key: "updateBBox",
      value: function updateBBox() {
        var _this$shape6;
        return (_this$shape6 = this.shape).updateBBox.apply(
          _this$shape6,
          arguments
        );
      },
    },
    {
      key: "clone",
      value: function clone() {
        return new ShapeWrapper(this.shape.clone());
      },
    },
    {
      key: "copy",
      value: function copy(from) {
        this.shape.copy(from.shape);
      },
    },
  ]);
  return ShapeWrapper;
})(Shape);
