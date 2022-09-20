function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
import { Actions } from '../Actions.js';

var MoveToolName = "Edit2_MoveTool";

var av = Autodesk.Viewing;var

MoveTool = /*#__PURE__*/function () {

  function MoveTool(ctx) {_classCallCheck(this, MoveTool);

    this.layer = ctx.layer;
    this.selection = ctx.selection;
    this.undoStack = ctx.undoStack;
    this.nameSuffix = "_".concat(ctx.toolSetName);

    // Only set during dragging
    this.shape = null;

    // drag-start position in layer coords
    this.dragStartPoint = new THREE.Vector2();

    // backup original shape on drag-start as long as we are modifying it on-hover
    this.backupShape = null;

    this.keyMap = {
      CancelEdit: av.KeyCode.ESCAPE };


    // Remember last mouse-pos on mouse-move events
    this.lastMousePos = new THREE.Vector2(); // in layer coords
  }_createClass(MoveTool, [{ key: "getNames", value: function getNames()

    {
      return [this.getName()];
    } }, { key: "getName", value: function getName()

    {
      return MoveToolName + this.nameSuffix;
    } }, { key: "activate", value: function activate()

    {} }, { key: "deactivate", value: function deactivate()
    {} }, { key: "register", value: function register()
    {} }, { key: "handleButtonDown", value: function handleButtonDown(

    event, button) {
      // Only respond to left button
      if (button !== 0) {
        return;
      }

      var p = this.layer.canvasToLayer(event.canvasX, event.canvasY);
      var hitShape = this.layer.hitTest(p.x, p.y);

      if (hitShape) {
        this.startDrag(hitShape, p);
      }

      // Set selection to the shape that we picked
      if (this.shape) {
        this.selection.selectOnly(this.shape);
      } else {
        this.selection.clear();
      }

      return Boolean(this.shape);
    }

    // Start dragging a shape
    //  @param {Shape}   shape
    //  @param {Vector2} startPos - in layer coords
  }, { key: "startDrag", value: function startDrag(shape, startPos) {
      this.shape = shape;
      this.dragStartPoint.copy(startPos);
      this.backupShape = shape.clone();
    }

    // p is in layer coords
  }, { key: "moveDrag", value: function moveDrag(p) {
      var dx = p.x - this.dragStartPoint.x;
      var dy = p.y - this.dragStartPoint.y;

      // Apply this offset to shape. We always start with the original shape as a reference 
      // to avoid accumulating delta inaccuracies.
      this.shape.copy(this.backupShape);
      this.shape.move(dx, dy);
      this.layer.update();
    }

    // Clean up data hold during a drag interaction
  }, { key: "resetDragging", value: function resetDragging() {
      this.shape = null;
      this.backupShape = null;
    } }, { key: "endDrag", value: function endDrag(

    p) {
      // No drag active
      if (!this.shape) {
        return;
      }

      // Revert any temporary modifications done during mouse move
      this.shape.copy(this.backupShape);

      // Apply move operation
      var dx = p.x - this.dragStartPoint.x;
      var dy = p.y - this.dragStartPoint.y;
      this.undoStack.run(new Actions.MoveShape(this.layer, this.shape, dx, dy));

      if (this.shape) {
        this.shape = null;
        return true;
      }
      return false;
    } }, { key: "cancelDrag", value: function cancelDrag()

    {
      if (this.isDragging()) {

        // Revert shape o state when dragging was started
        this.shape.copy(this.backupShape);
        this.layer.update();

        this.resetDragging();
      }
    } }, { key: "isDragging", value: function isDragging()

    {
      return Boolean(this.shape);
    } }, { key: "handleMouseMove", value: function handleMouseMove(

    event) {

      // Get and store latest mouse position
      var p = this.layer.canvasToLayer(event.canvasX, event.canvasY);
      this.lastMousePos.copy(p);

      if (!this.shape) {
        return false;
      }

      // get delta between last and current position        
      this.moveDrag(p);

      return true;
    } }, { key: "handleButtonUp", value: function handleButtonUp(

    event, button) {
      // Only respond to left button
      if (button !== 0) {
        return;
      }

      var p = this.layer.canvasToLayer(event.canvasX, event.canvasY);
      return this.endDrag(p);
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {
      if (keyCode === this.keyMap.CancelEdit) {
        this.cancelDrag();
      }
    }

    // Display move cursor if a shape is under mouse or if we are dragging
  }, { key: "getCursor", value: function getCursor() {
      if (this.shape) {
        return 'move';
      }

      // Show move cursor if a shape is under mouse
      var shapeAtMouse = this.layer.hitTest(this.lastMousePos.x, this.lastMousePos.y);
      return shapeAtMouse ? 'move' : undefined;
    } }]);return MoveTool;}();export { MoveTool as default };