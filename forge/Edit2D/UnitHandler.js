function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _get(target, property, receiver) {if (typeof Reflect !== "undefined" && Reflect.get) {_get = Reflect.get;} else {_get = function _get(target, property, receiver) {var base = _superPropBase(target, property);if (!base) return;var desc = Object.getOwnPropertyDescriptor(base, property);if (desc.get) {return desc.get.call(receiver);}return desc.value;};}return _get(target, property, receiver || target);}function _superPropBase(object, property) {while (!Object.prototype.hasOwnProperty.call(object, property)) {object = _getPrototypeOf(object);if (object === null) break;}return object;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}import { DefaultMeasureTransform } from './MeasureTransform.js';

var avp = Autodesk.Viewing.Private;

// Interface to control display of length/area units.
export var UnitHandler = /*#__PURE__*/function () {

  function UnitHandler() {_classCallCheck(this, UnitHandler);
    // Optional: Returns a transform that is applied to all points for length/area calculations.
    //  @returns {MeasureTransform}
    this.measureTransform = null;
  }

  // @param   {number} val - length in layer coords
  // @returns {string} String to display, including units.
  _createClass(UnitHandler, [{ key: "lengthToString", value: function lengthToString(val) {
      console.error('Not implemented');
    }

    // @param   {number} val - area in layer coords
    // @returns {string} String to display - including units.
  }, { key: "areaToString", value: function areaToString(val) {
      console.error('Not implemented');
    } }]);return UnitHandler;}();
;

// If nothing is specified, we display with 2 digits and assume all unit in inches.
var DefaultPrecision = 2;
var DefaultUnits = "inch";

// Format length / area strings based on:
//  - layerUnits:  We assume the layer to be specified in these units.
//  - displayUnit: Values are converted from layerUnits to displayUnits for display
//  - precision:   Number of digits shown
//  - scaleFactor: Optional scale factor applied to all values
export var SimpleUnitHandler = /*#__PURE__*/function (_UnitHandler) {_inherits(SimpleUnitHandler, _UnitHandler);

  function SimpleUnitHandler(viewer) {var _this;_classCallCheck(this, SimpleUnitHandler);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(SimpleUnitHandler).call(this));

    _this.viewer = viewer;

    _this.config = {
      // {string} We assume layers to be in these units (in GNU units format)
      layerUnits: DefaultUnits,

      // {string} Units in which we display lengths/areas (in GNU units format)
      displayUnits: DefaultUnits,

      // {number} Number of digits that we display
      precision: DefaultPrecision,

      // {number} Optional scale factor applied to all values
      scaleFactor: 1.0 };return _this;

  }_createClass(SimpleUnitHandler, [{ key: "lengthToString", value: function lengthToString(

    val) {
      var cfg = this.config;

      // Convert length units
      val = avp.convertUnits(cfg.layerUnits, cfg.displayUnits, cfg.scaleFactor, val);

      // Format length value with unit string
      return avp.formatValueWithUnits(val, cfg.displayUnits, 3, cfg.precision);
    } }, { key: "areaToString", value: function areaToString(

    val) {
      var cfg = this.config;

      // Convert area units
      val = avp.convertUnits(cfg.layerUnits, cfg.displayUnits, cfg.scaleFactor, val, 'square');

      // Format length value with unit string
      var units = cfg.displayUnits ? "".concat(cfg.displayUnits, "^2") : null;
      return avp.formatValueWithUnits(val, units, 3, cfg.precision);
    } }]);return SimpleUnitHandler;}(UnitHandler);


// The DefaultUnitHandler synchronizes the unit configuration based on current viewer model 
// and current settings from MeasureToolExtension:
//  - If MeasureExtension is loaded, it displays in the same way as Measure tools
//  - If MeasureExtension is not loaded, it just uses units of the current model without unit conversion.
//  - If there is not even a model, it falls back to a fixed default configuration (see SimpleUnitHandler)
export var DefaultUnitHandler = /*#__PURE__*/function (_SimpleUnitHandler) {_inherits(DefaultUnitHandler, _SimpleUnitHandler);

  function DefaultUnitHandler(viewer) {var _this2;_classCallCheck(this, DefaultUnitHandler);
    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(DefaultUnitHandler).call(this, viewer));

    _this2.measureTransform = new DefaultMeasureTransform(viewer);return _this2;
  }_createClass(DefaultUnitHandler, [{ key: "updateConfig", value: function updateConfig()

    {
      var cfg = this.config;

      // Assume values to be in model units or default units
      var model = this.viewer.model;
      cfg.layerUnits = model ? model.getUnitString() : DefaultUnits;

      // Set other configuration values
      var ext = this.viewer.getExtension('Autodesk.Measure');
      var msrCfg = ext && ext.sharedMeasureConfig;
      if (msrCfg) {
        // get from measure extension
        cfg.displayUnits = msrCfg.units;
        cfg.precision = msrCfg.precision;
        cfg.scaleFactor = msrCfg.calibrationFactor;
      } else {
        // No Measure extension available => use defaults
        cfg.displayUnits = this.config.layerUnits;
        cfg.precision = DefaultPrecision;
        cfg.scaleFactor = 1.0;
      }
    } }, { key: "lengthToString", value: function lengthToString(

    val) {
      this.updateConfig();
      return _get(_getPrototypeOf(DefaultUnitHandler.prototype), "lengthToString", this).call(this, val);
    } }, { key: "areaToString", value: function areaToString(

    val) {
      this.updateConfig();
      return _get(_getPrototypeOf(DefaultUnitHandler.prototype), "areaToString", this).call(this, val);
    } }]);return DefaultUnitHandler;}(SimpleUnitHandler);