function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _get(target, property, receiver) {if (typeof Reflect !== "undefined" && Reflect.get) {_get = Reflect.get;} else {_get = function _get(target, property, receiver) {var base = _superPropBase(target, property);if (!base) return;var desc = Object.getOwnPropertyDescriptor(base, property);if (desc.get) {return desc.get.call(receiver);}return desc.value;};}return _get(target, property, receiver || target);}function _superPropBase(object, property) {while (!Object.prototype.hasOwnProperty.call(object, property)) {object = _getPrototypeOf(object);if (object === null) break;}return object;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
import { Math2D } from './Math2D.js';

// int value to string, e.g. 50 => "50px" - to used for style assignments.
var toPixels = function toPixels(val) {
  return val.toString() + 'px';
};

export var AlignX = {
  Left: 1,
  Center: 2,
  Right: 3 };


export var AlignY = {
  Top: 1,
  Center: 2,
  Bottom: 3 };


var av = Autodesk.Viewing;

// Base class for any gizmo that needs to be synchronized with the shapes of an EditLayer.
export var CanvasGizmoBase = /*#__PURE__*/function () {
  function CanvasGizmoBase() {_classCallCheck(this, CanvasGizmoBase);}

  // Called whenever the layer or camera changes.
  _createClass(CanvasGizmoBase, [{ key: "update", value: function update() {} }]);return CanvasGizmoBase;}();


av.GlobalManagerMixin.call(CanvasGizmoBase.prototype);

// A CanvasGizmo is an html div anchored at a position in layer-coords
export var CanvasGizmo = /*#__PURE__*/function (_CanvasGizmoBase) {_inherits(CanvasGizmo, _CanvasGizmoBase);
  function CanvasGizmo(layer) {var _this;var visible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;_classCallCheck(this, CanvasGizmo);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(CanvasGizmo).call(this));

    _this.layer = layer;
    _this.setGlobalManager(layer.globalManager);

    // position in layer-coords. The transform origin of the div will appear at this position.
    _this.layerPos = new THREE.Vector2();

    // position in canvas-coords (updated based on this.layerPos and camera)
    _this.canvasPos = new THREE.Vector2();

    // html content to be shown
    var _document = _this.getDocument();
    _this.container = _document.createElement('div');

    // Make sure that label is displayed on top of the canvas and not "pushed away" by it.
    _this.container.style.position = 'absolute';

    // Rotate around gizmo center
    _this.container.style.transformOrigin = '50% 50%';

    // Show immediately if wanted
    _this.visible = false;

    _this.alignX = AlignX.Center;
    _this.alignY = AlignY.Center;

    // Clockwise rotation angle in degrees. Rotates around center.
    _this.angle = 0;

    if (visible) {
      _this.setVisible(true, false);
    }

    // Allow checking if the mouse is currently on this gizmo
    _this.isUnderMouse = false;
    _this.container.addEventListener('mouseenter', function () {return _this.isUnderMouse = true;});
    _this.container.addEventListener('mouseleave', function () {return _this.isUnderMouse = false;});

    // By default, just delegate to viewer context menu. Edit2DContextMenu will take care
    // that it is properly configured.
    _this.container.addEventListener('contextmenu', function (e) {
      _this.isUnderMouse = true;
      _this.layer.viewer.triggerContextMenu(e);
    });

    // Make sure that isUnderMouse is set even if we didn't receive the mouseEnter event before.
    // Unfortunately, the same edge-case problem still exists if we miss the mouseleave event.
    // It would be safer to implement isUnderMouse as a getter using document.elementAtPoint().
    // However, this would make isUnderMouse checks quite expensive. So, we have to find something better here.
    _this.container.addEventListener('mousedown', function () {return _this.isUnderMouse = true;});return _this;
  }_createClass(CanvasGizmo, [{ key: "dtor", value: function dtor()

    {
      this.setVisible(false);
    } }, { key: "setVisible", value: function setVisible(

    visible) {var autoUpdate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      if (visible == this.visible) {
        return;
      }

      if (visible) {
        // Note: It's essential that we add it to viewer.canvasWrap instead of viewer.container:
        //       ToolController listens to events on canvasWrap. Therefore, if we would add
        //       it to viewer.container, all mouse events captured would never reach the ToolController
        //       no matter whether the gizmo handles them or not.
        this.layer.viewer.canvasWrap.appendChild(this.container);
        this.layer.addCanvasGizmo(this);

        // Make sure that position is correct
        if (autoUpdate) {
          this.update();
        }
      } else
      {
        this.layer.viewer.canvasWrap.removeChild(this.container);
        this.layer.removeCanvasGizmo(this);
      }
      this.visible = visible;
    } }, { key: "setAlignX", value: function setAlignX(

    alignX) {
      this.alignX = alignX;
      this.update();
    } }, { key: "setAlignY", value: function setAlignY(

    alignY) {
      this.alignY = alignY;
      this.update();
    }

    // @param {number} angle - Clockwise angle in degrees
    // 
    // Note: Do not use 'position:absolute' in child html elements.
    //       Otherwise, the content box will be empty and it will not rotate around anymore.
  }, { key: "setRotation", value: function setRotation(angle) {
      this.angle = angle;
      this.update();
    } }, { key: "update", value: function update()

    {
      this.canvasPos.copy(this.layer.layerToCanvas(this.layerPos.x, this.layerPos.y));

      var p = this.canvasPos;
      var style = this.container.style;

      // set left/top to gizmo position
      style.left = toPixels(p.x);
      style.top = toPixels(p.y);

      // Choose translation offset in % based on X-alignment
      var tx;
      switch (this.alignX) {
        case AlignX.Left:tx = '0%';break;
        case AlignX.Center:tx = '-50%';break;
        case AlignX.Right:tx = '-100%';break;}


      var ty;
      switch (this.alignY) {
        case AlignY.Top:ty = '0%';break;
        case AlignY.Center:ty = '-50%';break;
        case AlignY.Bottom:ty = '-100%';break;}


      // Update transform based on rotation angle and alignment
      style.transform = "translate(".concat(tx, ", ").concat(ty, ") rotate(").concat(this.angle, "deg)");
    }

    // Set position in layer coords
  }, { key: "setPosition", value: function setPosition(x, y) {
      this.layerPos.set(x, y);
      this.update();
    } }, { key: "setClassEnabled", value: function setClassEnabled(

    className, enabled) {
      if (enabled) {
        this.container.classList.add(className);
      } else {
        this.container.classList.remove(className);
      }
    }

    // Selection state is managed using a css-class 'selected'. 
    // Note that this only has an effect if the css style used for the gizmo supports it.
  }, { key: "setSelected", value: function setSelected(selected) {
      this.setClassEnabled('selected', selected);
    } }, { key: "isSelected", value: function isSelected()

    {
      return this.container.classList.contains('selected');
    }

    // Optional: Hover-effect for gizmos that can be clicked or dragged.
  }, { key: "setHoverEnabled", value: function setHoverEnabled(enabled) {
      this.setClassEnabled('enable-hover', enabled);
    }

    // Optional: Assign a name to gizmo and div element to facilitate debugging and testing.
  }, { key: "setName", value: function setName(name) {
      this.name = name;
      this.container.id = name ? name : '';
    } }]);return CanvasGizmo;}(CanvasGizmoBase);


