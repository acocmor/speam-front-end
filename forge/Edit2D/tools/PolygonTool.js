function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _get(target, property, receiver) {if (typeof Reflect !== "undefined" && Reflect.get) {_get = Reflect.get;} else {_get = function _get(target, property, receiver) {var base = _superPropBase(target, property);if (!base) return;var desc = Object.getOwnPropertyDescriptor(base, property);if (desc.get) {return desc.get.call(receiver);}return desc.value;};}return _get(target, property, receiver || target);}function _superPropBase(object, property) {while (!Object.prototype.hasOwnProperty.call(object, property)) {object = _getPrototypeOf(object);if (object === null) break;}return object;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}import { Polygon, Polyline, Style } from '../EditShapes.js';
import { AreaLabel, VertexGizmo, EdgeLabel } from '../CanvasGizmo.js';
import { Actions } from '../Actions.js';

import EditToolBase from './EditToolBase.js';
import RectangleTool from './RectangleTool.js';
import LineTool from './LineTool.js';

var Mode = {
  Polyline: 1,
  Polygon: 2 };


var PolygonToolName = "Edit2_PolygonTool";
var PolylineToolName = "Edit2_PolylineTool";

var av = Autodesk.Viewing;
var DefaultStyle = new Style();var

PolygonTool = /*#__PURE__*/function (_EditToolBase) {_inherits(PolygonTool, _EditToolBase);

  function PolygonTool(ctx) {var _this;var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Mode.Polygon;var style = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Style();_classCallCheck(this, PolygonTool);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(PolygonTool).call(this, ctx));

    // Delegate single-drag interactions: 
    _this.lineRectTool = mode === Mode.Polygon ?
    new RectangleTool(ctx, style) : // PolygonMode: Draw rect/quad on drag
    new LineTool(ctx, style) // PolylineMode: Draw simple line on drag
    ;

    Autodesk.Viewing.EventDispatcher.prototype.apply(_assertThisInitialized(_this));

    // Circle shapes per vertex
    _this.vertexGizmos = [];

    // The polygon/polyline we are currently creating (if tool is active)
    _this.poly = undefined;

    // Style used for polygon creation
    _this.style = style;

    // Style used to display the thin line to connect last added vertex with current mouse position.        
    _this.edgePreviewStyle = new Style({
      lineWidth: 2,
      isScreenSpace: true,
      lineStyle: 11 // dashed line
    });

    // whether editing Polylines or Polygons
    _this.mode = mode;

    // last canvas position where we added a vertex
    _this.lastClickX = undefined;
    _this.lastClickY = undefined;

    _this.keyMap.CANCEL_EDIT = av.KeyCode.ESCAPE;
    _this.keyMap.REMOVE_LAST_VERTEX = av.KeyCode.BACKSPACE;
    _this.keyMap.FINISH_EDIT = [av.KeyCode.ENTER, av.KeyCode.c];

    // FillGizmo: When editing a polygon, fillGizmo displays the polygon formed by all vertices + mousePos
    _this.fillGizmo = null;

    // OutlineGizmo: Polyline that connects all added vertices
    _this.outlineGizmo = null;

    // Line to connect last added vertex with mouse position
    _this.edgePreviewGizmo = null;

    // Last tracked mouse-pos in layer-coords (after considering snapping)
    _this.mousePos = new THREE.Vector2();

    // Label to display polygon area - hidden by default
    // Note that the polygon preview is in the gizmoLayer. So we add the areaLabel there as well to keep it in sync.
    _this.areaLabel = new AreaLabel(null, _this.gizmoLayer, _this.unitHandler, false);

    // Label to display polyline length
    _this.lengthLabel = new EdgeLabel(_this.gizmoLayer, false);return _this;
  }

  // Enable the area labels (public API)
  _createClass(PolygonTool, [{ key: "setAreaLabelVisible", value: function setAreaLabelVisible(visible) {
      this.areaLabel.setVisible(visible);
    } }, { key: "setLengthLabelVisible", value: function setLengthLabelVisible(

    visible) {
      this.lengthLabel.setVisible(visible);
    } }, { key: "deactivate", value: function deactivate()

    {
      _get(_getPrototypeOf(PolygonTool.prototype), "deactivate", this).call(this);
      this.cancelEdit();
    }

    // Returns true when editing a Polygon, false when editing a Polyline or nothing.
  }, { key: "isPolygon", value: function isPolygon() {
      return this.poly instanceof Polygon;
    }

    /**
       * Set depending styles for the polygon / polyline tool. It will also set most of the styles to the temporary lines
       * that appear during drawing. Style.isScreenSpace won't be considered.
       * @param {Style} style         - a Style instance
       * @param {boolean} skipDefault - If set (default) just apply the style that differ from the default Style
       */ }, { key: "setStyles", value: function setStyles(
    style) {var skipDefault = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      if (style.lineColor !== DefaultStyle.lineColor || !skipDefault) {
        this.style.lineColor = style.lineColor;
      }
      if (style.lineAlpha !== DefaultStyle.lineAlpha || !skipDefault) {
        this.style.lineAlpha = style.lineAlpha;
      }
      if (style.lineWidth !== DefaultStyle.lineWidth || !skipDefault) {
        this.style.lineWidth = style.lineWidth;
        this.lineRectTool.style.lineWidth = style.lineWidth;
        this.edgePreviewStyle.lineWidth = style.lineWidth * 2 / 3;
      }
      if (style.lineStyle !== DefaultStyle.lineStyle || !skipDefault) {
        this.style.lineStyle = style.lineStyle;
        this.lineRectTool.style.lineStyle = style.lineStyle;
        // skip this.edgePreviewStyle.lineStyle
      }

      if (style.fillColor !== DefaultStyle.fillColor || !skipDefault) {
        this.style.fillColor = style.fillColor;
      }
      if (style.fillAlpha !== DefaultStyle.fillAlpha || !skipDefault) {
        this.style.fillAlpha = style.fillAlpha;
      }

      // skip isScreenSpace
    }

    // Initialize all gizmos when starting to edit a Polygon/Polyline
  }, { key: "initGizmos", value: function initGizmos() {

      // FillGizmo: Draw fill of polygon formed by added vertices + mousePos
      if (this.isPolygon()) {
        this.fillGizmo = new Polygon([], this.style.clone());
        this.fillGizmo.style.lineAlpha = 0;
        this.gizmoLayer.addShape(this.fillGizmo);
      }

      // OutlineGizmo: Connect added vertices
      this.outlineGizmo = new Polyline([], this.style.clone());
      this.gizmoLayer.addShape(this.outlineGizmo);

      // CurrentEdgeGizmo: Draw dashed line from last vertex to mousePos.
      this.edgePreviewGizmo = new Polyline([], this.edgePreviewStyle);
      this.edgePreviewGizmo.style.lineColor = this.poly.style.lineColor;
      this.gizmoLayer.addShape(this.edgePreviewGizmo);

      this.areaLabel.setShape(this.fillGizmo);

      // For Polylines, attach label to preview edge that displays the summed length
      if (this.poly && this.poly.isPolyline()) {
        this.lengthLabel.attachToEdge(this.edgePreviewGizmo, 0);
      }
    } }, { key: "clearGizmos", value: function clearGizmos()

    {
      if (this.fillGizmo) {
        this.gizmoLayer.removeShape(this.fillGizmo);
        this.fillGizmo = null;
      }

      this.areaLabel.setShape(null);
      this.lengthLabel.detachFromEdge();

      if (this.outlineGizmo) {
        this.gizmoLayer.removeShape(this.outlineGizmo);
        this.outlineGizmo = null;
      }

      if (this.edgePreviewGizmo) {
        this.gizmoLayer.removeShape(this.edgePreviewGizmo);
        this.edgePreviewGizmo = null;
      }

      // clear vertex gizmos
      for (var i = 0; i < this.vertexGizmos.length; i++) {
        this.vertexGizmos[i].dtor();
      }
      this.vertexGizmos.length = 0;
    }

    // Update gizmos and snapping if polygon was modified
  }, { key: "polyModified", value: function polyModified() {
      this.updateGizmos();

      // Configure angle snapping to consider latest state of the polygon
      // Note that angleSnapper requires the shape including "vertex under mouse", while
      // this.poly only contains the already added/clicked vertices.
      // Note that we cannot use fillGizmo here, because it does not exist for polylines.
      var snapGeom = this.poly.clone();
      snapGeom.addPoint(this.mousePos.x, this.mousePos.y);
      this.snapper.startAngleSnapping(snapGeom, this.poly.vertexCount);
    }

    // Update gizmos if vertices of current polygon/polyline have changed
  }, { key: "updateGizmos", value: function updateGizmos() {

      // FillGizmo: Show fill without outline for the polygon formed by all added
      // vertices + current mousePos
      if (this.fillGizmo) {
        // copy vertices of main polygon (not geom, not style)
        this.fillGizmo.clear();
        for (var i = 0; i < this.poly.vertexCount; i++) {
          var p = this.poly.getPoint(i);
          this.fillGizmo.addPoint(p.x, p.y);
        }
        // add additional point that traces mouse-pos
        this.fillGizmo.addPoint(this.mousePos.x, this.mousePos.y);
      }

      // OutlineGizmo: Solid polyline that connects all added vertices
      this.outlineGizmo.clear();
      if (this.poly.vertexCount >= 2) {
        for (var _i = 0; _i < this.poly.vertexCount; _i++) {
          var _p = this.poly.getPoint(_i);
          this.outlineGizmo.addPoint(_p.x, _p.y);
        }
      }

      // currentEdgeGizmo: Dashed line to connect last added vertex with mouse position
      this.edgePreviewGizmo.clear();
      if (this.poly.vertexCount >= 1) {
        var pLast = this.poly.getPoint(this.poly.vertexCount - 1);
        this.edgePreviewGizmo.addPoint(pLast.x, pLast.y);
        this.edgePreviewGizmo.addPoint(this.mousePos.x, this.mousePos.y);

        this.updateLengthLabel();
      }

      this.gizmoLayer.update();
    } }, { key: "updateLengthLabel", value: function updateLengthLabel()

    {
      // Compute resulting length of polyline including previewEdge
      if (this.poly && this.poly.isPolyline()) {
        // get transform from geometry coords to measure coordinate system
        var transform = this.unitHandler.measureTransform;

        var length = this.poly.getLength(transform) + this.edgePreviewGizmo.getLength(transform);
        var lengthStr = this.unitHandler.lengthToString(length);
        this.lengthLabel.setText(lengthStr);
      }
    } }, { key: "getName", value: function getName()

    {
      return (this.mode === Mode.Polygon ? PolygonToolName : PolylineToolName) + this.nameSuffix;
    } }, 
    
    { key: "handleMouseMove", value: function handleMouseMove(event) {
      _get(_getPrototypeOf(PolygonTool.prototype), "handleMouseMove", this).call(this, event);

      if (!event.buttons) {
        // When not dragging, we always return false here. Otherwise, the event will not propagated
        // to navigation tools, so that the zoom focus is not updated properly.
        this.onHover(event.canvasX, event.canvasY);
        return false;
      }
      return this.lineRectTool.handleMouseMove(event);
    } }, 
    
    { key: "onHover", value: function onHover(canvasX, canvasY) {
      // Check if shape editing is already in progress
      if (!this.poly) {
        // Perform snapping check, so that SnappingIndicator reflects if the start point would be snapped.
        this.getSnapPosition(canvasX, canvasY);
        return;
      }

      var pLayer = this.layer.canvasToLayer(canvasX, canvasY);

      // When hovering the start vertex that will close the polygon (or line-loop), don't show any snapping indicators
      var closingAllowed = this.poly.vertexCount >= 3;
      var startVertexHit = closingAllowed && this.vertexGizmos[0].isUnderMouse;
      this.setStartVertexHighlighted(startVertexHit); // indicate when hoving closing-vertex
      if (startVertexHit) {
        // Remove snapping indicators
        this.snapper.clearSnappingGizmos();

        // snap position to vertex center
        pLayer.copy(this.vertexGizmos[0].layerPos);
      } else {
        // Standard case: If mouse is not on start vertex, allow standard snapping
        pLayer = this.getSnapPosition(canvasX, canvasY);
      }

      // track last mouse pos
      this.mousePos.copy(pLayer);

      // Just hover: Only update vertex-positions for fillGizmo, edgePreview and alignmentGizmo
      this.edgePreviewGizmo.updatePoint(1, pLayer.x, pLayer.y);
      this.fillGizmo && this.fillGizmo.updatePoint(this.fillGizmo.vertexCount - 1, pLayer.x, pLayer.y); // will be null if this.poly is a Polyline
      this.gizmoLayer.update();
      this.updateLengthLabel();
    }

    // If we have enough vertices, clicking on the first vertex gizmo again will finish the shape.
  }, { key: "handleStartVertexClicked", value: function handleStartVertexClicked(event) {

      if (!this.poly && this.poly.vertexCount < 3) {
        return;
      }

      // For polylines, we have to repeat the first vertex to close it
      if (this.poly.isPolyline()) {
        var pStart = this.poly.getPoint(0);
        this.addVertex(pStart.x, pStart.y);
      }

      // Finish editing
      this.finishPolygon();

      // Make sure that the event is not passed on to ToolManager. Otherwise,
      // we would evaluate it a second time in handleSingleClick()
      event.stopPropagation();
    }

    // Add vertex on single-click
  }, { key: "handleSingleClick", value: function handleSingleClick(event, button) {
      _get(_getPrototypeOf(PolygonTool.prototype), "handleSingleClick", this).call(this, event, button);

      // Only respond to left mouse button.
      if (!button == 0) {
        return false;
      }

      // Avoid duplicate vertices on double-clicks
      if (this.vertexGizmos.length > 0 && event.canvasX === this.lastClickX && event.canvasY === this.lastClickY) {
        return true;
      }

      this.lastClickX = event.canvasX;
      this.lastClickY = event.canvasY;

      this.mousePos.copy(this.getSnapPosition(event.canvasX, event.canvasY));

      // Init polygon on first click
      if (!this.poly) {
        this.startPoly(this.mousePos.x, this.mousePos.y);
      }

      this.addVertex(this.mousePos.x, this.mousePos.y);
      return true;
    } }, { key: "handleButtonDown", value: function handleButtonDown(

    event, button) {
      // Support suppressing mouse buttons by holding a key. Note that we only need that for dragging operations.
      if (this.ignoreDragging) {
        return false;
      }

      // If no clicks have been made so far, allow to drag line/rectangle.
      if (!this.poly) {
        // Clear the selection, this will make sure all other gizmos get removed
        this.selection.clear();

        return this.lineRectTool.handleButtonDown(event, button);
      }

      return false;
    } }, { key: "handleButtonUp", value: function handleButtonUp(

    event, button) {
      return this.lineRectTool.handleButtonUp(event, button);
    } }, { key: "handleDoubleClick", value: function handleDoubleClick(

    event, button) {
      _get(_getPrototypeOf(PolygonTool.prototype), "handleDoubleClick", this).call(this, event, button);

      // Only respond to left mouse button.
      if (!button == 0) {
        return false;
      }

      this.finishPolygon();
      return true;
    }

    // Start new polyline or polygon
  }, { key: "startPoly", value: function startPoly(x, y) {

      if (this.mode === Mode.Polygon) {
        this.poly = new Polygon([], this.style.clone());
      } else {
        this.poly = new Polyline([], this.style.clone());
      }

      this.initGizmos();
    } }, 
    
    { key: "addVertex", value: function addVertex(x, y) {var _this2 = this;

      // add "next" point - which will follow the mouse motion 
      // until next click
      this.poly.addPoint(x, y);

      // add vertex-gizmo
      var name = 'PolygonTool_vertexGizmo_' + this.vertexGizmos.length;
      var vertex = new VertexGizmo(this.gizmoLayer, x, y, name);
      this.vertexGizmos.push(vertex);

      // For the start vertex-gizmo, we register a handler to finish the polygon when clicking it again
      var isStartVertex = this.vertexGizmos.length === 1;
      if (isStartVertex) {
        vertex.container.addEventListener('click', function (e) {return _this2.handleStartVertexClicked(e);});
      }

      this.polyModified();
    } }, { key: "removeLastVertex", value: function removeLastVertex()

    {
      if (!this.poly || !this.poly.vertexCount) {
        return;
      }

      // Cancel edit if there was only the starting point.
      if (this.poly.vertexCount <= 1) {
        this.cancelEdit();
        return;
      }

      this.poly.removePoint(this.poly.vertexCount - 1);

      // remove last added vertex gizmo
      var lastGizmo = this.vertexGizmos[this.vertexGizmos.length - 1];
      lastGizmo.dtor();
      this.vertexGizmos.pop();

      this.polyModified();
    } }, { key: "finishPolygon", value: function finishPolygon()

    {

      // remove all vertex gizmos
      this.clearGizmos();

      // Stop snapping to edges of this polygon
      this.snapper.stopAngleSnapping();

      // move polygon to main layer
      this.runAction(new Actions.AddShape(this.layer, this.poly));

      this.dispatchEvent({ type: PolygonTool.POLYGON_ADDED, polygon: this.poly });

      // Start another polygon on next click
      this.poly = null;
    } }, { key: "cancelEdit", value: function cancelEdit()

    {

      if (this.lineRectTool.isDragging()) {
        this.lineRectTool.cancelDrag();
      }

      if (this.poly) {
        this.gizmoLayer.removeShape(this.poly);
        this.poly = null;
      }

      this.clearGizmos();
      this.snapper.stopAngleSnapping();
    } }, { key: "handleFinishKey", value: function handleFinishKey(

    event) {
      if (!this.poly) {
        return false;
      }

      // Avoid closing if it would result in a polygon that is degenerated to a line.
      if (this.isPolygon() && this.poly.vertexCount < 3) {
        return false;
      }

      this.finishPolygon();
      return true;
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {
      var handled = _get(_getPrototypeOf(PolygonTool.prototype), "handleKeyDown", this).call(this, event, keyCode);

      // delegate to rectTool
      handled = this.lineRectTool.handleKeyDown(event, keyCode) || handled;

      // Map event to any known key in this.keyMap
      var funcKey = this.mapKey(event, this.keyMap);
      switch (funcKey) {
        case 'CANCEL_EDIT':this.cancelEdit();handled = true;break;
        case 'REMOVE_LAST_VERTEX':this.removeLastVertex();handled = true;break;
        case 'FINISH_EDIT':handled = this.handleFinishKey(event);break;}

      return handled;
    } }, { key: "handleKeyUp", value: function handleKeyUp(

    event, keyCode) {
      _get(_getPrototypeOf(PolygonTool.prototype), "handleKeyUp", this).call(this, event, keyCode);
      this.lineRectTool.handleKeyUp(event, keyCode);
    }

    // If snapping has toggled on/off, we instantly "replay" hovering at current mouse position. Purpose is to
    // give instant feedback (e.g. hide/show SnapLine gizmos and adjust position of preview edge)
  }, { key: "onSnappingToggled", value: function onSnappingToggled(canvasX, canvasY) {
      this.onHover(canvasX, canvasY);
    } }, { key: "mouseOnStartVertex", value: function mouseOnStartVertex(

    event) {
      if (!this.vertexGizmos[0]) {
        return false;
      }

      // Check if start vertex was clicked
      var pLayer = this.layer.canvasToLayer(event.canvasX, event.canvasY);
      return this.vertexGizmos[0].isUnderMouse;
    } }, { key: "setStartVertexHighlighted", value: function setStartVertexHighlighted(

    enable) {
      if (this.vertexGizmos[0]) {
        this.vertexGizmos[0].setSelected(enable);
      }
    } }, { key: "getCursor", value: function getCursor()

    {
      return 'crosshair';
    } }]);return PolygonTool;}(EditToolBase);export { PolygonTool as default };


PolygonTool.POLYGON_ADDED = "polygonAdded";
PolygonTool.Mode = Mode;