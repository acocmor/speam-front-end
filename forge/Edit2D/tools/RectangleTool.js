function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}
import { Polygon } from '../EditShapes.js';
import { Actions } from '../Actions.js';

import EditToolBase from './EditToolBase.js';
import { Style } from '../EditShapes.js';
import { AreaLabel } from '../CanvasGizmo.js';
import ModifierMask from '../ModifierMask.js';

var RectangleToolName = "Edit2_RectangleTool";

var av = Autodesk.Viewing;

// Creates rectangles by dragging
var RectangleTool = /*#__PURE__*/function (_EditToolBase) {_inherits(RectangleTool, _EditToolBase);

  function RectangleTool(ctx) {var _this;var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Style();_classCallCheck(this, RectangleTool);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(RectangleTool).call(this, ctx));

    Autodesk.Viewing.EventDispatcher.prototype.apply(_assertThisInitialized(_this));

    _this.style = style;

    // New polygon created by dragging
    _this.rect = null;

    // First corner of the new rectangle
    _this.startPoint = new THREE.Vector2();
    _this.endPoint = new THREE.Vector2();

    // Indicates that we interrupted dragging with Esc. In this case, we still consume the mouse-up
    // event to avoid inconsistencies in other tool.
    _this.dragCanceled = false;

    // Create area label. Default hidden - showing is optional.
    _this.areaLabel = new AreaLabel(null, _this.layer, ctx.unitHandler, false);

    // Allow to enable/disable tool based on modifiers
    _this.modifiers = new ModifierMask();return _this;
  }

  // Enable the area labels (public API)
  _createClass(RectangleTool, [{ key: "setAreaLabelVisible", value: function setAreaLabelVisible(visible) {
      this.areaLabel.setVisible(visible);
    } }, { key: "getName", value: function getName()

    {
      return RectangleToolName + this.nameSuffix;
    } }, { key: "activate", value: function activate()

    {} }, { key: "deactivate", value: function deactivate()
    {} }, { key: "register", value: function register()
    {} }, { key: "handleButtonDown", value: function handleButtonDown(

    event, button) {

      // Check if modifers allow starting an interaction
      if (!this.modifiers.accepts(event)) {
        return false;
      }

      // Only respond to left button
      if (button != 0) {
        return;
      }

      var p = this.getSnapPosition(event.canvasX, event.canvasY);
      this.startDrag(p);
      return true;
    } }, { key: "handleButtonUp", value: function handleButtonUp(

    event, button) {

      // Only respond to left button
      if (button != 0) {
        return false;
      }

      // If drag has been interrupted, consider the endDrag() as handled
      if (this.dragCanceled) {
        this.dragCanceled = false;
        return true;
      }

      // Make sure that we consider latest mouse position
      this.handleMouseMove(event);

      return this.endDrag();
    } }, { key: "handleMouseMove", value: function handleMouseMove(

    event) {

      // Get snapping position. Note that this even makes sense when not dragging: In this case, we 
      // just do it to update the snapping indicator.
      var p = this.getSnapPosition(event.canvasX, event.canvasY);

      if (!this.rect) {
        return false;
      }

      this.moveDrag(p, event.shiftKey);

      return true;
    }

    // Start dragging a shape
    //  @param {Shape}   shape
    //  @param {Vector2} startPos - in layer coords
  }, { key: "startDrag", value: function startDrag(startPos) {
      this.rect = new Polygon([startPos.clone(), startPos.clone(), startPos.clone(), startPos.clone()], this.style.clone());
      this.startPoint.copy(startPos);
      this.endPoint.copy(startPos);

      this.gizmoLayer.addShape(this.rect);
    } }, { key: "updateRect", value: function updateRect(

    forceQuad) {

      if (!this.isDragging()) {
        return;
      }

      var p0 = this.startPoint;
      var p1 = this.endPoint;

      if (forceQuad) {

        // Use maximum of dx/dy as edge length
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;

        var edgeLength = Math.max(Math.abs(dx), Math.abs(dy));

        // Consider drag direction to span quad right/left resp. up/down
        var sx = Math.sign(dx);
        var sy = Math.sign(dy);

        this.rect.updatePoint(1, p0.x + edgeLength * sx, p0.y);
        this.rect.updatePoint(2, p0.x + edgeLength * sx, p0.y + edgeLength * sy);
        this.rect.updatePoint(3, p0.x, p0.y + edgeLength * sy);

      } else {
        this.rect.updatePoint(1, p1.x, p0.y);
        this.rect.updatePoint(2, p1.x, p1.y);
        this.rect.updatePoint(3, p0.x, p1.y);
      }

      this.gizmoLayer.update();

      this.areaLabel.setShape(this.rect);
    }

    // p is in layer coords
  }, { key: "moveDrag", value: function moveDrag(p, forceQuad) {

      // update rectangle
      this.endPoint.copy(p);
      this.updateRect(forceQuad);
    } }, { key: "endDrag", value: function endDrag()

    {

      if (!this.rect) {
        return false;
      }

      // Check if rect is valid
      var dx = this.endPoint.x - this.startPoint.x;
      var dy = this.endPoint.y - this.startPoint.y;
      var Eps = 1.e-10;
      var rectValid = Math.abs(dx) > Eps && Math.abs(dy) > Eps;

      // Move shape to main layer (or just remove if invalid)
      this.gizmoLayer.removeShape(this.rect);
      if (rectValid) {
        this.undoStack.run(new Actions.AddShape(this.layer, this.rect));
      }

      this.rect = null;

      this.areaLabel.setShape(null);

      return true;
    } }, { key: "cancelDrag", value: function cancelDrag()

    {
      if (this.rect) {
        // Remove temporary gizmo shape
        this.gizmoLayer.removeShape(this.rect);
        this.rect = null;

        this.dragCanceled = true;

        this.areaLabel.setShape(null);
      }
    } }, { key: "isDragging", value: function isDragging()

    {
      return Boolean(this.rect);
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {
      // Update shape when toggling between rect and quad mode
      if (keyCode == av.KeyCode.SHIFT) {
        this.updateRect(true);
      }
    } }, { key: "handleKeyUp", value: function handleKeyUp(

    event, keyCode) {
      // Update shape when toggling between rect and quad mode
      if (keyCode == av.KeyCode.SHIFT) {
        this.updateRect(false);
      }
    } }]);return RectangleTool;}(EditToolBase);export { RectangleTool as default };