// Configure CanvasGizmo as a text label.
var initTextLabel = function initTextLabel(gizmo) {

  // Use measure-tool styles by default
  gizmo.container.classList.add('measure-length');
  gizmo.container.classList.add('visible');

  // Create textDiv child div
  var _document = gizmo.getDocument();
  gizmo.textDiv = _document.createElement('div');
  gizmo.textDiv.classList.add('measure-length-text');
  gizmo.container.appendChild(gizmo.textDiv);

  // Add setText convenience function
  gizmo.setText = function (str) {
    this.textDiv.textContent = str;
  }.bind(gizmo);
};

// A ShapeLabel is a text label whose anchor position is synchronized with the bbox center of a shape in a layer.
export var ShapeLabel = /*#__PURE__*/function (_CanvasGizmo) {_inherits(ShapeLabel, _CanvasGizmo);

  function ShapeLabel(shape, layer) {var _this2;var visible = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;_classCallCheck(this, ShapeLabel);
    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(ShapeLabel).call(this, layer, visible));

    initTextLabel(_assertThisInitialized(_this2));

    _this2.shape = shape;

    // Can be set to hidden to temporarily hide the label
    _this2.valueValid = true;

    _this2.update();return _this2;
  }_createClass(ShapeLabel, [{ key: "update", value: function update()

    {
      if (this.shape && this.valueValid) {
        // Set it to visible (in case polygon was null before)
        this.container.style.visibility = 'visible';

        if (this.shape.isPolyline()) {
          var edgeCount = this.shape.getEdgeCount();
          // For a start, simply position the label on the segment roughly in the middle of the polyline
          var edgeToLabel = Math.floor(edgeCount / 2);
          if (this.shape.edgeIndexValid(edgeToLabel)) {
            var posA = new THREE.Vector2();
            var posB = new THREE.Vector2();
            this.shape.getEdge(edgeToLabel, posA, posB);
            this.layerPos.set(0.5 * (posA.x + posB.x), 0.5 * (posA.y + posB.y));
          }
        } else
        {
          // For a start, simply use the bbox center of the polygon. In some cases, this might end up outside the
          // polygon, so we may consider something smarter later.
          this.shape.computeBBox();
          this.shape.bbox.center(this.layerPos);
        }
        _get(_getPrototypeOf(ShapeLabel.prototype), "update", this).call(this);
      } else {
        this.container.style.visibility = 'hidden';
      }
    } }, { key: "setShape", value: function setShape(

    shape) {
      this.shape = shape;
      this.update();
    } }]);return ShapeLabel;}(CanvasGizmo);


