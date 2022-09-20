function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;} // Collection of basic edit actions that support undo/redo.
//
// Each action provides undo() and redo() functions. UndoStack takes care that actions are always called in consistent order. 
// I.e., an individual action can assume that undo/redo is only called if the state allows it. (e.g. target shape exists and has expected number of vertices etc.)
var
Action = /*#__PURE__*/function () {
  function Action(layer) {_classCallCheck(this, Action);
    this.layer = layer;
  }_createClass(Action, [{ key: "undo", value: function undo()

    {
      throw new Error('Abstract method invoked');
    } }, { key: "redo", value: function redo()

    {
      throw new Error('Abstract method invoked');
    } }]);return Action;}();var


AddShape = /*#__PURE__*/function (_Action) {_inherits(AddShape, _Action);
  function AddShape(layer, shape) {var _this;_classCallCheck(this, AddShape);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(AddShape).call(this, layer));
    _this.shape = shape;return _this;
  }_createClass(AddShape, [{ key: "undo", value: function undo()

    {
      this.layer.removeShape(this.shape);
    } }, { key: "redo", value: function redo()

    {
      this.layer.addShape(this.shape);
    } }]);return AddShape;}(Action);var


AddShapes = /*#__PURE__*/function (_Action2) {_inherits(AddShapes, _Action2);

  // @param {Shape[]} shapes
  function AddShapes(layer, shapes) {var _this2;_classCallCheck(this, AddShapes);
    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(AddShapes).call(this, layer));
    _this2.shapes = shapes;return _this2;
  }_createClass(AddShapes, [{ key: "undo", value: function undo()

    {var _this3 = this;
      this.shapes.forEach(function (s) {return _this3.layer.removeShape(s);});
    } }, { key: "redo", value: function redo()

    {var _this4 = this;
      this.shapes.forEach(function (s) {return _this4.layer.addShape(s);});
    } }]);return AddShapes;}(Action);var


MoveShape = /*#__PURE__*/function (_Action3) {_inherits(MoveShape, _Action3);
  function MoveShape(layer, shape, dx, dy) {var _this5;_classCallCheck(this, MoveShape);
    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(MoveShape).call(this, layer));
    _this5.shape = shape;
    _this5.delta = { x: dx, y: dy };

    // Note that transforming back and forth is not always exactly 1:1. 
    _this5.beforeState = _this5.shape.clone();
    _this5.afterState = _this5.shape.clone();

    _this5.afterState.move(dx, dy);return _this5;
  }_createClass(MoveShape, [{ key: "undo", value: function undo()

    {
      this.shape.copy(this.beforeState);
    } }, { key: "redo", value: function redo()

    {
      this.shape.copy(this.afterState);
    } }]);return MoveShape;}(Action);var


RemoveShape = /*#__PURE__*/function (_Action4) {_inherits(RemoveShape, _Action4);
  function RemoveShape(layer, shape) {var _this6;_classCallCheck(this, RemoveShape);
    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(RemoveShape).call(this, layer));
    _this6.shape = shape;return _this6;
  }_createClass(RemoveShape, [{ key: "undo", value: function undo()

    {
      this.layer.addShape(this.shape);
    } }, { key: "redo", value: function redo()

    {
      this.layer.removeShape(this.shape);
    } }]);return RemoveShape;}(Action);var



RemoveShapes = /*#__PURE__*/function (_Action5) {_inherits(RemoveShapes, _Action5);
  function RemoveShapes(layer, shapes) {var _this7;_classCallCheck(this, RemoveShapes);
    _this7 = _possibleConstructorReturn(this, _getPrototypeOf(RemoveShapes).call(this, layer));
    _this7.shapes = shapes;return _this7;
  }_createClass(RemoveShapes, [{ key: "undo", value: function undo()

    {var _this8 = this;
      this.shapes.forEach(function (s) {return _this8.layer.addShape(s);});
    } }, { key: "redo", value: function redo()

    {var _this9 = this;
      this.shapes.forEach(function (s) {return _this9.layer.removeShape(s);});
    } }]);return RemoveShapes;}(Action);var


