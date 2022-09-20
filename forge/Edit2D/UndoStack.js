function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
var av = Autodesk.Viewing;var

UndoStack = /*#__PURE__*/function () {

  function UndoStack() {_classCallCheck(this, UndoStack);

    av.EventDispatcher.prototype.apply(this);

    // Array of action objects
    this.stack = [];

    // By default, this simply points to the end of this.stack. Only if undo has been called, 
    // it points to the next operation to be run on a redo() call
    this.current = 0;
  }

  // Executes an action and pushes it to the undo stack
  _createClass(UndoStack, [{ key: "run", value: function run(action) {
      // If we did a couple of undos before, a new operation will clear all redo steps
      this.stack.length = this.current;

      this.dispatchEvent({ type: UndoStack.BEFORE_ACTION, action: action });

      action.redo();

      this.dispatchEvent({ type: UndoStack.AFTER_ACTION, action: action });

      this.stack.push(action);
      this.current = this.stack.length;
    } }, { key: "undo", value: function undo()

    {
      if (!this.current) {
        // We reached the beginning of the stack
        return false;
      }
      this.current--;

      var action = this.stack[this.current];

      this.dispatchEvent({ type: UndoStack.BEFORE_ACTION, action: action, isUndo: true });

      action.undo();

      this.dispatchEvent({ type: UndoStack.AFTER_ACTION, action: action, isUndo: true });

      action.layer.update();

      return true;
    } }, { key: "redo", value: function redo()

    {
      var action = this.stack[this.current];
      if (!action) {
        // Nothing to redo
        return false;
      }

      this.dispatchEvent({ type: UndoStack.BEFORE_ACTION, action: action, isUndo: false });

      action.redo();

      this.dispatchEvent({ type: UndoStack.AFTER_ACTION, action: action, isUndo: false });

      this.current++;

      action.layer.update();

      return true;
    } }, { key: "clear", value: function clear()

    {
      this.stack.length = 0;
      this.current = 0;
    } }]);return UndoStack;}();


// Events sent before/after any action is executed by UndoStack
export { UndoStack as default };UndoStack.BEFORE_ACTION = 'beforeAction';
UndoStack.AFTER_ACTION = 'afterAction';