// Only works for shapes with getLength() function
export var LengthLabel = /*#__PURE__*/function (_ShapeLabel) {_inherits(LengthLabel, _ShapeLabel);

  // @param {Polyline}    polyline
  // @param {EditLayer}   layer
  // @param {UnitHandler} unitHandler - unitHandler.areaToString() is required to define how to display area values as string.
  // @param {bool}        [visible]
  function LengthLabel(polyline, layer, unitHandler) {var _this3;var visible = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;_classCallCheck(this, LengthLabel);
    _this3 = _possibleConstructorReturn(this, _getPrototypeOf(LengthLabel).call(this, polyline, layer, visible));
    _this3.unitHandler = unitHandler;return _this3;
  }_createClass(LengthLabel, [{ key: "update", value: function update()

    {
      // Get shape length (if shape supports it)
      var hasLength = this.shape && this.shape.getLength;
      var length = hasLength && this.shape.getLength(this.unitHandler.measureTransform);

      // Hide label if we don't have a well-defined length.
      // We also hide it if length is 0.0, because the shape cannot be visible anyway.
      this.valueValid = Boolean(length);

      if (this.valueValid) {
        var text = this.unitHandler.lengthToString(length);
        this.setText(text);
      }

      // Let base class update position
      _get(_getPrototypeOf(LengthLabel.prototype), "update", this).call(this);
    } }]);return LengthLabel;}(ShapeLabel);


// Only works for shapes with getArea() function
export var AreaLabel = /*#__PURE__*/function (_ShapeLabel2) {_inherits(AreaLabel, _ShapeLabel2);

  // @param {Polygon}     polygon
  // @param {EditLayer}   layer
  // @param {UnitHandler} unitHandler - unitHandler.areaToString() is required to define how to display area values as string.
  // @param {bool}        [visible]
  function AreaLabel(polygon, layer, unitHandler) {var _this4;var visible = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;_classCallCheck(this, AreaLabel);
    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(AreaLabel).call(this, polygon, layer, visible));
    _this4.unitHandler = unitHandler;return _this4;
  }_createClass(AreaLabel, [{ key: "update", value: function update()

    {
      // Get shape area (if shape supports it)
      var hasArea = this.shape && this.shape.getArea;
      var area = hasArea && this.shape.getArea(this.unitHandler.measureTransform);

      // Hide label if we don't have a well-defined area.
      // We also hide it if area is 0.0, because the shape cannot be visible anyway.
      this.valueValid = Boolean(area);

      if (this.valueValid) {
        var text = this.unitHandler.areaToString(area);
        this.setText(text);
      }

      // Let base class update position
      _get(_getPrototypeOf(AreaLabel.prototype), "update", this).call(this);
    } }]);return AreaLabel;}(ShapeLabel);