AddVertex = /*#__PURE__*/function (_Action6) {_inherits(AddVertex, _Action6);
  function AddVertex(layer, poly, vIndex, p) {var _this10;_classCallCheck(this, AddVertex);
    _this10 = _possibleConstructorReturn(this, _getPrototypeOf(AddVertex).call(this, layer));
    _this10.poly = poly;
    _this10.vIndex = vIndex;
    _this10.point = p.clone();return _this10;
  }_createClass(AddVertex, [{ key: "undo", value: function undo()

    {
      this.poly.removePoint(this.vIndex);
    } }, { key: "redo", value: function redo()

    {
      this.poly.insertPoint(this.vIndex, this.point);
    } }]);return AddVertex;}(Action);


// Only for polygons and polylines
var MoveVertex = /*#__PURE__*/function (_Action7) {_inherits(MoveVertex, _Action7);
  function MoveVertex(layer, poly, vIndex, newPos) {var _this11;_classCallCheck(this, MoveVertex);
    _this11 = _possibleConstructorReturn(this, _getPrototypeOf(MoveVertex).call(this, layer));
    _this11.poly = poly;
    _this11.vIndex = vIndex;
    _this11.posBefore = poly.getPoint(vIndex);
    _this11.posAfter = newPos.clone();return _this11;
  }_createClass(MoveVertex, [{ key: "undo", value: function undo()

    {
      this.poly.updatePoint(this.vIndex, this.posBefore.x, this.posBefore.y);
    } }, { key: "redo", value: function redo()
    {
      this.poly.updatePoint(this.vIndex, this.posAfter.x, this.posAfter.y);
    } }]);return MoveVertex;}(Action);var


RemoveVertex = /*#__PURE__*/function (_Action8) {_inherits(RemoveVertex, _Action8);
  function RemoveVertex(layer, poly, vIndex) {var _this12;_classCallCheck(this, RemoveVertex);
    _this12 = _possibleConstructorReturn(this, _getPrototypeOf(RemoveVertex).call(this, layer));
    _this12.poly = poly;
    _this12.vIndex = vIndex;
    _this12.point = poly.getPoint(vIndex);return _this12;
  }_createClass(RemoveVertex, [{ key: "undo", value: function undo()

    {
      this.poly.insertPoint(this.vIndex, this.point);
    } }, { key: "redo", value: function redo()

    {
      this.poly.removePoint(this.vIndex);
    } }]);return RemoveVertex;}(Action);



