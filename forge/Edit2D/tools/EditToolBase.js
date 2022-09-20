function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}

import Selection from '../Selection.js';
import UndoStack from '../UndoStack.js';

var av = Autodesk.Viewing;


// Utility class shared by Edit2D tools to facilitate snapping
var EditToolBase = /*#__PURE__*/function () {

  function EditToolBase(ctx) {var _this = this;_classCallCheck(this, EditToolBase);

    this.viewer = ctx.viewer;
    this.setGlobalManager(this.viewer.globalManager);
    this.layer = ctx.layer;
    this.gizmoLayer = ctx.gizmoLayer;
    this.snapper = ctx.snapper;
    this.selection = ctx.selection;
    this.undoStack = ctx.undoStack;
    this.unitHandler = ctx.unitHandler;
    this.nameSuffix = "_".concat(ctx.toolSetName);

    // If true, all mouse-dragging handlers just return false, so that the events are handled by LMV navigation tools instead.
    this.ignoreDragging = false;

    // This flag is used to avoid triggering handleExternalAction if we triggered an action ourselves.
    this.ignoreActions = false;

    // If another tool applies changes while this tool is active, we want to keep the tool state consistent.
    // E.g., the UndoTool or CopyTool may be active in parallel and may modify/remove a polygon we are working on.
    // his event listener makes sure that handleExternalAction() is called in this case so that this tool can respond. 
    this.onActionCb = function (a) {
      if (!_this.ignoreActions) {
        _this.handleExternalAction(a);
      }
    };

    // indicates if snapping is currently suppressed by hold modifier key
    this.suppressSnapping = false;

    this.keyMap = {
      SnapKey: av.KeyCode.SHIFT, // Holding this key suppresses snapping
      PanKey: av.KeyCode.SPACE // Holding space bypasses all edit tools, so that default navigation (usually panning) steps in
    };

    // When using selection, register a handler to notify about selection changed
    if (this.selection) {
      this.selectionCb = function () {

        // Only respond if tool is activated
        if (!_this.active) {
          return;
        }

        // Call handler if derived class defines one
        _this.onSelectionChanged && _this.onSelectionChanged();
      };

      this.selection.addEventListener(Selection.Events.SELECTION_CHANGED, this.selectionCb);
    }

    this.active = false;

    // Track last mouse position in canvas coords. Note that derived classes must call
    // the base class mouse handlers to keep this value valid.
    this.canvasPos = new THREE.Vector2();

    // Track which keys are currently hold down
    this.keyState = {
      ctrl: false,
      shift: false,
      alt: false };

  }_createClass(EditToolBase, [{ key: "getSnapPosition", value: function getSnapPosition(

    canvasX, canvasY) {var _this2 = this;
      var useSnapper = this.snapper && !this.suppressSnapping;
      if (useSnapper) {
        return this.snapper.getSnapPosition(canvasX, canvasY, function (s) {return _this2.snappingFilter(s);});
      } else {
        // Make sure that we don't keep outdated snapping gizmos
        this.snapper.clearSnappingGizmos();

        // Just convert canvas pos to layer pos
        return this.layer.canvasToLayer(canvasX, canvasY);
      }
    } }, { key: "dtor", value: function dtor()

    {
      if (this.selectionCb) {
        this.selection.removeEventListener(Selection.Events.SELECTION_CHANGED, this.selectionCb);
      }
    } }, { key: "getNames", value: function getNames()

    {
      return [this.getName()];
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {

      this.keyState[keyCode] = true;

      // Hold key to suppress snapping
      if (keyCode === this.keyMap.SnapKey && !this.suppressSnapping) {
        this.suppressSnapping = true;

        // Let tool instantly update hover-gizmos
        this.onSnappingToggled && this.onSnappingToggled(this.canvasPos.x, this.canvasPos.y);
      }

      // While edit tools are active the BACKSPACE key should not make the browser go back in history, otherwise
      // the customer might lose his drawings when he's in an editing session, does a invalid selection and
      // hits backspace.
      if (keyCode === av.KeyCode.BACKSPACE) {
        return true;
      }

      if (keyCode === this.keyMap.PanKey) {
        this.ignoreDragging = true;
      }
    } }, { key: "handleKeyUp", value: function handleKeyUp(

    event, keyCode) {

      this.keyState[keyCode] = false;

      if (keyCode === this.keyMap.SnapKey && this.suppressSnapping) {
        this.suppressSnapping = false;

        // Let tool instantly update hover-gizmos
        this.onSnappingToggled && this.onSnappingToggled(this.canvasPos.x, this.canvasPos.y);
      }

      if (keyCode === this.keyMap.PanKey) {
        this.ignoreDragging = false;
      }
    }

    // Invoked whenever another tool triggered 
  }, { key: "handleExternalAction", value: function handleExternalAction(action) {}

    // Run an action without triggering handleExternalAction
  }, { key: "runAction", value: function runAction(action) {
      this.ignoreActions = true;
      this.undoStack.run(action);
      this.ignoreActions = false;
    } }, { key: "activate", value: function activate()

    {
      this.active = true;
      this.undoStack.addEventListener(UndoStack.AFTER_ACTION, this.onActionCb);
    } }, { key: "deactivate", value: function deactivate()

    {
      this.active = false;
      this.undoStack.removeEventListener(UndoStack.AFTER_ACTION, this.onActionCb);

      // Make sure we don't keep outdated snapping indicators
      this.snapper && this.snapper.clearSnappingGizmos();
    } }, { key: "register", value: function register()

    {}

    // Maps a key event to a function key in the key-map.
  }, { key: "mapKey", value: function mapKey(event, keyMap) {

      for (var key in keyMap) {
        var assigned = keyMap[key];

        // If a single key is assigned to this function and it matches, return the function key
        if (event.keyCode == assigned) {
          return key;
        }

        // If multiple keys are assigned, check if one matches.
        if (Array.isArray(assigned) && assigned.includes(event.keyCode)) {
          return key;
        }
      }
      // event does not match any assigned keyCode
      return null;
    } }, { key: "snappingFilter",

    // By default, we consider all EditShapes for snapping
    value: function snappingFilter() {
      return true;
    }

    // Remember last mouse position
  }, { key: "trackMousePos", value: function trackMousePos(e) {
      this.canvasPos.set(e.canvasX, e.canvasY);
    } }, { key: "handleMouseMove", value: function handleMouseMove(
    e) {this.trackMousePos(e);} }, { key: "handleSingleClick", value: function handleSingleClick(
    e) {this.trackMousePos(e);} }, { key: "handleDoubleClick", value: function handleDoubleClick(
    e) {this.trackMousePos(e);} }, { key: "handleButtonUp", value: function handleButtonUp(
    e) {this.trackMousePos(e);} }, { key: "handleButtonDown", value: function handleButtonDown(
    e) {this.trackMousePos(e);} }]);return EditToolBase;}();export { EditToolBase as default };
;

av.GlobalManagerMixin.call(EditToolBase.prototype);