// A html element for which position and rotation is aligned with an edge
export var EdgeGizmo = /*#__PURE__*/function (_CanvasGizmo2) {_inherits(EdgeGizmo, _CanvasGizmo2);

  // @param {EditLayer} layer
  // @param {bool} visible
  function EdgeGizmo(layer) {var _this5;var visible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;_classCallCheck(this, EdgeGizmo);
    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(EdgeGizmo).call(this, layer, visible));

    _this5.posA = new THREE.Vector2();
    _this5.posB = new THREE.Vector2();

    // Indicates if a position has been set. If not, we temporarily hide the gizmo. If the gizmo is
    // attached to an edge, this flag is set automatically.
    _this5.posValid = false;

    // Temp vectors used in update
    _this5.edgeDir = new THREE.Vector2();

    // Optional: Positions can be synchronized with an edge of a polygon or polyline
    _this5.poly = null;
    _this5.edgeIndex = 0;

    // Use measure-length css style by default
    _this5.container.classList.add('edge-gizmo');

    // Optional: If specified, this limits the size of the gizmo relative to the edge length on screen:
    // We hide the gizmo if it exceeds x * edgeLength on screen.
    _this5.maxRelativeLength = undefined; // in [0,1]
    return _this5;}

  // If a poly is set, the gizmo is automatically synchronized with the edge.
  // As long as the poly is visible in the same layer, the edge is automatically kept in sync with the edge.
  //
  //  @param {PolyBase} poly     - polygon or polyline containing the edge that we want to attach to. If null, positions can be set manually.
  //  @param {number} edgeIndex  - edgeIndex in poly. If not valid, gizmo is hidden.
  //  @param {bool} [autoUpdate] - update position immediately
  _createClass(EdgeGizmo, [{ key: "attachToEdge", value: function attachToEdge(poly, edgeIndex) {
      this.poly = poly;
      this.edgeIndex = edgeIndex;
      this.update();
    } }, { key: "detachFromEdge", value: function detachFromEdge()

    {
      this.poly = null;
      this.edgeIndex = -1;
      this.posValid = false; // hide unless a position is explicitly set
      this.update();
    } }, { key: "update", value: function update()

    {

      // If a polygon is set, obtain positions automatically from it - or hide gizmo if edge does not exist anymore
      if (this.poly && this.poly.edgeIndexValid(this.edgeIndex)) {
        this.poly.getEdge(this.edgeIndex, this.posA, this.posB);
        this.posValid = true;
      }

      // If edge is invalid or too small on screen, just hide the gizmo
      var show = this._shouldBeShown();
      this.container.style.visibility = show ? 'visible' : 'hidden';
      if (!show) {
        return;
      }

      // Center gizmo at edge center
      this.layerPos.set(0.5 * (this.posA.x + this.posB.x), 0.5 * (this.posA.y + this.posB.y));

      // Set rotation angle
      this._updateRotation();

      _get(_getPrototypeOf(EdgeGizmo.prototype), "update", this).call(this);
    }

    // Check if the gizmo should be shown: We hide it if the edge is too small or if the edge does not exist at all.
  }, { key: "_shouldBeShown", value: function _shouldBeShown() {

      // Positions must be properly set - either automatically from an attached edge or manually using setEdge()
      if (!this.posValid) {
        return false;
      }

      // Show/Hide gizmo depending on zoom:
      // Gizmo has constant screen-size. So, we hide it if the screen-size of the edge becomes too small.
      if (this.maxRelativeLength) {
        var aScreen = this.layer.layerToCanvas(this.posA.x, this.posA.y);
        var bScreen = this.layer.layerToCanvas(this.posB.x, this.posB.y);
        var edgeLengthScreen = aScreen.distanceTo(bScreen);
        var maxAllowedPixels = edgeLengthScreen * this.maxRelativeLength;
        var _window = this.getWindow();
        var width = parseFloat(_window.getComputedStyle(this.container).width);
        return width < maxAllowedPixels;
      }
      return true;
    }

    // Set style rotation to align gizmo along edge direction, so that 'width' is along the edge
  }, { key: "_updateRotation", value: function _updateRotation() {

      // Compute counterClockwise angle in radians that rotates the positive x-axis to the edge direction a->b
      var dir = Math2D.getEdgeDirection(this.posA, this.posB, this.edgeDir);
      var angle = Math.atan2(dir.y, dir.x);

      // Avoid upside-down rotation: Flip by 180 degrees if b is left of a. This is import if gizmo contains text.
      if (dir.x < 0) {
        angle += Math.PI;
      }

      // Convert angle to clockwise degrees and apply it to style
      // Just set the angle here, but don't call setAngle, becaue we don't want to trigger auto-update.
      this.angle = -THREE.Math.radToDeg(angle);
    } }]);return EdgeGizmo;}(CanvasGizmo);


