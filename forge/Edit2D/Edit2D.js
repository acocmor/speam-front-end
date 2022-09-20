function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}import EditLayer from './EditLayer.js';
import { Shape, Style, Polygon, Polyline, PolyBase, Path, Circle, ShapeWrapper } from './EditShapes.js';
import Selection from './Selection.js';
import { Math2D } from './Math2D.js';
import { Actions } from './Actions.js';
import UndoStack from './UndoStack.js';
import Edit2DSnapper from './Edit2DSnapper.js';
import Edit2DContextMenu from './Edit2DContextMenu.js';
import { UnitHandler, DefaultUnitHandler } from './UnitHandler.js';
import { CanvasGizmoBase, CanvasGizmo, EdgeLabel, ShapeLabel, AreaLabel, AlignX, AlignY, VertexGizmo, ShapeLabelRule, ShapeToolTip } from './CanvasGizmo.js';
import TangentGizmo from './TangentGizmo.js';
import SegmentTree from './SegmentTree.js';

import MoveTool from './tools/MoveTool.js';
import PolygonTool from './tools/PolygonTool.js';
import PolygonEditTool from './tools/PolygonEditTool.js';
import InsertSymbolTool from './tools/InsertSymbolTool.js';
import RectangleTool from './tools/RectangleTool.js';
import UndoTool from './tools/UndoTool.js';
import CopyTool from './tools/CopyTool.js';
import LineTool from './tools/LineTool.js';
import { MeasureTransform, DefaultMeasureTransform } from './MeasureTransform.js';

import './Edit2D.css'; // IMPORTANT!!

var myExtensionName = 'Autodesk.Edit2D';
var namespace = AutodeskNamespace('Autodesk.Edit2D');
var av = Autodesk.Viewing;

var OverlayName = 'Edit2D';var

ToolSet =
function ToolSet(name, autoReactivate) {_classCallCheck(this, ToolSet);
  this.name = name;
  this.autoReactivate = autoReactivate;
  this.context = null;
  this.tools = {};
};


/** 
    * Edit2D extension provides API for implementing 2D vector editing. 
    * Loading the extension does not add UI or changes behavior in the viewer. Its purpose is only
    * to provide a basis for other extensions and client applications.
    * 
    * The extension id is: `Autodesk.Edit2D`
    * 
    * @example
    *   viewer.loadExtension('Autodesk.Edit2D')
    *
    * @memberof Autodesk.Viewing.Extensions
    * @see {@link Autodesk.Viewing.Extension} for common inherited methods.
    * @alias Autodesk.Viewing.Extensions.Edit2DExtension
    * @class
    */var
