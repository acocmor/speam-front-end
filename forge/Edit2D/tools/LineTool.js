function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}import { Polyline } from '../EditShapes.js';
import { Actions } from '../Actions.js';
import { Math2D } from '../Math2D.js';

import EditToolBase from './EditToolBase.js';
import { Style } from '../EditShapes';
import { LengthLabel } from '../CanvasGizmo';

var LineToolName = "Edit2_LineTool";

var av = Autodesk.Viewing;

// Draws lines with single drag
var LineTool = /*#__PURE__*/function (_EditToolBase) {_inherits(LineTool, _EditToolBase);

  function LineTool(ctx) {var _this;var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Style();_classCallCheck(this, LineTool);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(LineTool).call(this, ctx));

    _this.style = style;

    // New polyline created by dragging
    _this.line = null;

    // Start/Endpoint of the line being dragged
    _this.startPoint = new THREE.Vector2();
    _this.endPoint = new THREE.Vector2();

    // Indicates that we interrupted dragging with Esc. In this case, we still consume the mouse-up
    // event to avoid inconsistencies in other tool.
    _this.dragCanceled = false;

    // Create length label. Default hidden - showing is optional.
    _this.lengthLabel = new LengthLabel(null, _this.layer, ctx.unitHandler, false);return _this;
  }

  // Enable the length labels (public API)
  _createClass(LineTool, [{ key: "setLengthLabelVisible", value: function setLengthLabelVisible(visible) {
      this.lengthLabel.setVisible(visible);
    } }, { key: "getName", value: function getName()

    {
      return LineToolName + this.nameSuffix;
    } }, { key: "activate", value: function activate()

    {} }, { key: "deactivate", value: function deactivate()
    {} }, { key: "register", value: function register()
    {} }, { key: "handleButtonDown", value: function handleButtonDown(

    event, button) {

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
        return;
      }

      // Make sure that we consider latest end-coords
      this.handleMouseMove(event);

      // If drag has been interrupted, consider the endDrag() as handled
      if (this.dragCanceled) {
        this.dragCanceled = false;
        return true;
      }

      return this.endDrag();
    } }, { key: "handleMouseMove", value: function handleMouseMove(

    event) {

      // Get snapping position. Note that this even makes sense when not dragging: In this case, we 
      // just do it to update the snapping indicator.
      var p = this.getSnapPosition(event.canvasX, event.canvasY);

      if (!this.line) {
        return false;
      }

      this.moveDrag(p, event.shiftKey);

      return true;
    }

    // Start dragging a shape
    //  @param {Shape}   shape
    //  @param {Vector2} startPos - in layer coords
  }, { key: "startDrag", value: function startDrag(startPos) {
      this.line = new Polyline([startPos.clone(), startPos.clone()], this.style.clone());
      this.startPoint.copy(startPos);
      this.endPoint.copy(startPos);

      this.gizmoLayer.addShape(this.line);
    } }, { key: "updateLine", value: function updateLine()

    {

      if (!this.isDragging()) {
        return;
      }

      this.line.updatePoint(1, this.endPoint.x, this.endPoint.y);
      this.gizmoLayer.update();

      this.lengthLabel.setShape(this.line);
    }

    // p is in layer coords
  }, { key: "moveDrag", value: function moveDrag(p, forceQuad) {

      // update rectangle
      this.endPoint.copy(p);
      this.updateLine();
    } }, { key: "endDrag", value: function endDrag()

    {

      if (!this.line) {
        return false;
      }

      // Remove temporary gizmo shape
      this.gizmoLayer.removeShape(this.line);

      // Add line shape if valid
      var lineValid = !Math2D.edgeIsDegenerated(this.startPoint, this.endPoint);
      if (lineValid) {
        this.undoStack.run(new Actions.AddShape(this.layer, this.line));
      }

      this.line = null;

      this.lengthLabel.setShape(null);

      return true;
    } }, { key: "cancelDrag", value: function cancelDrag()

    {
      if (this.line) {
        // Remove temporary gizmo shape
        this.gizmoLayer.removeShape(this.line);
        this.line = null;

        this.dragCanceled = true;

        this.lengthLabel.setShape(null);
      }
    } }, { key: "isDragging", value: function isDragging()

    {
      return Boolean(this.line);
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {
      // Update shape when toggling between rect and quad mode
      if (keyCode == av.KeyCode.SHIFT) {
        this.updateLine(true);
      }
    } }, { key: "handleKeyUp", value: function handleKeyUp(

    event, keyCode) {
      // Update shape when toggling between rect and quad mode
      if (keyCode == av.KeyCode.SHIFT) {
        this.updateLine(false);
      }
    } }]);return LineTool;}(EditToolBase);export { LineTool as default };