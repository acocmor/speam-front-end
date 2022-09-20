function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}


// Workaround to choose a viewport for a given 2d sheet.
// 
// Actually, we should choose it based on 2d-position. But, F2D doesn't give us proper data to 
// do this. Also, even with proper viewport outlines, it wouldn't always unique as viewports may overlap.
// Therefore, we have to use a workaround here to make it use for simple single-viewport sheets at least.
//
// @returns {number|-1} Either -1 or a valid viewportId.
var chooseViewportId = function chooseViewportId(model) {

  var data = model.getData();
  var viewports = data.viewports;
  if (!viewports) {
    return -1;
  }

  // find viewport with maximum number of dbIds    
  var vpIndex = -1;
  var maxDbIds = -1;
  for (var i = 0; i < viewports.length; i++) {

    // Skip viewports without transform
    var vp = viewports[i];
    if (!vp.transform) {
      continue;
    }

    // Use current vp if it has most dbIds
    var numDbIds = vp.geom_metrics.db_ids;
    if (numDbIds > maxDbIds) {
      vpIndex = i;
      maxDbIds = numDbIds;
    }
  }

  return vpIndex;
};

// A MeasureTransform allows for doing length/area measurements in another coordinate system than the actual shape geometry.
// The transform is applied to all points before doing calculations.
export var MeasureTransform = /*#__PURE__*/function () {function MeasureTransform() {_classCallCheck(this, MeasureTransform);}_createClass(MeasureTransform, [{ key: "apply",

    // @param {Vector2} p - Point to be transformed in-place.
    value: function apply(p) {} }]);return MeasureTransform;}();
;


// Sets the pageToModel transform in LMV as MeasureTransform to make measurements consistent with Measure extension.
export var DefaultMeasureTransform = /*#__PURE__*/function (_MeasureTransform) {_inherits(DefaultMeasureTransform, _MeasureTransform);

  function DefaultMeasureTransform(viewer) {var _this;_classCallCheck(this, DefaultMeasureTransform);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(DefaultMeasureTransform).call(this));
    _this.viewer = viewer;return _this;
  }

  // Transform geometry point to the coordinate system in which measurements should be computed and displayed.
  //
  // @param {vector2} p
  //
  // Note: Currently, we do some simplifying assumptions here that may need additional
  //       work to support scenarios with multiple viewports or multiple 2d models.
  _createClass(DefaultMeasureTransform, [{ key: "apply", value: function apply(p) {
      // Get viewportId
      var model = this.viewer.model;
      if (!model) {
        return;
      }

      var vpId = chooseViewportId(model);

      // In case there are no viewports, there still might be a pageToModelTransform,
      // which we need to take into account. This is the case for raster PDF.
      model.pageToModel(p, null, vpId);
    } }]);return DefaultMeasureTransform;}(MeasureTransform);