Edit2DExtension = /*#__PURE__*/function (_av$Extension) {_inherits(Edit2DExtension, _av$Extension);
  function Edit2DExtension(viewer, options) {var _this;_classCallCheck(this, Edit2DExtension);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(Edit2DExtension).call(this, viewer, options));

    _this.undoStack = new UndoStack();

    // A map containing all registered Edit 3D tools (value as ToolSet) for a specific tool set name (key)
    _this._registeredTools = new Map();
    _this._boundOnModelAdded = _this._onModelAdded.bind(_assertThisInitialized(_this));
    _this._boundOnModelRemoved = _this._onModelRemoved.bind(_assertThisInitialized(_this));
    _this._boundOnSelectionChanged = _this._onSelectionChanged.bind(_assertThisInitialized(_this));return _this;
  }_createClass(Edit2DExtension, [{ key: "load", value: function () {var _load = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:



                // The overlay "Edit2D" contains subscenes for each edit layer.
                this.viewer.impl.createOverlayScene(OverlayName);

                // We require Snapping and Autodesk.CompGeom (already a dependency of Autodesk.Snapping)
                _context.next = 3;return this.viewer.loadExtension('Autodesk.Snapping');case 3:

                this.viewer.addEventListener(av.MODEL_ADDED_EVENT, this._boundOnModelAdded);
                this.viewer.addEventListener(av.MODEL_REMOVED_EVENT, this._boundOnModelRemoved);

                // activate UndoTool immediately, because it runs in parallel to other tools and for all tools
                this.undoTool = new UndoTool(this.undoStack);
                this.viewer.toolController.registerTool(this.undoTool);
                this.viewer.toolController.activateTool(this.undoTool.getName());case 8:case "end":return _context.stop();}}}, _callee, this);}));function load() {return _load.apply(this, arguments);}return load;}() }, { key: "unload", value: function unload()


    {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
        for (var _iterator = this._registeredTools.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var toolSetName = _step.value;
          this.unregisterTools(toolSetName);
        }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator["return"] != null) {_iterator["return"]();}} finally {if (_didIteratorError) {throw _iteratorError;}}}

      this.viewer.toolController.deregisterTool(this.undoTool);
      this.undoTool = null;

      this.viewer.removeEventListener(av.MODEL_ADDED_EVENT, this._boundOnModelAdded);
      this.viewer.removeEventListener(av.MODEL_REMOVED_EVENT, this._boundOnModelRemoved);

      return true;
    } }, { key: "_onModelAdded", value: function _onModelAdded()

    {var _this2 = this;
      if (this.viewer.getVisibleModels().length !== 1) {
        // Do the reactivation only when the first model got loaded.
        return;
      }var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {

        for (var _iterator2 = this._registeredTools.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var toolSet = _step2.value;
          if (toolSet.autoReactivate) {
            toolSet.toolsToReactivate.forEach(function (name) {return _this2.viewer.toolController.activateTool(name);});
          }
        }} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {_iterator2["return"]();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}
    } }, { key: "_onModelRemoved", value: function _onModelRemoved()

    {
      if (this.viewer.getVisibleModels().length !== 0) {
        // Only deactivate tools when no model is active anymore.
        return;
      }

      var controller = this.viewer.toolController;var _iteratorNormalCompletion3 = true;var _didIteratorError3 = false;var _iteratorError3 = undefined;try {
        for (var _iterator3 = this._registeredTools.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {var toolSet = _step3.value;
          if (toolSet.autoReactivate) {
            // The next statement gets all possible names of all tools of a toolSet,
            // flatten the resulting array
            // and returns a list tool names that are active.
            toolSet.toolsToReactivate = Object.values(toolSet.tools).
            map(function (t) {return t.getNames();}).
            reduce(function (res, names) {return res.concat(names);}, []) // flatten
            .filter(function (name) {return controller.isToolActivated(name);});

            toolSet.toolsToReactivate.forEach(function (name) {return controller.deactivateTool(name);});
          }
        }} catch (err) {_didIteratorError3 = true;_iteratorError3 = err;} finally {try {if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {_iterator3["return"]();}} finally {if (_didIteratorError3) {throw _iteratorError3;}}}
    }

    // If multiple tools are registered, we have to clear the other selections as the mouse events are handled on the first one.
  }, { key: "_onSelectionChanged", value: function _onSelectionChanged(_ref) {var selectionSource = _ref.target;var _iteratorNormalCompletion4 = true;var _didIteratorError4 = false;var _iteratorError4 = undefined;try {
        for (var _iterator4 = this._registeredTools.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {var toolSet = _step4.value;
          if (selectionSource !== toolSet.context.selection && !selectionSource.empty()) {
            toolSet.context.selection.clear();
          }
        }} catch (err) {_didIteratorError4 = true;_iteratorError4 = err;} finally {try {if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {_iterator4["return"]();}} finally {if (_didIteratorError4) {throw _iteratorError4;}}}
    } }, { key: "registerDefaultTools", value: function registerDefaultTools()

    {
      this.defaultContext = this.registerTools('default');
    }

    // Get default tools. registerDefaultTools() must be called first, otherwise it returns null.
  }, { key: "registerTools", value: function registerTools(




    toolSetName) {var autoReactivate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var toolSet = this._registeredTools.get(toolSetName);
      if (toolSet) {
        console.warn("Edit 2D tools are already registered for tool set '".concat(toolSetName, "'"));
        return toolSet.context;
      }

      toolSet = new ToolSet(toolSetName, autoReactivate);
      this._registeredTools.set(toolSetName, toolSet);

      // create context
      var context = toolSet.context = new Edit2DContext(this, toolSetName);
      context.selection.addEventListener(Selection.Events.SELECTION_CHANGED, this._boundOnSelectionChanged);

      // create tools
      toolSet.tools.polygonTool = new PolygonTool(context, PolygonTool.Mode.Polygon);
      toolSet.tools.polylineTool = new PolygonTool(context, PolygonTool.Mode.Polyline);
      toolSet.tools.moveTool = new MoveTool(context);
      toolSet.tools.polygonEditTool = new PolygonEditTool(context);
      toolSet.tools.insertSymbolTool = new InsertSymbolTool(context);
      toolSet.tools.copyTool = new CopyTool(context);

      // register them
      var controller = this.viewer.toolController;
      controller.registerTool(toolSet.tools.polygonTool);
      controller.registerTool(toolSet.tools.polylineTool);
      controller.registerTool(toolSet.tools.moveTool);
      controller.registerTool(toolSet.tools.polygonEditTool);
      controller.registerTool(toolSet.tools.insertSymbolTool);
      controller.registerTool(toolSet.tools.copyTool);

      // activate CopyTool immediately, because they run parallel to other tools
      controller.activateTool(toolSet.tools.copyTool.getName());

      // create and register context mneu
      toolSet.contextMenu = new Edit2DContextMenu(this.viewer, toolSet);
      toolSet.contextMenu.register();

      return context;
    } }, { key: "unregisterDefaultTools", value: function unregisterDefaultTools()

    {
      this.unregisterTools('default');
      this.defaultContext = null;
    } }, { key: "unregisterTools", value: function unregisterTools(

    toolSetName) {
      var toolSet = this._registeredTools.get(toolSetName);
      if (!toolSet) {
        return;
      }

      var controller = this.viewer.toolController;
      controller.deregisterTool(toolSet.tools.polygonTool);
      controller.deregisterTool(toolSet.tools.polylineTool);
      controller.deregisterTool(toolSet.tools.moveTool);
      controller.deregisterTool(toolSet.tools.polygonEditTool);
      controller.deregisterTool(toolSet.tools.insertSymbolTool);
      controller.deregisterTool(toolSet.tools.copyTool);

      toolSet.context.selection.removeEventListener(Selection.Events.SELECTION_CHANGED, this._boundOnSelectionChanged);

      // Unregister and delete context menu
      toolSet.contextMenu.unregister();
      toolSet.contextMenu = null;

      this._registeredTools["delete"](toolSetName);
    } }, { key: "createLayer", value: function createLayer()

    {

      var model = this.viewer.model;
      if (!model) {
        console.error("A 2D model is needed to adjust viewport");
      }

      // create new overlay scene to show
      var layer = new EditLayer(this.viewer);

      // add layer scene to our overlay scene
      this.viewer.impl.overlayScenes[OverlayName].scene.add(layer.scene);

      return layer;
    } }, { key: "defaultTools", get: function get() {var toolSet = this._registeredTools.get('default');return toolSet && toolSet.tools;} }]);return Edit2DExtension;}(av.Extension);