// Moves an edge to a new position specified by new positions for start and end vertex.
// Optionally, start and end vertex may be duplicated before moving the edge. In this case, the neighbar edges keep unchanged and
// we introduce new intermediate edges to connect the old start/end position with the new one.
var MoveEdge = /*#__PURE__*/function (_Action9) {_inherits(MoveEdge, _Action9);

  // @param {EditLayer} layer
  // @param {Polybase}  poly      - must be at start before the change
  // @param {number}    edgeIndex - edge to be modified
  // @param {Vector3}   newPosA, newPosB
  // @param {bool}      duplicateStartVertex, duplicateEndVertex - Optional, start and end vertex of the edge may be duplicated.
  function MoveEdge(layer, poly, edgeIndex, newPosA, newPosB, duplicateStartVertex, duplicateEndVertex) {var _this13;_classCallCheck(this, MoveEdge);
    _this13 = _possibleConstructorReturn(this, _getPrototypeOf(MoveEdge).call(this, layer));
    _this13.poly = poly;

    // store edge index
    _this13.edgeIndex = edgeIndex;

    // store duplicate flags
    _this13.duplicateStartVertex = duplicateStartVertex;
    _this13.duplicateEndVertex = duplicateEndVertex;

    var ia = edgeIndex;
    var ib = poly.nextIndex(ia);

    // get edge 
    var a = poly.getPoint(ia);
    var b = poly.getPoint(ib);

    _this13.edgeBefore = {
      a: a,
      b: b };

    _this13.edgeAfter = {
      a: newPosA.clone(),
      b: newPosB.clone() };return _this13;

  }_createClass(MoveEdge, [{ key: "undo", value: function undo()

    {
      // get current edgeIndex (after duplicating vertices)
      var newEdgeIndex = MoveEdge.getNewEdgeIndex(this.poly, this.edgeIndex, this.duplicateStartVertex, this.duplicateEndVertex);

      // get indices of the two edge vertices
      var ia = newEdgeIndex;
      var ib = this.poly.nextIndex(ia);

      // Restore original edge positions
      this.poly.updatePoint(ia, this.edgeBefore.a.x, this.edgeBefore.a.y);
      this.poly.updatePoint(ib, this.edgeBefore.b.x, this.edgeBefore.b.y);

      // Remove extra vertices
      MoveEdge.revertDuplicateVertices(this.poly, this.edgeIndex, this.duplicateStartVertex, this.duplicateEndVertex);
    } }, { key: "redo", value: function redo()

    {
      // Duplicate start/end vertex if wanted
      MoveEdge.duplicateVertices(this.poly, this.edgeIndex, this.duplicateStartVertex, this.duplicateEndVertex);

      // get edgeIndex after duplicating vertices
      var newEdgeIndex = MoveEdge.getNewEdgeIndex(this.poly, this.edgeIndex, this.duplicateStartVertex, this.duplicateEndVertex);

      // get indices of the two edge vertices
      var ia = newEdgeIndex;
      var ib = this.poly.nextIndex(ia);

      // apply new positions
      this.poly.updatePoint(ia, this.edgeAfter.a.x, this.edgeAfter.a.y);
      this.poly.updatePoint(ib, this.edgeAfter.b.x, this.edgeAfter.b.y);
    }

    // Duplicates start and/or end vertex of a given edge in a polyline/polygon.
  }], [{ key: "duplicateVertices", value: function duplicateVertices(poly, edgeIndex, duplicateStartVertex, duplicateEndVertex) {

      var startVertex = edgeIndex;

      if (duplicateStartVertex) {
        poly.duplicateVertex(startVertex);

        // After duplicating, the actual edge start vertex has shifted by 1.
        startVertex++;
      }

      if (duplicateEndVertex) {
        var vNext = poly.nextIndex(startVertex);
        poly.duplicateVertex(vNext);
      }
    } }, { key: "revertDuplicateVertices",

    // Reverts the extra vertices inserted by duplicateVertices. Note that edgeIndex refers
    // to the polygon before duplicating the vertices, i.e., should be identical with 
    // the one used in the duplicateVertices(..) to be reverted.
    value: function revertDuplicateVertices(poly, edgeIndex, duplicateStartVertex, duplicateEndVertex) {

      // get edge index after considering vertex duplication
      var curEdgeIndex = MoveEdge.getNewEdgeIndex(poly, edgeIndex, duplicateStartVertex, duplicateEndVertex);

      // if the end vertex was duplicated, revert that now
      if (duplicateStartVertex) {
        var iPrev = curEdgeIndex - 1;
        poly.removePoint(iPrev);

        // This shifts the edgeIndex back by 1
        curEdgeIndex--;
      }

      if (duplicateEndVertex) {
        var iNext = poly.nextIndex(poly.nextIndex(curEdgeIndex));
        poly.removePoint(iNext);
      }
    } }, { key: "getNewEdgeIndex",

    // If we duplicate start/end vertex of an edge, the index of that edge may change.
    // This function returns the new index of the edge after duplicating start/end vertex.
    //
    // Note: poly is assumed to contain the duplicated vertices.
    value: function getNewEdgeIndex(poly, edgeIndex, duplicateStartVertex, duplicateEndVertex) {

      var newIndex = edgeIndex;

      // Duplicating the start vertex always shift the edgeIndex by 1
      if (duplicateStartVertex) {
        newIndex++;
      }

      // get vertexCount of the polygon before insertion of duplicated vertices.
      var vertexCountBefore = poly.vertexCount - (duplicateStartVertex ? 1 : 0) - (duplicateEndVertex ? 1 : 0);

      // Check if edge was the 'closing edge' of the original polygon, i.e., the edge that 
      // connects the last vertex with vertex 0
      var isClosingEdge = edgeIndex === vertexCountBefore - 1;

      // Duplicating the end vertex may also shift the edgeIndex. This happens if the edge start
      // vertex is the last one in a polygon.
      if (duplicateEndVertex && isClosingEdge) {
        newIndex++;
      }
      return newIndex;
    } }]);return MoveEdge;}(Action);


export var Actions = {
  Action: Action,
  AddShape: AddShape,
  AddShapes: AddShapes,
  MoveShape: MoveShape,
  RemoveShape: RemoveShape,
  RemoveShapes: RemoveShapes,
  AddVertex: AddVertex,
  MoveVertex: MoveVertex,
  RemoveVertex: RemoveVertex,
  MoveEdge: MoveEdge };