function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function _typeof(obj) {return typeof obj;};} else {_typeof = function _typeof(obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}function _possibleConstructorReturn(self, call) {if (call && (_typeof(call) === "object" || typeof call === "function")) {return call;}return _assertThisInitialized(self);}function _assertThisInitialized(self) {if (self === void 0) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return self;}function _get(target, property, receiver) {if (typeof Reflect !== "undefined" && Reflect.get) {_get = Reflect.get;} else {_get = function _get(target, property, receiver) {var base = _superPropBase(target, property);if (!base) return;var desc = Object.getOwnPropertyDescriptor(base, property);if (desc.get) {return desc.get.call(receiver);}return desc.value;};}return _get(target, property, receiver || target);}function _superPropBase(object, property) {while (!Object.prototype.hasOwnProperty.call(object, property)) {object = _getPrototypeOf(object);if (object === null) break;}return object;}function _getPrototypeOf(o) {_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {return o.__proto__ || Object.getPrototypeOf(o);};return _getPrototypeOf(o);}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function");}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });if (superClass) _setPrototypeOf(subClass, superClass);}function _setPrototypeOf(o, p) {_setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {o.__proto__ = p;return o;};return _setPrototypeOf(o, p);}import { Path, PolyBase, Polygon, Polyline } from '../EditShapes.js';
import { Actions } from '../Actions.js';
import { Math2D } from '../Math2D.js';
import { AreaLabel, EdgeMoveGizmo, LengthLabel, VertexGizmo } from '../CanvasGizmo.js';
import TangentGizmo from '../TangentGizmo.js';

import MoveTool from './MoveTool.js';
import EditToolBase from './EditToolBase.js';

var PolygonEditToolName = 'Edit2_PolygonEditTool';

var av = Autodesk.Viewing;

// Allow to pick an edge within 
var EdgeSelectTolerance = 17;

var vertexGizmoName = function vertexGizmoName(index) {
  return 'PolygonEditTool_vertexGizmo_' + index.toString();
};

var edgeGizmoName = function edgeGizmoName(index) {
  return 'PolygonEditTool_edgeGizmo_' + index.toString();
};

var updateVertexGizmoNames = function updateVertexGizmoNames(vertexGizmos) {
  for (var i = 0; i < vertexGizmos.length; i++) {
    var gizmo = vertexGizmos[i];
    gizmo.setName(vertexGizmoName(i));
    gizmo.update(false); // Make sure that the shapes get the name immediately - we don't need a layer update for this.
  }
};

// Return 2D edge normal
var getLeftEdgeNormal = function getLeftEdgeNormal(poly, edgeIndex, target) {
  // get start/end point of the edge
  var vi1 = edgeIndex;
  var vi2 = (edgeIndex + 1) % poly.vertexCount;
  var v1 = poly.getPoint(vi1);
  var v2 = poly.getPoint(vi2);

  // get edge direction
  target.subVectors(v2, v1).normalize();

  // rotate by 90 degrees
  var tmp = target.x;
  target.x = -target.y;
  target.y = tmp;

  return target;
};

// Given a Polyline/Polygon and a vertex index, check if the two edges next to 'vertex' are collinear.
// Returns false if vertex does not have 2 different neighbor edges.
var edgesCollinear = function edgesCollinear(poly, vertex) {

  // check if neighbor edges exist
  var isLine = poly.isPolyline();
  var prevExists = poly.vertexCount >= 3 && !(isLine && vertex === 0);
  var nextExists = poly.vertexCount >= 3 && !(isLine && vertex === poly.vertexCount - 1);

  // If poly has only 1 edge or 'vertex' is an end vertex of a polyline, stop here.
  if (!prevExists || !nextExists && prevEdge === nextEdge) {
    return false;
  }

  // get points before and after vertex
  var prevIndex = poly.prevIndex(vertex);
  var nextIndex = poly.nextIndex(vertex);

  var precision = 1.e-5;

  var a = poly.getPoint(prevIndex);
  var b = poly.getPoint(vertex);
  var c = poly.getPoint(nextIndex);
  return Math2D.isPointOnLine(b, a, c, precision);
};var

PolygonEditTool = /*#__PURE__*/function (_EditToolBase) {_inherits(PolygonEditTool, _EditToolBase);

  function PolygonEditTool(ctx) {var _this;_classCallCheck(this, PolygonEditTool);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(PolygonEditTool).call(this, ctx));

    _this.moveTool = new MoveTool(ctx);

    // Only set during dragging
    _this.poly = null;

    // Last drag position in layer coords
    _this.lastDragPoint = new THREE.Vector2();

    // Circles around each vertex
    _this.vertexGizmos = [];

    // Index of the vertex currently being dragged (or -1 if no dragging is active)
    _this.draggedVertex = -1;

    // When dragging a vertex, this stores a copy of its original position
    _this.dragVertexStartPos = new THREE.Vector2();

    // When dragging an edge, this stores a copy of its original position
    _this.dragEdgeStartPos = {
      a: new THREE.Vector2(),
      b: new THREE.Vector2() };


    // Index of the edge being dragged or -1
    _this.draggedEdge = -1;

    // In some cases, we duplicate start/end vertex when beginning to drag an edge. This may shift this.draggedEdge by 1 or 2.
    // draggedEdgeBefore stores the original edgeIndex before duplicating vertices.
    _this.draggedEdgeBefore = -1;

    // Reused to store edge normal of dragged edge
    _this.draggedEdgeNormal = new THREE.Vector2();

    // Used when dragging an edge: Indicates whether we had to duplicate 
    // start/end vertex of the edge in order to move it.
    _this.duplicateStartVertex = false;
    _this.duplicateEndVertex = false;

    // selectedVertex is the one that was last clicked on. It is set together with draggedVertex, 
    // but (unlike draggedVertex) keeps the same after dragEnd.
    // selectedVertex is the one that is highlighted and which will be deleted when pressing backspace.
    _this.selectedVertex = -1;

    // When dragging vertices, we store the offset (in layer-coords) between the accurate click position and the center of the clicked vertex gizmo
    // Stored in pixels.
    _this.dragOffset = new THREE.Vector2(0, 0);

    // Used to highlight a dragged edge in a different color by drawing a single-edge overlay.
    _this.edgeGizmo = new Polyline();
    _this.edgeGizmoShown = false; // indicates that gizmo is currently added to gizmoLayer

    _this.keyMap.DeleteSelectedVertex = av.KeyCode.BACKSPACE;
    _this.keyMap.CancelEdit = av.KeyCode.ESCAPE;

    // Track mouse position in layer-coords
    _this.mousePos = new THREE.Vector2();

    // Create area label. Default hidden - showing is optional.
    _this.areaLabel = new AreaLabel(null, _this.layer, ctx.unitHandler, false);

    // Create length label. Default hidden - showing is optional.
    _this.lengthLabel = new LengthLabel(null, _this.layer, ctx.unitHandler, false);

    // {EdgeGizmo[]} Array of Gizmos used for moving edges. 
    _this.edgeGizmos = [];

    // {TangentGizmo[]} Array of TangentGizmos for BezierArcs
    _this.tangentGizmos = [];

    // If true, we apply hover-highlight on shape under mouse.
    _this.hoverEnabled = true;return _this;
  }_createClass(PolygonEditTool, [{ key: "setHoverEnabled", value: function setHoverEnabled(

    enabled) {

      // On disable, make sure that we don't leave any highlight behind
      if (this.hoverEnabled && !enabled) {
        this.selection.setHovered(null);
      }

      this.hoverEnabled = enabled;
    }

    // Enable the area labels (public API)
  }, { key: "setAreaLabelVisible", value: function setAreaLabelVisible(visible) {
      this.areaLabel.setVisible(visible);
    }

    // Enable the length labels (public API)
  }, { key: "setLengthLabelVisible", value: function setLengthLabelVisible(visible) {
      this.lengthLabel.setVisible(visible);
    } }, { key: "getName", value: function getName()

    {
      return PolygonEditToolName + this.nameSuffix;
    } }, { key: "deactivate", value: function deactivate()

    {
      _get(_getPrototypeOf(PolygonEditTool.prototype), "deactivate", this).call(this);
      this.reset();
    } }, { key: "createVertexGizmos", value: function createVertexGizmos()

    {
      for (var i = 0; i < this.poly.points.length; i++) {
        // create new vertex gizmo
        var p = this.poly.points[i];
        var vertex = new VertexGizmo(this.gizmoLayer, p.x, p.y, vertexGizmoName(i), this.poly.style);
        this.vertexGizmos.push(vertex);

        // We implement drag-behavior, so we want hover-highlight
        vertex.setHoverEnabled(true);
      }
    }

    // Make sure that VertexGizmos reflect latest state of the shape
  }, { key: "updateVertexGizmos", value: function updateVertexGizmos() {
      var vertexCount = this.poly ? this.poly.vertexCount : 0;

      // If just the positions changed (e.g. while moving the shape), we just update the positions.
      var p = new THREE.Vector2();
      if (vertexCount == this.vertexGizmos.length) {
        for (var i = 0; i < vertexCount; i++) {
          this.poly.getPoint(i, p);
          this.vertexGizmos[i].setPosition(p.x, p.y);
        }
      } else {
        // just re-create all VertexGizmos
        this.clearVertexGizmos();
        this.createVertexGizmos();
      }
    } }, { key: "clearVertexGizmos", value: function clearVertexGizmos()

    {
      for (var i = 0; i < this.vertexGizmos.length; i++) {
        this.vertexGizmos[i].dtor();
      }
      this.vertexGizmos.length = 0;
    } }, { key: "clearEdgeGizmos", value: function clearEdgeGizmos()

    {
      for (var i = 0; i < this.edgeGizmos.length; i++) {
        this.edgeGizmos[i].dtor();
      }
      this.edgeGizmos.length = 0;
    }

    // Update edgeGizmos to this.poly or hide all if poly is null
  }, { key: "createEdgeGizmos", value: function createEdgeGizmos() {
      // Make sure that we don't leak outdated ones
      this.clearEdgeGizmos();

      // Create gizmo per edge
      var edgeCount = this.poly ? this.poly.getEdgeCount() : 0;
      for (var i = 0; i < edgeCount; i++) {
        var gizmo = new EdgeMoveGizmo(this.layer, edgeGizmoName(i));
        gizmo.attachToEdge(this.poly, i);
        this.edgeGizmos.push(gizmo);
      }
    }

    // Make sure that only the vertexGizmo is only highlighted for the selectedVertex (if any)
  }, { key: "updateVertexHighlighting", value: function updateVertexHighlighting() {
      for (var i = 0; i < this.vertexGizmos.length; i++) {
        this.vertexGizmos[i].setSelected(i === this.selectedVertex);
      }
    }

    // Update vertex-gizmos, edge gizmos (for edge highlighting), and tangent gizmos.
  }, { key: "updateAllGizmos", value: function updateAllGizmos() {
      this.updateVertexGizmos();
      this.createEdgeGizmos();
      this.createTangentGizmos();
    } }, { key: "setSelectedVertex", value: function setSelectedVertex(

    index) {
      this.selectedVertex = this.poly ? index : -1;
      this.updateVertexHighlighting();
    }

    // Returns the index of the vertex gizmo at the given position (or -1 if no vertexGizmo is hit)
  }, { key: "getVertexIndex", value: function getVertexIndex(x, y) {
      for (var i = 0; i < this.vertexGizmos.length; i++) {
        var gizmo = this.vertexGizmos[i];
        if (gizmo.isUnderMouse) {
          return i;
        }
      }
      return -1;
    }

    // Returns the index of the edge gizmo under mouse (or -1 if no EdgeGizmo is hit)
    // (x,y) are in layer-coords
  },
  
  { key: "getEdgeIndex", value: function getEdgeIndex(x, y) {
      for (var i = 0; i < this.edgeGizmos.length; i++) {
        if (this.edgeGizmos[i].isUnderMouse) {
          return i;
        }
      }
      return -1;
    }

    // Finishes editing of a previous polygon
  }, 
  
  
  { key: "reset", value: function reset() {

      if (!this.poly) {
        return;
      }

      // Clear any gizmos from previous polygon
      this.clearVertexGizmos();
      this.clearEdgeGizmos();
      this.clearTangentGizmos();

      // Cleanup area and length labels
      this.areaLabel.setShape(null);
      this.lengthLabel.setShape(null);

      this.poly = null;
      this.draggedVertex = -1;
      this.draggedEdge = -1;
      this.selectedVertex = -1;

      this.snapper.stopAngleSnapping();
    }

    // Selects a new polygon / polyline for editing
  }, 
  
  { key: "setEditPoly", value: function setEditPoly(poly) {

      this.reset();

      if (poly) {
        this.poly = poly;
        this.updateAllGizmos();
      }

      // Sync label with polygon or polyline. If this.poly is null, it will be hidden
      var polygon = poly && poly.isPolygon() ? poly : null;
      this.areaLabel.setShape(polygon);
      var polyline = poly && poly.isPolyline() ? poly : null;
      this.lengthLabel.setShape(polyline);
    } }, 
    
    { key: "insertPoint", value: function insertPoint(index, p) {

      this.runAction(new Actions.AddVertex(this.layer, this.poly, index, p));

      // insert new VertexGizmo
      var gizmo = new VertexGizmo(this.gizmoLayer, p.x, p.y, undefined, this.poly.style);
      gizmo.setHoverEnabled(true);

      // update vertex gizmos
      this.vertexGizmos.splice(index, 0, gizmo);
      updateVertexGizmoNames(this.vertexGizmos);

      // removeupdate edge gizmos and tangent gizmos
      this.updateAllGizmos();

      // Display polygon change and new gizmo
      this.layer.update();
    } }, 
    
    
    { key: "removePoint", value: function removePoint(index) {

      // If removing a vertex would make the shape degenerate, remove it completely
      var minVerts = this.poly.isPolygon() ? 3 : 2;
      if (this.poly.vertexCount <= minVerts) {
        this.runAction(new Actions.RemoveShape(this.layer, this.poly));
        this.reset();
        return;
      }

      this.runAction(new Actions.RemoveVertex(this.layer, this.poly, index));

      // update vertex gizmos
      var gizmo = this.vertexGizmos.splice(index, 1)[0];
      updateVertexGizmoNames(this.vertexGizmos);

      // update edge gizmos and tangent gizmos
      this.updateAllGizmos();

      // Display changed polygon and removed vertex gizmo
      gizmo.dtor();

      // Make sure that this vertex is not selected anymore
      if (this.selectedVertex === index) {
        this.setSelectedVertex(-1);
      }

      this.layer.update();
    } }, 
    
    { key: "startDragVertex", value: function startDragVertex(event, draggedVertex) {

      // Configure angle snapping to consider latest state of the polygon
      this.snapper.startAngleSnapping(this.poly.clone(), draggedVertex);

      this.draggedVertex = draggedVertex;

      // Store offset between exact mouse pos and the vertex we are dragging
      var vpos = this.poly.points[this.draggedVertex];
      var vposScreen = this.layer.layerToCanvas(vpos.x, vpos.y);
      this.dragOffset.set(vposScreen.x - event.canvasX, vposScreen.y - event.canvasY);

      // highlight the vertex we clicked on
      this.setSelectedVertex(this.draggedVertex);

      this.lastDragPoint.copy(vpos);
      this.dragVertexStartPos.copy(vpos);
    } }, 
    
    { key: "moveDragVertex", value: function moveDragVertex(canvasX, canvasY) {
      // Note that the vertex we are dragging does not always match exactly with the mouse position. E.g., we may have picked the bottom-left boundary of a vertex gizmo at drag-start.
      var x = canvasX + this.dragOffset.x;
      var y = canvasY + this.dragOffset.y;

      // get delta between last and current position
      var p = this.getSnapPosition(x, y);
      var dx = p.x - this.lastDragPoint.x;
      var dy = p.y - this.lastDragPoint.y;

      // apply this offset to polygon point
      var point = this.poly.points[this.draggedVertex];
      this.poly.updatePoint(this.draggedVertex, point.x + dx, point.y + dy);

      // re-center gizmo at new point position
      var vertexGizmo = this.vertexGizmos[this.draggedVertex];
      vertexGizmo.setPosition(point.x, point.y);

      this.gizmoLayer.update(); // we moved the vertex gizmo
      this.layer.update(); // we changed the main polygon

      this.lastDragPoint.copy(p);
    } }, { key: "restoreDragVertex", value: function restoreDragVertex()

    {
      this.poly.updatePoint(this.draggedVertex, this.dragVertexStartPos.x, this.dragVertexStartPos.y);
    } }, 
    
    
    { key: "endDragVertex", value: function endDragVertex()
    {

      // First, restore "before move" position of the vertex
      this.restoreDragVertex();

      var pBefore = this.dragVertexStartPos;
      var pAfter = this.lastDragPoint;

      // don't add extra undo-operation if the vertex was hardly moved at all
      var minDist = this.layer.getUnitsPerPixel() * 0.5;
      var moved = pBefore.distanceTo(pAfter) > minDist;

      if (moved) {
        // Finalize vertex-move
        this.runAction(new Actions.MoveVertex(this.layer, this.poly, this.draggedVertex, pAfter));
      }

      this.draggedVertex = -1;
      this.snapper.clearSnappingGizmos();
    } }, 
    
    
    { key: "startDragEdge", value: function startDragEdge(event, draggedEdge) {

      // store edge normal for the edge being dragged
      this.draggedEdgeNormal = getLeftEdgeNormal(this.poly, draggedEdge, this.draggedEdgeNormal);
      this.lastDragPoint.copy(this.layer.canvasToLayer(event.canvasX, event.canvasY));

      // store original position of the two edge vertices
      var ia = draggedEdge;
      var ib = (draggedEdge + 1) % this.poly.vertexCount;
      this.dragEdgeStartPos.a.copy(this.poly.getPoint(ia));
      this.dragEdgeStartPos.b.copy(this.poly.getPoint(ib));

      // Check if we need to duplicate start and/or end vertex of the edge.
      // This happens when the neighbor edges are collinear with the ones being moved.
      this.duplicateStartVertex = edgesCollinear(this.poly, ia);
      this.duplicateEndVertex = edgesCollinear(this.poly, ib);

      // Duplicate start/end vertices if necessary
      Actions.MoveEdge.duplicateVertices(this.poly, draggedEdge, this.duplicateStartVertex, this.duplicateEndVertex);

      // Store initial edge index (not considering any duplicated vertices)
      this.draggedEdgeBefore = draggedEdge;

      // Select the edge - using its index after duplicating vertices
      var newEdgeIndex = Actions.MoveEdge.getNewEdgeIndex(this.poly, draggedEdge, this.duplicateStartVertex, this.duplicateEndVertex);
      this.setSelectedEdge(newEdgeIndex);

      // Make sure that all gizmos are updated if we duplicated vertices
      if (this.duplicateStartVertex || this.duplicateEndVertex) {
        this.updateAllGizmos();
      }
    } }, 
    
    { key: "moveDragEdge", value: function moveDragEdge(event) {

      // get delta between last and current position
      var p = this.layer.canvasToLayer(event.canvasX, event.canvasY);
      var delta = p.clone().sub(this.lastDragPoint);

      // get indices of prev and next edge
      var prevEdgeIndex = this.poly.prevIndex(this.draggedEdge);
      var nextEdgeIndex = this.poly.nextIndex(this.draggedEdge);

      // get previous, current, and next edge vertices
      var prevEdgeA = new THREE.Vector2();
      var prevEdgeB = new THREE.Vector2();
      var curEdgeA = new THREE.Vector2();
      var curEdgeB = new THREE.Vector2();
      var nextEdgeA = new THREE.Vector2();
      var nextEdgeB = new THREE.Vector2();
      this.poly.getEdge(prevEdgeIndex, prevEdgeA, prevEdgeB);
      this.poly.getEdge(this.draggedEdge, curEdgeA, curEdgeB);
      this.poly.getEdge(nextEdgeIndex, nextEdgeA, nextEdgeB);

      // Compute line after applying edge move offset
      curEdgeA.add(delta);
      curEdgeB.add(delta);

      // Compute directions for each edge to intersect
      var prevEdgeDir = Math2D.getEdgeDirection(prevEdgeA, prevEdgeB);
      var curEdgeDir = Math2D.getEdgeDirection(curEdgeA, curEdgeB);
      var nextEdgeDir = Math2D.getEdgeDirection(nextEdgeA, nextEdgeB);

      // If we added extra vertices, the (newly inserted) neighbor edges will be degenerated
      // and the edge directions will be invalid. In this case, we choose the edge direction
      // perpendicular to the edge that we are dragging.
      if (this.duplicateStartVertex) prevEdgeDir.copy(this.draggedEdgeNormal);
      if (this.duplicateEndVertex) nextEdgeDir.copy(this.draggedEdgeNormal);

      // Compute new edge endpoints as intersection of prev/next edge with the moved line
      var newEdgeA = new THREE.Vector2();
      var newEdgeB = new THREE.Vector2();

      if (!Math2D.intersectLines(prevEdgeA, prevEdgeDir, curEdgeA, curEdgeDir, newEdgeA) ||
      !Math2D.intersectLines(nextEdgeA, nextEdgeDir, curEdgeA, curEdgeDir, newEdgeB)) {
        return;
      }

      // get indices of the points to modify
      var ia = this.draggedEdge;
      var ib = this.poly.nextIndex(ia);

      // The intersections gives us the new position for the edge vertices
      this.poly.updatePoint(ia, newEdgeA.x, newEdgeA.y);
      this.poly.updatePoint(ib, newEdgeB.x, newEdgeB.y);

      // update affected vertex gizmos
      this.vertexGizmos[ia].setPosition(newEdgeA.x, newEdgeA.y);
      this.vertexGizmos[ib].setPosition(newEdgeB.x, newEdgeB.y);

      this.gizmoLayer.update();
      this.layer.update();

      this.lastDragPoint.copy(p);

      // We moved the edge => Keep gizmo in-sync
      this.updateEdgeGizmo();
    }

    // While dragging an edge, this function restores the original position at drag start
  }, { key: "restoreDragEdge", value: function restoreDragEdge() {
      var a = this.dragEdgeStartPos.a;
      var b = this.dragEdgeStartPos.b;

      var ia = this.draggedEdge;
      var ib = this.poly.nextIndex(ia);

      this.poly.updatePoint(ia, a.x, a.y);
      this.poly.updatePoint(ib, b.x, b.y);

      // Revert insertion of extra vertices
      Actions.MoveEdge.revertDuplicateVertices(this.poly, this.draggedEdgeBefore, this.duplicateStartVertex, this.duplicateEndVertex);
    } }, { key: "endDragEdge", value: function endDragEdge()

    {

      // get final position of the edge vertices
      var ia = this.draggedEdge;
      var ib = this.poly.nextIndex(ia);

      var newPos1 = this.poly.getPoint(ia);
      var newPos2 = this.poly.getPoint(ib);

      this.restoreDragEdge();

      // If the edge was hardly moved at all, we drop the operation. Otherwise, the only effect would be to add invisible
      // vertex duplicates.
      var delta = this.dragEdgeStartPos.a.distanceTo(newPos1) * this.layer.getPixelsPerUnit();
      if (delta < 3) {
        return;
      }

      this.runAction(new Actions.MoveEdge(this.layer, this.poly, this.draggedEdgeBefore, newPos1, newPos2, this.duplicateStartVertex, this.duplicateEndVertex));
      this.setSelectedEdge(-1);

      // update all gizmos
      this.updateAllGizmos();
    } }, { key: "edgeMovePossible", value: function edgeMovePossible()

    {
      return this.poly && this.poly.vertexCount > 2;
    }

    // If the given mousePos (in layerCoords) is located close to an edge (not edge gizmo), 
    // the edge index is returned, otherwise -1.
  }, { key: "findEdgeUnderMouse", value: function findEdgeUnderMouse(pos) {
      var precision = EdgeSelectTolerance * this.layer.getUnitsPerPixel();
      return this.poly ? this.poly.findEdgeIndex(pos, precision) : -1;
    }

    // Checks if a point p can be inserted to split the given edge. If so, it returns the projected
    // position that is located exactly on edge to be split.
    //
    //  @param {Vector2} p         - pos in layer coords - usually close to given edge.
    //  @param {number}  edgeIndex - index of the edge to be split by this vertex
    //  @returns {Vector2|null} Adjusted position where the new point will be added.
  }, { key: "getNewVertexPosition", value: function getNewVertexPosition(p, edgeIndex) {

      if (!this.poly || !this.poly.edgeIndexValid(edgeIndex)) {
        return null;
      }

      // get edge
      var a = new THREE.Vector2();
      var b = new THREE.Vector2();
      this.poly.getEdge(edgeIndex, a, b);

      // get edge direction
      var edgeDir = Math2D.getEdgeDirection(a, b);

      // compute projection of p to the line spanned by the edge
      var newPos = p.clone();
      Math2D.projectToLine(newPos, a, edgeDir);

      // Reject position if the projection is outside the segment
      if (!Math2D.isPointOnEdge(newPos, a, b, 0.0001)) {
        return null;
      }

      // Return position where to insert the new vertex
      return newPos;
    } }, { key: "handleButtonDown", value: function handleButtonDown(

    event, button) {
      // Support suppressing mouse buttons by holding a key
      if (this.ignoreDragging) {
        return false;
      }

      _get(_getPrototypeOf(PolygonEditTool.prototype), "handleButtonDown", this).call(this, event, button);

      // Only respond to left mouse button.
      if (!button == 0) {
        return false;
      }

      var p = this.layer.canvasToLayer(event.canvasX, event.canvasY);
      this.mousePos.copy(p);

      // If we hit an existing vertex, start dragging it
      var draggedVertex = this.getVertexIndex(p.x, p.y);
      if (draggedVertex != -1) {
        this.startDragVertex(event, draggedVertex);
        return true;
      }

      // Handle Vertex-Add: Check if we hold ctrl and hit an edge
      var newVertex = -1;
      if (event.ctrlKey) {
        // Is mouse close to an edge and can be projected onto that edge?
        var edgeIndex = this.findEdgeUnderMouse(this.mousePos);
        var newVertexPos = this.getNewVertexPosition(this.mousePos, edgeIndex);
        if (newVertexPos) {
          // We don't insert exactly at the mouse position. Instead, new vertices
          // are always located exactly on the edge being split. Therefore, newVertexPos is
          // usually slightly different from mousePos.

          // insert new vertex after edge starting point
          newVertex = edgeIndex + 1;
          this.insertPoint(newVertex, newVertexPos);

          // Allow to drag the new vertex immediately
          this.startDragVertex(event, newVertex);

          return true;
        }
      }

      // Reset vertex-highlighting: No vertex is selected anymore.
      this.setSelectedVertex(-1);

      // Handle dragging of TangentGizmo control points for Bezier arcs.
      for (var i = 0; i < this.tangentGizmos.length; i++) {
        var gizmo = this.tangentGizmos[i];
        if (gizmo.onButtonDown(event.canvasX, event.canvasY)) {
          // We started dragging of a Bezier control point
          return true;
        }
      }

      // Handle Edge-Move: If we hit an EdgeGizmo, start dragging it
      var selectedEdgeGizmo = this.getEdgeIndex(p.x, p.y);
      if (this.edgeMovePossible() && selectedEdgeGizmo !== -1) {
        this.startDragEdge(event, selectedEdgeGizmo);
        return true;
      }

      // If we just clicked inside the already active polygon, delegate to MoveTool
      if (this.poly) {
        // Note: this.poly may be a Polyline. To allow moving it, it's essential to use a hitRadius for picking.
        var hitRadius = this.layer.getLineHitRadius(this.poly);
        if (this.poly.hitTest(p.x, p.y, hitRadius)) {
          this.moveTool.startDrag(this.poly, p);
          return true;
        }
      }

      // Check if we selected a new polygon
      var newPolygon = this.layer.hitTest(p.x, p.y);

      // If the clicked object is neither polygon nor polyline, ignore it.
      var isPolygon = newPolygon instanceof Polygon;
      var isPolyline = newPolygon instanceof Polyline;
      var isPath = newPolygon instanceof Path;
      if (!isPolygon && !isPolyline && !isPath) {
        newPolygon = null;
      }

      // Set selection to current polygon. This will also trigger setEditPoly() 
      // via selectionChanged event.
      this.selection.selectOnly(newPolygon);

      return Boolean(this.poly);
    } }, 
    
    { key: "handleSingleClick", value: function handleSingleClick(e) {
      _get(_getPrototypeOf(PolygonEditTool.prototype), "handleSingleClick", this).call(this, e);
      console.log('poly', this.poly)
      return Boolean(this.poly);
    } }, 
    
    { key: "handleMouseMove", value: function handleMouseMove(event) {
      _get(_getPrototypeOf(PolygonEditTool.prototype), "handleMouseMove", this).call(this, event);

      this.mousePos.copy(this.layer.canvasToLayer(event.canvasX, event.canvasY));
      this.updateMouseOverHighlights();

      if (!this.poly) {
        return false;
      }

      if (this.draggedVertex != -1) {
        this.moveDragVertex(event.canvasX, event.canvasY);
        return true;
      }

      if (this.draggedEdge != -1) {
        this.moveDragEdge(event);
      }

      if (this.moveTool.isDragging()) {
        this.moveTool.moveDrag(this.mousePos);

        // keep vertex-gizmos in-sync
        this.updateVertexGizmos();
      }

      // Check if we are dragging an endpoint of any tangent gizmo
      var tangentGizmo = this.findDraggedTangentGizmo();
      if (tangentGizmo) {
        tangentGizmo.moveDrag(event.canvasX, event.canvasY);
      }

      return false;
    } }, { key: "handleButtonUp", value: function handleButtonUp(

    event, button) {
      _get(_getPrototypeOf(PolygonEditTool.prototype), "handleButtonUp", this).call(this, event, button);

      if (this.draggedVertex !== -1) {
        this.endDragVertex();
        return true;
      }

      if (this.draggedEdge !== -1) {
        this.endDragEdge();
        return true;
      }

      if (this.moveTool.isDragging()) {
        var p = this.layer.canvasToLayer(event.canvasX, event.canvasY);

        // Avoid triggering the handler for external modifications, because we control the MoveTool ourselves
        this.ignoreActions = true;
        this.moveTool.endDrag(p);
        this.ignoreActions = false;

        // keep vertex-gizmos in-sync
        this.updateVertexGizmos();
        return true;
      }

      // Check if we are dragging an endpoint of any tangent gizmo
      var tangentGizmo = this.findDraggedTangentGizmo();
      if (tangentGizmo) {
        tangentGizmo.endDrag(event.canvasX, event.canvasY);
      }

      // Consider all left-button events as handled. E.g., if dragging was cancelled using Esc,
      // we do nothing here, but letting the mouseUp pass to navigation classes would cause camera jumps.
      return !this.ignoreDragging && this.poly && button == 0;
    }

    // Exclude currently edited polygon from snapping: The polygon shouldn't snap to itself, but rather
    // to geometry below it.
  }, { key: "snappingFilter", value: function snappingFilter(shape) {
      return shape !== this.poly;
    }

    // If selection changes (may also be triggered outside this tool), we choose the selected polyon for editing
  }, { key: "onSelectionChanged", value: function onSelectionChanged() {
      var selected = this.selection.getSelectedShapes();
      var shape = selected[0];
      if (shape instanceof PolyBase) {
        this.setEditPoly(shape);
      } else {
        this.setEditPoly(null);
      }
    } }, { key: "handleKeyDown", value: function handleKeyDown(

    event, keyCode) {
      var handled = _get(_getPrototypeOf(PolygonEditTool.prototype), "handleKeyDown", this).call(this, event, keyCode);

      if (keyCode === this.keyMap.DeleteSelectedVertex) {
        if (this.poly && this.selectedVertex !== -1) {
          this.removePoint(this.selectedVertex);
          handled = true;
        }
      }

      if (keyCode === this.keyMap.CancelEdit) {
        this.cancelDrag();
        return true;
      }

      return handled;
    } }, { key: "onSnappingToggled",

    // If snapping has toggled on/off, we instantly "replay" hovering at current mouse position. Purpose is to
    // give instant feedback (e.g. hide/show SnapLine gizmos and adjust position of preview edge)
    value: function onSnappingToggled(canvasX, canvasY) {

      // If we are dragging a vertex, toggling snapping will affect the result and 
      // we should update line gizmos and snapping lines.
      if (this.draggedVertex !== -1) {
        this.moveDragVertex(canvasX, canvasY);
      }
    } }, { key: "cancelDrag", value: function cancelDrag()

    {

      var needsUpdate = false;

      if (this.draggedVertex !== -1) {
        this.restoreDragVertex();
        this.draggedVertex = -1;
        needsUpdate = true;
      }

      if (this.draggedEdge !== -1) {
        this.restoreDragEdge();
        this.draggedEdge = -1;
        needsUpdate = true;
      }

      if (this.moveTool.isDragging()) {
        this.moveTool.cancelDrag();
        this.updateVertexGizmos();
      }

      if (needsUpdate) {
        this.layer.update();
        this.updateAllGizmos();
      }

      this.snapper.clearSnappingGizmos();
    } }, { key: "handleExternalAction", value: function handleExternalAction()

    {
      // If nothing is active, we don't need to care
      if (!this.poly) {
        return;
      }

      // If shape was removed, reset state
      var shapeFound = Boolean(this.layer.findShapeById(this.poly.id));
      if (!shapeFound) {
        this.reset();
      }

      // Sync gizmos in case vertices were modified
      this.updateAllGizmos();

      // Stop any ongoing drag-operations (e.g., an undo operation might have removed the vertex that we are just dragging)
      this.cancelDrag();

      this.snapper.clearSnappingGizmos();
    }

    // Make sure that EdgeGizmo is up-to-date: Its purpose is to highlight the edge being dragged.
  }, { key: "updateEdgeGizmo", value: function updateEdgeGizmo() {

      // Check if mouse is on an edge gizmo
      var edgeUnderMouse = this.getEdgeIndex(this.mousePos.x, this.mousePos.y);

      // Check if a vertex gizmo is under mouse or being dragged. If so, it has precedence, so that we don't highlight the edge anymore
      var vertexUnderMouse = this.getVertexIndex(this.mousePos.x, this.mousePos.y);
      var vertexHighlighted = vertexUnderMouse != -1 || this.draggedVertex != -1;
      var edgeMovePossible = this.edgeMovePossible();

      // Check if we need any highlight
      var edgeSelected = this.poly && this.draggedEdge != -1;
      var edgeHovered = edgeMovePossible && edgeUnderMouse != -1 && !vertexHighlighted;
      var gizmoNeeded = edgeSelected || edgeHovered;

      // Make sure that edge gizmo is shown if needed
      if (gizmoNeeded && !this.edgeGizmoShown) {
        this.gizmoLayer.addShape(this.edgeGizmo);
        this.edgeGizmoShown = true;
      } else
      if (!gizmoNeeded && this.edgeGizmoShown) {
        this.gizmoLayer.removeShape(this.edgeGizmo);
        this.edgeGizmoShown = false;
      }

      // If we just had to hide it, we are done here
      if (!gizmoNeeded) {
        return;
      }

      // Update edge gizmo position
      var edgeToHighlight = edgeSelected ? this.draggedEdge : edgeUnderMouse;

      // get the two vertex positions of the edge
      var a = new THREE.Vector2();
      var b = new THREE.Vector2();
      this.poly.getEdge(edgeToHighlight, a, b);

      // copy values to edge gizmo
      this.edgeGizmo.makeLine(a.x, a.y, b.x, b.y);

      // Adopt lineWidth from selected polygon
      this.edgeGizmo.style.lineWidth = this.poly.style.lineWidth;
      this.edgeGizmo.style.isScreenSpace = this.poly.style.isScreenSpace;

      if (edgeSelected) {
        // Override color by green
        this.edgeGizmo.style.lineColor = 'rgb(0, 255, 0)';
        this.edgeGizmo.style.lineAlpha = 1.0;
      } else {
        // Just make it a bit brighter using a semitransparent white overlay
        this.edgeGizmo.style.lineColor = 'rgb(0, 255, 0)';
        this.edgeGizmo.style.lineAlpha = 0.5;
      }

      this.gizmoLayer.update();
    } }, { key: "setSelectedEdge", value: function setSelectedEdge(

    edgeIndex) {
      this.draggedEdge = edgeIndex;
      this.updateEdgeGizmo();

      // Update selection state for edge gizmos
      for (var i = 0; i < this.edgeGizmos.length; i++) {
        var gizmo = this.edgeGizmos[i];
        gizmo.setSelected(i == this.draggedEdge);
      }
    } }, { key: "updateMouseOverHighlights", value: function updateMouseOverHighlights()

    {
      this.updateEdgeGizmo();

      // Handle mouse-over highlighting for shapes
      if (this.hoverEnabled) {
        var shape = this.layer.hitTest(this.mousePos.x, this.mousePos.y);
        this.selection.setHoveredId(shape ? shape.id : 0);
      }
    } }, { key: "getCursor", value: function getCursor()

    {

      if (!this.poly) {
        return;
      }

      // Note: Vertex gizmos and edge gizmos are separate DomElements and define own mouse cursors via style.

      var p = this.mousePos;

      // Indicate: "Moving whole shape"
      // While dragging, keep the move-cursor, even if the mouse is temporarily leaving polygon and gizmos
      if (this.moveTool.isDragging()) {
        return 'move';
      }

      // Indicate: "Moving a gizmo". Currently, we use the same as for shape move. Note that
      //           the cursor for gizmo dragging must be consistent with the one we have if the mouse is on the gizmo.
      //           Otherwise, the mouse cursor would change its state when temporarily leaving the gizmo on fast moves.
      if (this.draggedVertex != -1 || this.draggedEdge != -1) {
        return 'move';
      }

      // Indicate: "Click to insert new vertex"
      //
      // If we are holding down Ctrl and hover over an edge, clicking would insert a vertex.
      var ctrlHold = this.keyState[av.KeyCode.CONTROL];
      if (ctrlHold) {
        var precision = EdgeSelectTolerance * this.layer.getUnitsPerPixel();
        var edgeIndex = this.poly ? this.poly.findEdgeIndex(this.mousePos, precision) : -1;
        if (edgeIndex !== -1) {
          return 'copy';
        }
      }

      // Are we about to move a shape?
      var hitRadius = this.layer.getLineHitRadius(this.poly);
      var moveShape = this.poly.hitTest(p.x, p.y, hitRadius);
      if (moveShape) {
        return 'move';
      }

      // => Just default cursor
      return undefined;
    } }, { key: "clearTangentGizmos", value: function clearTangentGizmos()

    {
      this.tangentGizmos.forEach(function (g) {return g.dtor();});
      this.tangentGizmos.length = 0;
    } }, { key: "createTangentGizmos", value: function createTangentGizmos()

    {

      // Clear any previous gizmos (if any)
      this.clearTangentGizmos();

      if (!this.poly || !this.poly.isPath()) {
        return;
      }

      // For simplicity, we create a TangentGizmo for every vertex.
      // If a vertex has no adjacent arcs, it will be hidden anyway.   
      for (var i = 0; i < this.poly.points.length; i++) {
        this.tangentGizmos.push(new TangentGizmo(this.poly, i, this.layer, this.gizmoLayer));
      }
    }

    // If any tangent gizmo is being dragged, it is returned.
    // Result is null if nothing is dragged.
  }, { key: "findDraggedTangentGizmo", value: function findDraggedTangentGizmo() {
      return this.tangentGizmos.find(function (gizmo) {return gizmo.isDragging();});
    } }]);return PolygonEditTool;}(EditToolBase);export { PolygonEditTool as default };