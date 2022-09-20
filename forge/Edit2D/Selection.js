function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}import { Style } from './EditShapes.js';
import UndoStack from './UndoStack.js';
import EditLayer from './EditLayer.js';

var av = Autodesk.Viewing;var

Selection = /*#__PURE__*/function () {

  function Selection(layer, undoStack) {var _this = this;_classCallCheck(this, Selection);

    av.EventDispatcher.prototype.apply(this);

    // Keys: shapeIds, Values: shapes
    this.isSelected = {};

    // For mouse-over highlighting. 0 = nothing highlighted (ShapeIds start at 1)
    this.hoveredId = 0;

    // Reused as temporary override style for shapes
    this.tmpStyle = new Style();

    // Callback function that controls how to modify the style on selected shapes
    this.modifier = function (shape, style) {

      // only modify style for selected or hovered shapes
      var isSelected = _this.isSelected[shape.id];
      var isHovered = shape.id === _this.hoveredId;
      if (!isSelected && !isHovered) {
        return undefined;
      }

      // Create a tmp copy of the initial shape style that is modified to indicate highlighting.
      // Note that we can reuse tmpStyle for multiple shapes, because style modifiers are applied right before drawing.
      _this.tmpStyle.copy(style);

      if (isSelected) {
        _this.tmpStyle.fillAlpha = Math.min(_this.tmpStyle.fillAlpha + 0.3, 1);
        _this.tmpStyle.lineWidth *= 1.5;
      } else {
        // hovered
        _this.tmpStyle.fillAlpha = Math.min(_this.tmpStyle.fillAlpha + 0.2, 1);
        _this.tmpStyle.lineWidth *= 1.5;
      }

      return _this.tmpStyle;
    };

    this.layer = layer;
    this.onShapeRemoved = this.onShapeRemoved.bind(this);
    this.onLayerCleared = this.onLayerCleared.bind(this);
    this.layer.addEventListener(EditLayer.SHAPE_REMOVED, this.onShapeRemoved);
    this.layer.addEventListener(EditLayer.LAYER_CLEARED, this.onLayerCleared);

    this.layer.addStyleModifier(this.modifier);

    // Make sure that selection doesn't keep deleted objects, e.g., if creation has undone
    // or a RemoveShape action happened.
    this.undoStack = undoStack;
    this.onActionCb = function (a) {return _this.onAction(a);};
    this.undoStack.addEventListener(UndoStack.AFTER_ACTION, this.onActionCb);
  }_createClass(Selection, [{ key: "dtor", value: function dtor()

    {
      this.layer.removeStyleModifier(this.modifier);
      this.undoStack.removeEventListener(UndoStack.AFTER_ACTION, this.onActionCb);
      this.undoStack.removeEventListener(EditLayer.SHAPE_REMOVED, this.onShapeRemoved);
      this.undoStack.removeEventListener(EditLayer.LAYER_CLEARED, this.onLayerCleared);
    }

    // @param {Shape[]) shapes
  }, { key: "setSelection", value: function setSelection(shapes) {

      // This works for null as well (unlike ES6 default params)
      shapes = shapes || [];

      var selected = this.getSelectedShapes();

      // Check if the set of ids changed
      var changed = false;
      if (selected.length != shapes.length) {
        changed = true;
      } else {
        // Check if any new shape was not selected before
        for (var i = 0; i < shapes.length; i++) {
          var shape = shapes[i];
          if (!this.isSelected[shape.id]) {
            changed = true;
          }
        }
      }

      if (!changed) {
        return;
      }

      // Add all shapes to this.isSelected
      this.isSelected = {};
      for (var _i = 0; _i < shapes.length; _i++) {
        var _shape = shapes[_i];
        this.isSelected[_shape.id] = _shape;
      }
      this.modified();
    } }, { key: "empty", value: function empty()

    {
      return !Object.keys(this.isSelected).length;
    }

    // Set selection to a single shape. Calling with null clears the selection.
  }, { key: "selectOnly", value: function selectOnly(shape) {
      this.setSelection(shape && [shape]);
    } }, { key: "clear", value: function clear()

    {
      this.setSelection([]);
    }

    // Passes all selected shapes to the callback
  }, { key: "getSelectedShapes", value: function getSelectedShapes() {
      return Object.values(this.isSelected);
    } }, { key: "getSelectedIds", value: function getSelectedIds()

    {
      return Object.keys(this.isSelected);
    } }, { key: "modified", value: function modified()

    {
      this.layer.update();
      this.dispatchEvent({ type: Selection.Events.SELECTION_CHANGED });
    } }, { key: "onAction", value: function onAction()

    {

      if (this.empty()) {
        return;
      }

      // Single-selection: Clear selection if selected shape has gone
      var selected = this.getSelectedShapes();
      if (selected.length == 1) {
        var exists = this.layer.findShapeById(selected[0].id);
        if (!exists) {
          this.clear();
        }
        return;
      }

      // Multi-selection: Same principle, but avoiding n^2 runtime for large selections

      // Create dictionary of all shapes in the layer
      var shapeIdExists = {};
      this.layer.shapes.forEach(function (s) {return shapeIdExists[s.id] = true;});

      // Clear all shapes from selection that don't exist anymore
      selected = selected.filter(function (s) {return shapeIdExists[s.id];});
      this.setSelection(selected);
    } }, { key: "onShapeRemoved", value: function onShapeRemoved(_ref)

    {var shape = _ref.shape;
      if (this.empty()) {
        return;
      }

      // Remove the shape from the selection if found.
      if (this.isSelected[shape.id]) {
        delete this.isSelected[shape.id];
        this.modified();
      }
    } }, { key: "onLayerCleared", value: function onLayerCleared()

    {
      if (this.empty()) {
        return;
      }

      this.clear();
    } }, { key: "setHoveredId", value: function setHoveredId(

    id) {

      if (id === this.hoveredId) {
        return;
      }

      this.hoveredId = id;
      this.layer.update();
    } }]);return Selection;}();export { Selection as default };


Selection.Events = {
  SELECTION_CHANGED: 'selectionChanged' };