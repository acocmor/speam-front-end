function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}import { Actions } from '../Actions.js';

var CopyToolName = 'Edit2_CopyTool';

var av = Autodesk.Viewing;

// Apply constant offset in x/y for each paste step, so that shape copies are not exactly on top of the src shapes.
var PasteOffset = 30;var

CopyTool = /*#__PURE__*/function () {

  function CopyTool(ctx) {_classCallCheck(this, CopyTool);

    Autodesk.Viewing.EventDispatcher.prototype.apply(this);

    this.viewer = ctx.viewer;
    this.layer = ctx.layer;
    this.selection = ctx.selection;
    this.undoStack = ctx.undoStack;
    this.nameSuffix = "_".concat(ctx.toolSetName);

    // {Shape[]}
    this.clipBoard = [];

    // After copying some shapes, this counts the number of times that we paste those.
    this.pasteCounter = 0;
  }_createClass(CopyTool, [{ key: "copy", value: function copy()

    {
      this.clipBoard.length = 0;

      var shapes = this.selection.getSelectedShapes();

      // Store the original shapes that get copied for event handlers
      this.originalShapes = shapes;

      // Remember selected shapes
      this.clipBoard = shapes.slice();

      // Reset paste counter
      this.pasteCounter = 0;
    } }, { key: "paste", value: function paste()

    {

      // Track how often we pasted the same clipboard content
      this.pasteCounter++;

      // Compute how far we want to shift the copy that we create.
      // On first paste, we shift by 30pixels, then by 60 etc.
      var offset = this.pasteCounter * PasteOffset * this.layer.getUnitsPerPixel();

      // Insert copies of shapes in the clipboard (+ add offset per paste steps)
      var shapes = [];

      var eventArgs = { type: CopyTool.BEFORE_PASTE, originalShapes: this.originalShapes, veto: false };
      this.dispatchEvent(eventArgs);
      if (eventArgs.veto) {
        return;
      }

      for (var i = 0; i < this.clipBoard.length; i++) {
        var newShape = this.clipBoard[i].clone();

        // Apply offset before cloning, so that another paste will add another offset
        newShape.move(offset, offset);

        // Insert copy
        shapes.push(newShape);
      }

      // Change selection to new shapes
      this.selection.setSelection(shapes);

      this.undoStack.run(new Actions.AddShapes(this.layer, shapes));

      this.dispatchEvent({ type: CopyTool.AFTER_PASTE, originalShapes: this.originalShapes, shapes: shapes });
    }

    // delete all selected shapes
  }, { key: "delete", value: function _delete() {
      var shapes = this.selection.getSelectedShapes();
      this.undoStack.run(new Actions.RemoveShapes(this.layer, shapes));
      this.selection.clear();
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {
      if (!this.selection.empty()) {
        if (keyCode === av.KeyCode.DELETE) {
          this["delete"]();
          return true;
        }

        if (event.ctrlKey && keyCode === av.KeyCode.c) {
          this.copy();
          return true;
        }
      }

      if (this.clipBoard.length !== 0) {
        if (event.ctrlKey && keyCode === av.KeyCode.v) {
          this.paste();
          return true;
        }
      }
    } }, { key: "getName",

    // Some paperwork for ToolController
    value: function getName() {
      return CopyToolName + this.nameSuffix;
    } }, { key: "getNames", value: function getNames()
    {
      return [this.getName()];
    } }, { key: "activate", value: function activate()
    {} }, { key: "deactivate", value: function deactivate()
    {} }, { key: "register", value: function register()
    {} }]);return CopyTool;}();export { CopyTool as default };
;

CopyTool.BEFORE_PASTE = "BEFORE_PASTE";
CopyTool.AFTER_PASTE = "AFTER_PASTE";