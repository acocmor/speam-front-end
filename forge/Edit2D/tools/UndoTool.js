function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}var UndoToolname = 'Edit2_UndoTool';

var av = Autodesk.Viewing;

// Simple tool that triggers undo/redo on ctrl-z/ctrl-shift-z
var UndoTool = /*#__PURE__*/function () {

  function UndoTool(undoStack) {_classCallCheck(this, UndoTool);
    this.undoStack = undoStack;
  }_createClass(UndoTool, [{ key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {

      if (keyCode !== av.KeyCode.z || !event.ctrlKey) {
        return false;
      }

      if (event.shiftKey) {
        this.undoStack.redo();
      } else {
        this.undoStack.undo();
      }
    } }, { key: "getName",

    // Some paperwork for ToolController
    value: function getName() {
      return UndoToolname;
    } }, { key: "getNames", value: function getNames()
    {
      return [this.getName()];
    } }, { key: "activate", value: function activate()
    {} }, { key: "deactivate", value: function deactivate()
    {} }, { key: "register", value: function register()
    {} }]);return UndoTool;}();export { UndoTool as default };
;