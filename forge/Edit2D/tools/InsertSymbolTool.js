function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}
import { Style, Circle } from "../EditShapes.js";
import { Actions } from "../Actions.js";
import EditToolBase from "./EditToolBase";

var InsertSymbolToolName = "Edit2_InsertSymbolTool";
var InsertSymbolTool = /*#__PURE__*/ (function (_EditToolBase) {
  _inherits(InsertSymbolTool, _EditToolBase);

  function InsertSymbolTool(ctx) {
    var _this;
    _classCallCheck(this, InsertSymbolTool);
    _this = _possibleConstructorReturn(
      this,
      _getPrototypeOf(InsertSymbolTool).call(this, ctx)
    );

    Autodesk.Viewing.EventDispatcher.prototype.apply(
      _assertThisInitialized(_this)
    );

    _this.symbol = new Circle(
      0,
      0,
      0.2,
      new Style({
        fillAlpha: 1.0,
        lineWidth: 0.01,
        fillColor: "rgb(255, 255, 0)",
      })
    );

    return _this;
  }
  _createClass(InsertSymbolTool, [
    {
      key: "getName",
      value: function getName() {
        return InsertSymbolToolName + this.nameSuffix;
      },
    },
    { key: "activate", value: function activate() {} },
    { key: "deactivate", value: function deactivate() {} },
    { key: "register", value: function register() {} },
    {
      key: "setSymbol",
      value: function setSymbol(symbol) {
        this.symbol = symbol;
      },
    },
    { key: "handleMouseMove", value: function handleMouseMove(event) {} },
    {
      key: "handleSingleClick",
      value: function handleSingleClick(event) {
        var res = this.layer.canvasToLayer(event.canvasX, event.canvasY);
        var symbol = this.symbol.clone();
        symbol.move(res.x, res.y);
        this.undoStack.run(new Actions.AddShape(this.layer, symbol));
        this.dispatchEvent({
          type: InsertSymbolTool.SYMBOL_INSERTED,
          symbol: symbol,
        });

        return true;
      },
    },
    {
      key: "handleAutoDraw",
      value: function handleAutoDraw(position) {
        var symbol = this.symbol.clone();
        symbol.move(position.x, position.y);
        this.undoStack.run(new Actions.AddShape(this.layer, symbol));
        this.dispatchEvent({
          type: InsertSymbolTool.SYMBOL_INSERTED,
          symbol: symbol,
        });
        return true;
      },
    },

    {
      key: "handleDoubleClick",
      value: function handleDoubleClick() /*event , button */ {
        return true;
      },
    },
    {
      key: "getCursor",
      value: function getCursor() {
        return "crosshair";
      },
    },
  ]);
  return InsertSymbolTool;
})(EditToolBase);

export { InsertSymbolTool as default };
InsertSymbolTool.SYMBOL_INSERTED = "symbolInserted";
