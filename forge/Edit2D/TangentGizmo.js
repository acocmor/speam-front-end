function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;} // A tangent gizmo is a dashed line with two vertex gizmos at the end.
// It is used to control tangents for Bezier arcs.

import { Math2D } from './Math2D.js';
import { Polyline } from './EditShapes.js';
import { VertexGizmo } from './CanvasGizmo.js';

var tangentGizmoName = function tangentGizmoName(vertexIndex, sideIndex) {
  return "TangentGizmo-$vertexIndex-$sideIndex";
};

// Indicates which endpoint of the tangent is being dragged
var DragIndex = {
  None: -1, // Nothing dragged
  Start: 0, // Dragging start point
  End: 1 // Dragging end point
};var

TangentGizmo = /*#__PURE__*/function () {

  function TangentGizmo(path, index, layer, gizmoLayer) {_classCallCheck(this, TangentGizmo);

    this.path = path;
    this.gizmoLayer = gizmoLayer;
    this.layer = layer;

    // index of the vertex whose tangent we control
    this.index = index;

    // dashed tangent line
    this.line = new Polyline();
    this.lineVisible = false;

    // configure style of dashed line
    this.line.style.isScreenSpace = true;
    this.line.style.lineColor = 'rgb(255, 0, 255)',
    this.line.style.lineWidth = 1.0,
    this.line.style.lineStyle = 10;
    this.line.style.lineAlpha = 1.0;

    // VertexGizmos at both ends of the tangent line
    this.vertexGizmo1 = new VertexGizmo(this.gizmoLayer, 0, 0, tangentGizmoName(index, 1));
    this.vertexGizmo2 = new VertexGizmo(this.gizmoLayer, 0, 0, tangentGizmoName(index, 2));

    // Hide vertex gizmos until we have proper positions
    this.vertexGizmo1.setVisible(false);
    this.vertexGizmo2.setVisible(false);

    // Start/end vertex of tangent Gizmo
    this.pStart = new THREE.Vector2();
    this.pEnd = new THREE.Vector2();

    // Add this to main layer. This triggers this.update() on layer updates to respond to
    // vertex position changes.
    this.layer.addCanvasGizmo(this);

    // 0: dragging startPoint, 1: dragging endPoint, 2: nothing dragged
    this.dragIndex = DragIndex.None;

    // Last tracked dragging position for currently dragged vertex
    this.lastDragPos = new THREE.Vector2(); // in layer coords

    // When dragging vertices, we store the offset (in layer-coords) between 
    // the accurate click position and the center of the clicked vertex gizmo
    this.dragOffset = new THREE.Vector2(0, 0); // in pixels

    this.update();
  }_createClass(TangentGizmo, [{ key: "dtor", value: function dtor()

    {
      this.setVisible(false);
      this.layer.removeCanvasGizmo(this);
    } }, { key: "setVisible", value: function setVisible(

    visible) {

      this.vertexGizmo1.setVisible(visible);
      this.vertexGizmo2.setVisible(visible);

      // Show/Hide tangent line gizmo
      if (visible !== this.lineVisible) {
        if (visible) {
          this.gizmoLayer.addShape(this.line);
        } else {
          this.gizmoLayer.removeShape(this.line);
        }
      }
      this.lineVisible = visible;
    } }, { key: "update", value: function update()

    {

      // get index of previous edge (ending at the vertex)
      var prevIndex = this.path.prevIndex(this.index);

      // Check which of the adjacent edges are arcs
      var prevIsArc = this.path.isBezierArc(prevIndex);
      var nextIsArc = this.path.isBezierArc(this.index);

      // If none of the edges is an Arc, just hide all gizmos
      if (!prevIsArc && !nextIsArc) {
        this.setVisible(false);
        return;
      }

      // Compute both endpoints of tangent gizmo
      var p = this.path.points[this.index];
      if (nextIsArc) {

        // End point is first control point of the arc starting at p            
        this.pEnd.set(p.cp1x, p.cp1y);

        // In general, the start point would be cp2 of the previous arc. 
        // But, we enforce tangents to be identical for previous edge and next edge.
        // Therefore, we obtain the other endpoint by mirroring the tangent of the leaving edge
        // on point p
        Math2D.mirrorPointOnPoint(this.pEnd, p, this.pStart);
      } else {
        // Only previous edge is an arc: We have to obtain the tangent from
        // control point 2 of the previous edge.
        var pPrev = this.path.points[prevIndex];
        this.pStart.set(pPrev.cp2x, pPrev.cp2y);

        Math2D.mirrorPointOnPoint(this.pStart, p, this.pEnd);
      }

      // update vertex gizmos
      this.vertexGizmo1.setPosition(this.pStart.x, this.pStart.y);
      this.vertexGizmo2.setPosition(this.pEnd.x, this.pEnd.y);

      // update line gizmo
      this.line.makeLine(this.pStart.x, this.pStart.y, this.pEnd.x, this.pEnd.y);
      this.gizmoLayer.update();

      this.setVisible(true);
    }

    // Apply modified tangent endpoints after dragging on of the tangent vertices.
    //
    // @param {Vector2} pStart, pEnd - Tangent start/end point in layer coords.
  }, { key: "setTangentEndPoints", value: function setTangentEndPoints(pStart, pEnd) {

      // Set start point: This is cp2 of previous arc segment (if any)
      var prevIndex = this.path.prevIndex(this.index);
      if (this.path.isBezierArc(prevIndex)) {
        this.path.updateControlPoint(prevIndex, 2, pStart.x, pStart.y);
      }

      // Set end point: This is cp1 of current segment
      if (this.path.isBezierArc(this.index)) {
        this.path.updateControlPoint(this.index, 1, pEnd.x, pEnd.y);
      }

      // update gizmos
      this.update();
    }

    // @param {Vector2} newPos - new position in layer coords
  }, { key: "onStartVertexMoved", value: function onStartVertexMoved(startPos) {
      // get new tangent end point by mirroring on vertex position
      var center = this.path.getPoint(this.index);
      var endPos = Math2D.mirrorPointOnPoint(startPos, center);

      this.setTangentEndPoints(startPos, endPos);
    }

    // @param {Vector2} startPos - new position in layer coords
  }, { key: "onEndVertexMoved", value: function onEndVertexMoved(endPos) {
      // get new tangent start point by mirroring on vertex position
      var center = this.path.getPoint(this.index);
      var startPos = Math2D.mirrorPointOnPoint(endPos, center);

      this.setTangentEndPoints(startPos, endPos);
    }

    // @param {DragIndex} dragIndex
  }, { key: "startDrag", value: function startDrag(canvasX, canvasY, dragIndex) {

      this.dragIndex = dragIndex;

      // Store offset between exact mouse pos and the vertex we are dragging
      var vpos = dragIndex === DragIndex.Start ? this.pStart : this.pEnd;
      var vposScreen = this.layer.layerToCanvas(vpos.x, vpos.y);
      this.dragOffset.set(vposScreen.x - canvasX, vposScreen.y - canvasY);

      this.lastDragPos.copy(vpos);
    }

    // process last position and finish dragging
  }, { key: "endDrag", value: function endDrag(canvasX, canvasY) {
      this.moveDrag(canvasX, canvasY);
      this.dragIndex = DragIndex.None;
    } }, { key: "moveDrag", value: function moveDrag(

    canvasX, canvasY) {

      // Compute canvas position of the gizmo after drag
      // Note that the vertex we are dragging does not always match exactly with the mouse position. 
      // E.g., we may have picked the bottom-left boundary of a vertex gizmo at drag-start.
      var x = canvasX + this.dragOffset.x;
      var y = canvasY + this.dragOffset.y;
      var p = this.layer.canvasToLayer(x, y);

      // Move tangent vertex by dx/dy
      if (this.dragIndex === DragIndex.Start) {
        this.onStartVertexMoved(p);
      } else if (this.dragIndex === DragIndex.End) {
        this.onEndVertexMoved(p);
      }

      this.layer.update();
    }

    // @returns {bool} true if dragging started
  }, { key: "onButtonDown", value: function onButtonDown(canvasX, canvasY) {

      var startDragged = this.vertexGizmo1.isUnderMouse;
      var endDragged = this.vertexGizmo2.isUnderMouse;

      if (!startDragged && !endDragged) {
        return false;
      }

      var dragIndex = startDragged ? DragIndex.Start : DragIndex.End;
      this.startDrag(canvasX, canvasY, dragIndex);

      return true;
    } }, { key: "isDragging", value: function isDragging()

    {
      return this.dragIndex !== DragIndex.None;
    } }]);return TangentGizmo;}();export { TangentGizmo as default };
;