export var EdgeMoveGizmo = /*#__PURE__*/function (_EdgeGizmo) {_inherits(EdgeMoveGizmo, _EdgeGizmo);

  function EdgeMoveGizmo(layer, name) {var _this6;var visible = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;_classCallCheck(this, EdgeMoveGizmo);
    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(EdgeMoveGizmo).call(this, layer, visible));

    _this6.setName(name);
    _this6.container.classList.add('edge-move-gizmo');

    // Hide gizmo if its screenWidth exceeds 0.3 * edgeLength
    _this6.maxRelativeLength = 0.3; // in [0,1]
    return _this6;}return EdgeMoveGizmo;}(EdgeGizmo);


// An EdgeGizmo to display text
export var EdgeLabel = /*#__PURE__*/function (_EdgeGizmo2) {_inherits(EdgeLabel, _EdgeGizmo2);

  function EdgeLabel(layer) {var _this7;var visible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;_classCallCheck(this, EdgeLabel);
    _this7 = _possibleConstructorReturn(this, _getPrototypeOf(EdgeLabel).call(this, layer, visible));
    initTextLabel(_assertThisInitialized(_this7));

    // Hide label if it would exceed the edge length
    _this7.maxRelativeLength = 1.0;return _this7;
  }return EdgeLabel;}(EdgeGizmo);


export var VertexGizmo = /*#__PURE__*/function (_CanvasGizmo3) {_inherits(VertexGizmo, _CanvasGizmo3);

  // @param {number}  x,y       - Position in layer coords
  // @param {string}  id        - id string used to tag shapes that represent this gizmo
  function VertexGizmo(layer, x, y, name) {var _this8;_classCallCheck(this, VertexGizmo);
    _this8 = _possibleConstructorReturn(this, _getPrototypeOf(VertexGizmo).call(this, layer, true));
    _this8.setPosition(x, y);
    _this8.setName(name);

    _this8.container.classList.add('vertex-gizmo');return _this8;
  }return VertexGizmo;}(CanvasGizmo);


// A Label filter decides for which shapes we display a label
export var LabelFilter = /*#__PURE__*/function () {

  function LabelFilter() {_classCallCheck(this, LabelFilter);}

  // If false, we don't need to acquire a label at all.
  _createClass(LabelFilter, [{ key: "accepts", value: function accepts(shape, text) {
      return true;
    } }]);return LabelFilter;}();
;

// Get shape width in screen-pixels
var getShapeWidth = function getShapeWidth(shape, layer) {
  // get shape size in screen-pixels
  shape.updateBBox();
  var bbox = shape.bbox;
  var shapeWidth = bbox.max.x - bbox.min.x;
  return shapeWidth * layer.getPixelsPerUnit() * shapeWidth;
};

// By default, we hide labels if text is empty or if the shape size on screen falls beyond a pixel threshold
export var DefaultLabelFilter = /*#__PURE__*/function (_LabelFilter) {_inherits(DefaultLabelFilter, _LabelFilter);

  // @param {number} minWidth - minimum pixel width a shape must have to receive a label
  function DefaultLabelFilter() {var _this9;var minWidth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;_classCallCheck(this, DefaultLabelFilter);
    _this9 = _possibleConstructorReturn(this, _getPrototypeOf(DefaultLabelFilter).call(this));
    _this9.minWidth = minWidth;return _this9;
  }

  // Accept shape if text is not empty and its screen-width is big enough.
  _createClass(DefaultLabelFilter, [{ key: "accepts", value: function accepts(shape, text, layer) {
      var width = getShapeWidth(shape, layer);
      return Boolean(text) && width >= this.minWidth;
    } }]);return DefaultLabelFilter;}(LabelFilter);


// A LabelStyle rule allows to apply css style modifications on a label, e.g., depending on screen size
export var LabelStyleRule = /*#__PURE__*/function () {

  function LabelStyleRule() {_classCallCheck(this, LabelStyleRule);}

  // Note: Labels may be reused for different shapes. So, make sure that the style parameters are 
  //       not just modified for some subset of shapes, but reset for others.
  _createClass(LabelStyleRule, [{ key: "apply", value: function apply(label, shape, text, layer) {} }]);return LabelStyleRule;}();