// Common set of objects usually needed by tools
export { Edit2DExtension as default };var Edit2DContext = /*#__PURE__*/function () {

  // @param {Edit2D} ext - Edit2d extension
  function Edit2DContext(ext, toolSetName) {var _this3 = this;_classCallCheck(this, Edit2DContext);
    this.toolSetName = toolSetName;
    this.viewer = ext.viewer;
    this.layer = ext.createLayer();
    this.gizmoLayer = ext.createLayer();
    this.undoStack = ext.undoStack;
    this.selection = new Selection(this.layer, this.undoStack);
    this.snapper = new Edit2DSnapper(this.viewer, this.layer, this.gizmoLayer);
    this.unitHandler = new DefaultUnitHandler(this.viewer);

    // Update all visible labels if display units are changed
    var onUnitChange = function onUnitChange() {
      _this3.layer.updateCanvasGizmos();
      _this3.gizmoLayer.updateCanvasGizmos();
    };
    this.viewer.addEventListener(Autodesk.Viewing.MeasureCommon.Events.DISPLAY_UNITS_CHANGED, onUnitChange);
  }

  // Set matrix that is applied to all displayed geometry
  _createClass(Edit2DContext, [{ key: "setMatrix", value: function setMatrix(matrix) {
      this.layer.setMatrix(matrix);
      this.gizmoLayer.setMatrix(matrix);
      this.layer.update();
      this.gizmoLayer.update();
    } }]);return Edit2DContext;}();


// Register the extension with the extension manager.
Autodesk.Viewing.theExtensionManager.registerExtension(myExtensionName, Edit2DExtension);

namespace.Shape = Shape;
namespace.Polygon = Polygon;
namespace.Polyline = Polyline;
namespace.PolyBase = PolyBase;
namespace.Path = Path;
namespace.Circle = Circle;
namespace.Style = Style;
namespace.PolygonTool = PolygonTool;
namespace.Selection = Selection;
namespace.MoveTool = MoveTool;
namespace.PolygonEditTool = PolygonEditTool;
namespace.InsertSymbolTool = InsertSymbolTool;
namespace.Math2D = Math2D;
namespace.VertexGizmo = VertexGizmo;
namespace.RectangleTool = RectangleTool;
namespace.LineTool = LineTool;
namespace.CopyTool = CopyTool;
namespace.Actions = Actions;
namespace.UndoStack = UndoStack;
namespace.UndoTool = UndoTool;
namespace.Edit2DContext = Edit2DContext;
namespace.CanvasGizmo = CanvasGizmo;
namespace.CanvasGizmoBase = CanvasGizmoBase;
namespace.ShapeLabel = ShapeLabel;
namespace.AlignX = AlignX;
namespace.AlignY = AlignY;
namespace.AreaLabel = AreaLabel;
namespace.EdgeLabel = EdgeLabel;
namespace.UnitHandler = UnitHandler;
namespace.DefaultUnitHandler = DefaultUnitHandler;
namespace.ShapeLabelRule = ShapeLabelRule;
namespace.ShapeWrapper = ShapeWrapper;
namespace.SegmentTree = SegmentTree;
namespace.TangentGizmo = TangentGizmo;
namespace.MeasureTransform = MeasureTransform;
namespace.DefaultMeasureTransform = DefaultMeasureTransform;
namespace.ShapeToolTip = ShapeToolTip;