;

// Fades out based on label size
export var FadeOutStyleRule = /*#__PURE__*/function (_LabelStyleRule) {_inherits(FadeOutStyleRule, _LabelStyleRule);

  // @param {number} rangeStart - shape width in screen-pixels at which the label starts to fade-in
  // @param {number} rangeEnd   - shape width in screen-pixels at which the label is fully opaque.
  function FadeOutStyleRule() {var _this10;var rangeStart = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;var rangeEnd = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 14;_classCallCheck(this, FadeOutStyleRule);
    _this10 = _possibleConstructorReturn(this, _getPrototypeOf(FadeOutStyleRule).call(this));
    _this10.rangeStart = rangeStart;
    _this10.rangeEnd = rangeEnd;return _this10;
  }_createClass(FadeOutStyleRule, [{ key: "apply", value: function apply(

    label, shape, layer) {

      // compute opacity from shape screen-width
      var width = getShapeWidth(shape, layer);
      var t = (width - this.rangeStart) / (this.rangeEnd - this.rangeStart);
      var opacity = THREE.Math.clamp(t, 0, 1);

      label.container.style.opacity = opacity;
    } }]);return FadeOutStyleRule;}(LabelStyleRule);
;

// A ShapeLabelRule maintains a set of labels that is automatically synced with the shapes in a layer.
// It implements the CanvasGizmoBase to update the set of maintained labels.
export var ShapeLabelRule = /*#__PURE__*/function () {

  // @param {EditLayer}               layer            - Labels are shown (and synchronized) with the content of this layer.
  // @param {function(Shape)=>string} shapeToLabelText - A mapping that defines which text to display for a shape. If null, no label is created.
  // @param {LabelFilter}             [filter]         - Defines which labels to show. See DefaultLabelFilter for default behavior.
  // @param {LabelStyleRule}          [styleRule]      - Defines how label style is modified dynamically. (By default, we fade-out based on label size)
  function ShapeLabelRule(layer, shapeToLabelText) {var labelFilter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new DefaultLabelFilter();var styleRule = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new FadeOutStyleRule();_classCallCheck(this, ShapeLabelRule);
    this.layer = layer;
    this.shapeToLabelText = shapeToLabelText;

    // All labels that we created. 
    this.labels = []; // {ShapeLabel[]}
    this.labelsUsed = 0; // All remaining labels in this.labels are hidden and just cached for later reuse.

    this.layer.addCanvasGizmo(this);
    this.visible = true;
    this.layer.update();

    this.filter = labelFilter;
    this.styleRule = styleRule;
  }

  // Replace the rule to define label texts.
  //   @param {function(Shape)=>string} shapeToLabelText - A mapping that defines which text to display for a shape. If null, no label is created.
  _createClass(ShapeLabelRule, [{ key: "setTextRule", value: function setTextRule(shapeToLabelText) {
      this.shapeToLabelText = shapeToLabelText;
      this.update();
    } }, { key: "setVisible", value: function setVisible(

    visible) {
      if (visible === this.visible) {
        return;
      }

      if (visible) {
        // Note: It's essential that we add 'this' first and all maintained labels behind. In this way, this gizmo is updated first to
        //       configure all labels - followed by the update calls for all active labels in use.
        this.layer.addCanvasGizmo(this);
        this.update();
      } else {
        this.clearLabels();
        this.layer.removeCanvasGizmo(this);
      }
      this.visible = visible;
    } }, { key: "dtor", value: function dtor()

    {
      // Make sure that we don't leave any of our labels in the layer
      this.setVisible(false);
    }

    // Hide + release all current labels, so that we can re-acquire them based on latest Layer state.
  }, { key: "clearLabels", value: function clearLabels() {
      for (var i = 0; i < this.labelsUsed; i++) {
        this.labels[i].setShape(null);
        this.labels[i].setVisible(false);
      }
      this.labelsUsed = 0;
    }

    // Create new label or get it from cache
  }, { key: "acquireLabel", value: function acquireLabel() {
      // create new label if necessary
      if (this.labelsUsed === this.labels.length) {
        this.labels.push(new ShapeLabel(null, this.layer));
      }

      return this.labels[this.labelsUsed++];
    } }, { key: "update", value: function update()

    {

      this.clearLabels();

      var shapes = this.layer.shapes;
      for (var i = 0; i < shapes.length; i++) {

        var shape = shapes[i];

        // Get label text 
        var text = this.shapeToLabelText(shape);

        // Check if we want to display a label for this shape
        if (this.filter && !this.filter.accepts(shape, text, this.layer)) {
          continue;
        }

        // Configure label
        var label = this.acquireLabel();
        label.setShape(shape);
        label.setText(text);
        label.setVisible(true);

        // Apply optional custom style rule
        this.styleRule && this.styleRule.apply(label, shape, this.layer);
      }
    } }]);return ShapeLabelRule;}();


// A ShapeToolTip is a label that shows up when hovering a shape.
// By default, it appears a few pixels above the top-right corner of a shape's bbox.
export var ShapeToolTip = /*#__PURE__*/function (_CanvasGizmoBase2) {_inherits(ShapeToolTip, _CanvasGizmoBase2);

  // @param {EditLayer}               layer - Tooltip will appear for all shapes in the given layer.
  // @param {function(shape)=>string} getText - Function to define the text for a given shape
  function ShapeToolTip(layer) {var _this11;var getText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;_classCallCheck(this, ShapeToolTip);
    _this11 = _possibleConstructorReturn(this, _getPrototypeOf(ShapeToolTip).call(this));

    _this11.layer = layer;
    _this11.textCb = getText;
    _this11.viewer = _this11.layer.viewer;

    // track latest mouse position in layer coords (init on first mouse move)
    _this11.mousePos = null;

    // distance between tooltip and shape bbox
    _this11.distanceToBox = 5; // in pixels

    // Create tooltip div
    _this11.container = _this11.getDocument().createElement('div');
    _this11.container.classList.add('adsk-control-tooltip');

    // Add div to viewer canvas container and layer
    _this11.viewer.canvasWrap.appendChild(_this11.container);

    // Update if layer changed
    _this11.layer.addCanvasGizmo(_assertThisInitialized(_this11));

    // Update if mouse moved
    _this11.onMouseMoved = _this11.onMouseMoved.bind(_assertThisInitialized(_this11));
    _this11.viewer.canvasWrap.addEventListener('mousemove', _this11.onMouseMoved);

    _this11.layer.updateCanvasGizmos();return _this11;
  }_createClass(ShapeToolTip, [{ key: "dtor", value: function dtor()

    {
      this.layer.removeCanvasGizmo();
      this.viewer.canvasWrap.removeEventListener('mousemove', this.onMouseMoved);
      this.viewer.canvasWrap.removeChild(this.container);
    }

    // Set callback that defines which text to display for each shape. Returning '' or null will hide the tooltip.
    // @param {function(shape)=>string} getText - Function to define the text for a given shape
  }, { key: "setTextCallback", value: function setTextCallback(getText) {
      this.textCb = getText;
      this.update();
    } }, { key: "onMouseMoved", value: function onMouseMoved(

    event) {

      // Add canvas coords to event
      this.viewer.toolController.__clientToCanvasCoords(event);

      // Track mouse position
      this.mousePos = this.layer.canvasToLayer(event.canvasX, event.canvasY);

      this.update();
    } }, { key: "update", value: function update()

    {

      // If a textCb is set, check shape under mouse
      var shape = this.mousePos && this.textCb && this.layer.hitTest(this.mousePos.x, this.mousePos.y);

      // Choose label text
      var text = shape && this.textCb(shape);

      // Apply text
      this.container.textContent = text || '';

      // Stop here if nothing to display
      if (!text) {
        this.container.style.visibility = 'hidden';
        return;
      }

      // Show label
      this.container.style.visibility = 'visible';

      // Get top-right corner of bbox
      shape.updateBBox(); // Make sure bbox is up-to-date
      var corner = shape.bbox.max;

      // Get anchor in canvas coords
      var anchor = this.layer.layerToCanvas(corner.x, corner.y);

      // Add some pixels y-offset
      anchor.y -= this.distanceToBox;

      // get canvas size
      var width = this.viewer.canvas.width;
      var height = this.viewer.canvas.height;

      // Update tooltip position
      this.container.style.right = width - anchor.x + 'px';
      this.container.style.bottom = height - anchor.y + 'px';

      this.container.style.left = 'auto';
      this.container.style.top = 'auto';
    } }]);return ShapeToolTip;}(CanvasGizmoBase);
;