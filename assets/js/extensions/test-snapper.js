/*!
 * LMV v7.75.0
 *
 * Copyright 2022 Autodesk, Inc.
 * All rights reserved.
 *
 * This computer source code and related instructions and comments are the
 * unpublished confidential and proprietary information of Autodesk, Inc.
 * and are protected under Federal copyright and state trade secret law.
 * They may not be disclosed to, copied or used by any third party without
 * the prior written consent of Autodesk, Inc.
 *
 * Autodesk Forge Viewer Usage Limitations:
 *
 * The Autodesk Forge Viewer JavaScript must be delivered from an
 * Autodesk-hosted URL.
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./extensions/Snapping/SnapMath.js":
/*!*****************************************!*\
  !*** ./extensions/Snapping/SnapMath.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony export */ __webpack_require__.d(__webpack_exports__, {
    /* harmony export */   "intersectLines": () => (/* binding */ intersectLines),
    /* harmony export */   "nearestPointOnCircularArc": () => (/* binding */ nearestPointOnCircularArc)
    /* harmony export */ });
    
    // Collection of static math functions used for snapping implementation
    
    // Find closest point to p on a circular arc. 
    //  @param {Vector2} center
    //  @param {number} radius
    //  @param {number} startAngle, endAngle - ccw angles in radians. 0 means direction x+
    //  @param {Vector2} [outPoint]
    //  @param {Vector2}
    const nearestPointOnCircularArc = (p, center, radius, startAngle, endAngle, outPoint) => {
    
      outPoint = outPoint || new THREE.Vector2();
    
      // get normalized direction from circle center to p.
      // dir = (p-center).normalized()
      const dir = outPoint.copy(p).sub(center).normalize();
    
      // If the point is within the arc, we are done
      const angle = Math.atan2(dir.y, dir.x);
      const insideArc = Autodesk.Extensions.CompGeom.angleInsideArc(angle, startAngle, endAngle);
      if (insideArc) {
        // The ray from center towards p intersects the circle arc.
        // So, we obtain the closest point by projecting p onto the circle.
        //
        // Since dir is the normalized direction from center to p, we obtain the circle projection by:
        //  onCircleArc = center + dir * radius
        return dir.multiplyScalar(radius).add(center);
      }
    
      // The closest point on the circle is not on the arc.
      // Then the closest point must be one of the arc ends. Note that this conclusion
      // can only be made for circles, but not for ellipses with different radii.
      const pStart = Autodesk.Extensions.CompGeom.getEllipsePoint(startAngle, center.x, center.y, radius, radius);
      const pEnd = Autodesk.Extensions.CompGeom.getEllipsePoint(endAngle, center.x, center.y, radius, radius);
    
      const d2Start = pStart.distanceToSquared(p);
      const d2End = pEnd.distanceToSquared(p);
      const startIsCloser = d2Start <= d2End;
    
      outPoint.copy(startIsCloser ? pStart : pEnd);
      return outPoint;
    };
    
    // Compute intersection of two line segments
    // based on http://www.paulbourke.net/geometry/pointlineplane/
    //  @param {Vector2} p1, p2               - First line segment
    //  @param {Vector2} p3, p4               - Second line segment
    //  @param {bool}    [checkInsideSegment] - If true, we reject line intersections outside the segment ranges
    //  @param {Vector2} [outPoint]           - Optional target vector
    //  @param {number}  [epsilon]            - Nearly-zero threshold used to determine "nearly-parallel" resp. "nearly-zero-length line"
    //  @param {Vector2|null}
    const intersectLines = function (p1, p2, p3, p4, checkInsideSegment, outPoint) {let epsilon = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0.00001;
    
      const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    
      // Reject if lines are parallel or one of them has zero-length
      if (Math.abs(denom) < epsilon) {
        return null;
      }
    
      // ua denotes where to find the intersection point p along segment (p1, p2):
      //   For ua = 0, we have p = p1
      //   For ua = 1, we have p = p2
      let ua = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
      ua /= denom;
    
      // Apply segment check
      if (checkInsideSegment) {
    
        // ub denotes where to find the intersection point p along segment (p3, p4)
        let ub = (p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x);
        ub /= denom;
    
        // Intersection is within the segments if ua and ub are both in [0,1]
        if (ua < 0.0 || ua > 1.0 ||
        ub < 0.0 || ub > 1.0) {
          return null;
        }
      }
    
      outPoint = outPoint || new THREE.Vector2();
    
      outPoint.x = p1.x + ua * (p2.x - p1.x);
      outPoint.y = p1.y + ua * (p2.y - p1.y);
      return outPoint;
    };
    
    /***/ }),
    
    /***/ "./extensions/Snapping/Snapper.js":
    /*!****************************************!*\
      !*** ./extensions/Snapping/Snapper.js ***!
      \****************************************/
    /***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
    
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony export */ __webpack_require__.d(__webpack_exports__, {
    /* harmony export */   "Snapper": () => (/* binding */ Snapper)
    /* harmony export */ });
    /* harmony import */ var _SnapperIndicator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SnapperIndicator.js */ "./extensions/Snapping/SnapperIndicator.js");
    /* harmony import */ var _SnapMath_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./SnapMath.js */ "./extensions/Snapping/SnapMath.js");
    
    
    
    
    const MeasureCommon = Autodesk.Viewing.MeasureCommon;
    const EPSILON = MeasureCommon.EPSILON;
    const SnapType = MeasureCommon.SnapType;
    const SnapResult = MeasureCommon.SnapResult;
    
    var SNAP_PRECISION = 0.001;
    
    const av = Autodesk.Viewing;
    const avp = av.Private;
    const VertexBufferReader = avp.VertexBufferReader;
    
    /**
     * @param {number} a - First value to compare
     * @param {number} b - Second value to compare
     * @private
     */
    function isEqualWithPrecision(a, b) {
      return Math.abs(a - b) <= SNAP_PRECISION;
    }
    
    /**
     * Are the vectors equal within SNAP_PRECISION?
     * @param {THREE.Vector3} v1 - vector
     * @param {THREE.Vector3} v2 - vector
     * @returns {boolean} - true when they are equal
     * @private
     */
    function isEqualVectorsWithPrecision(v1, v2) {
      return Math.abs(v1.x - v2.x) <= SNAP_PRECISION &&
      Math.abs(v1.y - v2.y) <= SNAP_PRECISION &&
      Math.abs(v1.z - v2.z) <= SNAP_PRECISION;
    }
    
    /**
     * Are the vectors inverse of each other within SNAP_PRECISION?
     * @param {THREE.Vector3} v1 - vector
     * @param {THREE.Vector3} v2 - vector
     * @returns {boolean} - true when they are inverse of each other
     * @private
     */
    function isInverseVectorsWithPrecision(v1, v2) {
      return Math.abs(v1.x + v2.x) <= SNAP_PRECISION &&
      Math.abs(v1.y + v2.y) <= SNAP_PRECISION &&
      Math.abs(v1.z + v2.z) <= SNAP_PRECISION;
    }
    
    /**
     * @param {THREE.Vector3} point - Point 
     * @param {THREE.Vector3} lineStart - Start of the line
     * @param {THREE.Vector3} lineEnd - End of the line
     * @returns {number} - distance from point to the line
     * @private
     */
    function distancePointToLine(point, lineStart, lineEnd) {
    
      if (lineStart.equals(lineEnd)) {// Degenerate line
        return point.distanceTo(lineStart);
      }
    
      var X0 = new THREE.Vector3();
      var X1 = new THREE.Vector3();
      var distance;
      var param;
    
      X0.subVectors(lineStart, point);
      X1.subVectors(lineEnd, lineStart);
      param = X0.dot(X1);
      X0.subVectors(lineEnd, lineStart);
      param = -param / X0.dot(X0);
    
      if (param < 0) {
        distance = point.distanceTo(lineStart);
      } else if (param > 1) {
        distance = point.distanceTo(lineEnd);
      } else {
        X0.subVectors(point, lineStart);
        X1.subVectors(point, lineEnd);
        X0.cross(X1);
        X1.subVectors(lineEnd, lineStart);
    
        distance = Math.sqrt(X0.dot(X0)) / Math.sqrt(X1.dot(X1));
      }
    
      return distance;
    }
    
    const SnapCandidateType = {
      Unknown: 0,
      Line: 1,
      CircularArc: 2,
      EllipticalArc: 3 };
    
    
    // A SnapCandidate references a single segment (line or arc) that we could snap to.
    class SnapCandidate {
      constructor(viewportId) {
    
        this.type = SnapCandidateType.Unknown;
        this.viewportId = viewportId;
    
        // 2d distance between original (unsnapped) position and the geometry of this candidate.
        this.distance = 0;
    
        // {Vector2} Start/Endpoint - only for line segments
        this.lineStart = null;
        this.lineEnd = null;
    
        // Fixed radius - only for CircularArcs
        this.radius = 0;
    
        // Separate radii - only for ellipse arcs
        this.radiusX = 0; // = major radius - by convention
        this.radiusY = 0;
    
        // Center point as Vector2 (for arcs)
        this.center = null;
    
        // Start/end angle for arcs: Ccw angle in radians. Angle 0 corresponds to direction x+.
        this.startAngle = 0;
        this.endAngle = 0;
      }
    
      fromLine(p1, p2) {
        this.type = SnapCandidateType.Line;
        this.lineStart = p1.clone();
        this.lineEnd = p2.clone();
        return this;
      }
    
      fromCircularArc(center, radius, start, end) {
        this.type = SnapCandidateType.CircularArc;
        this.center = center.clone();
        this.radius = radius;
        this.start = start;
        this.end = end;
        return this;
      }
    
      fromEllipticalArc(center, radiusX, radiusY, start, end) {
        this.type = SnapCandidateType.EllipticalArc;
        this.center = center.clone();
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.start = start;
        this.end = end;
        return this;
      }
    
      isLine() {return this.type === SnapCandidateType.Line;}
      isCircularArc() {return this.type === SnapCandidateType.CirularArc;}
      isEllipticalArc() {return this.type === SnapCandidateType.EllipticalArc;}
    
      // Checks if the snapGeometry of this candidate intersects with another one.
      //  @param {SnapCandidate} other
      //  @param {Vector2} [optionalTarget]
      //  @returns {THREE.Vector2|null} Returns intersection point if there is one.
      getIntersection(other, optionalTarget) {
    
        if (this.isLine() && other.isLine()) {
          // Note: We do the intersections on the whole line - not just the intersections.
          // Reason is:
          //  a) Otherwise, it would not snap if you are slightly outline of one line segment
          //  b) By definition, we get only very close segment candidates anyway
          return (0,_SnapMath_js__WEBPACK_IMPORTED_MODULE_1__.intersectLines)(this.lineStart, this.lineEnd, other.lineStart, other.lineEnd, false, optionalTarget);
        }
    
        // TODO: Currently, we only support snapping to line-line intersections
      }}
    
    
    // Checks if we can snap to an intersection of two close segments (each can be a line or arcs).
    //  @param {SnapCandidate[]} candidates     - Snap candidate geometries collected in GeometryCallback. Assumed to be within snapRadius.
    //  @param {TREE.Vector3}    intersectPoint - Unsnapped original position
    //  @param {number}          snapRadius
    //  @returns {Object|null} If an intersection snap is found, the result contains:
    //                    {
    //                        viewportId  // number
    //                        snapPoint   // (THREE.Vector3)
    //                    }
    const findIntersectionSnap = (candidates, intersectPoint, snapRadius) => {
    
      // Sort snapping candidates by increasing distance
      // Strictly speaking, we just need the best two ones. But the number of candidates within the snapping
      // distance is generally small anyway - and working with a sorted array is more flexible to incrementally
      // make the snapping smarter later.
      const byDistance = (ca, cb) => ca.distance - cb.distance;
      candidates.sort(byDistance);
    
      // Stop here if we don't have enough candidates for an intersection
      if (candidates.length < 2) {
        return null;
      }
    
      // Init result object
      const result = {
        // Just use the one of the first candidate. There is no unique viewportId when using an intersection.
        viewportId: candidates[0].viewportId,
    
        // Snapping happens in 2d - so we set z in advance and just keep the original value.
        // Note: Snapper generally needs some revision if we use it for planes that are not perpendicular to the viewing direction.
        snapPoint: new THREE.Vector3(0, 0, intersectPoint.z) };
    
    
      // Check for any candidate that intersects with the closest one we found
      const first = candidates[0];
      for (let i = 1; i < candidates.length; i++) {
        const second = candidates[i];
    
        // Do intersection test. If found, write it to result.snapPoint
        const found = first.getIntersection(second, result.snapPoint);
        if (!found) {
          continue;
        }
    
        // We found an intersection. Although we assume all candidates to be within
        // snap radius already, the intersection may still be somewhere else.
        // => Check if intersection is still within the snapRadius.
        const dist = THREE.Vector2.prototype.distanceTo.call(result.snapPoint, intersectPoint);
        if (dist < snapRadius) {
          // We found a valid intersection snap
          return result;
        }
      }
      return null;
    };
    
    
    /**
     * A tool that lets users attach pointer events to vertices and edges. It supports 2D and 3D models.
     *
     * @param {Viewer3D} viewer - Viewer instance
     * @param {object} options - Configurations for the extension
     * @memberof Autodesk.Viewing.Extensions.Snapping
     * @alias Autodesk.Viewing.Extensions.Snapping.Snapper
     * @class
     */
    function Snapper(viewer, options) {
    
      var _snapResult = new SnapResult();
    
      var _viewer = viewer;
      this.setGlobalManager(viewer.globalManager);
    
      var _options = options || {};
      var _names;
    
      if (_options.markupMode) {
        _names = ["snapper-markup"];
      } else if (_options.toolName) {
        // Allow tools to use their own snapper
        _names = [_options.toolName];
      } else {
        _names = ["snapper"];
      }
    
      var _priority = 60;
    
      var _active = false;
    
      var _distanceToEdge = Number.MAX_VALUE;
      var _distanceToVertex = null;
    
      var _isDragging = false;
      var _isPressing = false;
      var _isSnapped = false;
    
      var _forcedVpId = null; // the viewport index of the first selection for 2D
    
      var _snapToPixel = false;
    
      var _snapFilter = null; // Optional snapping filter, based on snapResult. (snapResult) => boolean.
    
      this.indicator = new _SnapperIndicator_js__WEBPACK_IMPORTED_MODULE_0__.SnapperIndicator(viewer, this);
    
      this.markupMode = _options.markupMode;
      this.renderSnappedGeometry = _options.renderSnappedGeometry;
      this.renderSnappedTopology = _options.renderSnappedTopology;
    
      //Notice: The pixelSize should correspond to the amount of pixels per line in idAtPixels, the shape of
      //detection area is square in idAtPixels, but circle in snapper, should make their areas match roughly.
      this.detectRadiusInPixels = av.isMobileDevice() ? 50 : 10;
    
      /**
       * @returns {boolean} true when the tool is active
       *
       * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#isActive
       */
      this.isActive = function () {
        return _active;
      };
    
      this.getNames = function () {
        return _names;
      };
    
      this.getName = function () {
        return _names[0];
      };
    
      this.getPriority = function () {
        return _priority;
      };
    
      /**
       * Starts intercepting pointer events.
       * Invoked automatically by the {@link ToolController}.
       *
       * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#activate
       */
      this.activate = function () {
        _active = true;
    
        if (this.indicator.isNull()) {
          this.indicator = new _SnapperIndicator_js__WEBPACK_IMPORTED_MODULE_0__.SnapperIndicator(viewer, this);
        }
      };
    
    
      /**
       * Stops intercepting pointer events.
       * Invoked automatically by the {@link ToolController}.
       *
       * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#deactivate
       */
      this.deactivate = function () {
        _active = false;
    
        if (!this.indicator.isNull()) {
          this.indicator.destroy();
          this.indicator = new _SnapperIndicator_js__WEBPACK_IMPORTED_MODULE_0__.NullSnapperIndicator();
        }
      };
    
      this.copyResults = function (destiny) {
        _snapResult.copyTo(destiny);
      };
    
      this.getEdge = function () {
        return _snapResult.geomEdge;
      };
    
      this.getVertex = function () {
        return _snapResult.geomVertex;
      };
    
      this.getGeometry = function () {
        return _snapResult.getGeometry();
      };
    
      this.getGeometryType = function () {
        return _snapResult.geomType;
      };
    
      this.getIntersectPoint = function () {
        return _snapResult.intersectPoint;
      };
    
    
      /**
       * @returns {SnapResult} The snapping status of the last pointer event performed.
       *
       * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#getSnapResult
       */
      this.getSnapResult = function () {
        return _snapResult;
      };
    
      /**
       * Checks whether the tool's last update resulted on a snap.
       *
       * @returns {boolean} true when the last pointer event got snapped.
       *
       * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#isSnapped
       */
      this.isSnapped = function () {
        return _isSnapped;
      };
    
      this.clearSnapped = function () {
        _snapResult.clear();
        _isSnapped = false;
      };
    
      this.setViewportId = function (vpId) {
        _forcedVpId = vpId;
      };
    
      this.setSnapToPixel = function (enable) {
        _snapToPixel = enable;
      };
    
      this.getSnapToPixel = function () {
        return _snapToPixel;
      };
    
      this.setSnapToArc = function (enable) {
        _snapResult.snapToArc = enable;
      };
    
      this.getSnapToArc = function () {
        return _snapResult.snapToArc;
      };
    
      this.setArc = function (isArc) {
        _snapResult.isArc = isArc;
      };
    
      this.getArc = function () {
        return _snapResult.isArc;
      };
    
      this.setSnapFilter = function (filter) {
        _snapFilter = filter;
      };
    
      /**
       * 3D Snapping
       *
       * @param result -Result of Hit Test.
       */
      this.snapping3D = function (result) {
    
        _snapResult.snapNode = result.dbId;
        _snapResult.intersectPoint = result.intersectPoint;
        _snapResult.modelId = result.model ? result.model.id : null;
    
        var face = result.face;
    
        if (!result.model || result.fragId === undefined) {
          // some non-model geometry was hit
          if (result.object instanceof THREE.Mesh) {
            // if it was a mesh, try to snap to it
            this.meshSnapping(face, result.object);
          }
        } else {
          var fragIds;
    
          if (result.fragId.length === undefined) {
            fragIds = [result.fragId];
          } else {
            fragIds = result.fragId;
          }
    
          // This is for Fusion model with topology data
          _snapResult.hasTopology = result.model.hasTopology();
          if (_snapResult.hasTopology) {
            this.snapping3DwithTopology(face, fragIds, result.model);
          } else {
            this.snapping3DtoMesh(face, fragIds, result.model);
          }
        }
      };
    
    
      /**
       * Returns a function that sets a vertex (Vector3 or LmvVector3) to the data read from a vertex buffer at idx
       * Signature: func(idx, vertex) -> vertex
       *            if vertex is null/undefined, a new THREE.Vector3 is created
       *
       * @param {BufferGeometry} geometry - the geometry of mesh
       *
       * @private
       */
    
      this.makeReadVertexFunc = function (geometry) {
        const attributes = geometry.attributes;
        let positions, stride;
        // Get the offset to positions in the buffer. Be careful, 2D buffers
        // don't use the 'position' attribute for positions. Reject those.
        // meshes use vblayout for describing the buffer structure, BufferGeometry uses attributes.xx
        let poffset;
    
    
        if (geometry.vblayout) {
          if (!geometry.vblayout.position) {
            return function () {}; // No positions, what to do??
          }
          poffset = geometry.vblayout.position.offset;
        } else if (!attributes.position) {
          return function () {}; // No positions, what to do??
        } else {
          poffset = attributes.position.offset || 0;
        }
    
    
    
    
    
    
    
    
    
        positions = geometry.vb ? geometry.vb : geometry.attributes.position.array;
        stride = geometry.vb ? geometry.vbstride : 3;
    
    
    
    
    
        return function (idx, v) {
          const p = idx * stride + poffset;
          v = v || new THREE.Vector3();
          v.set(
          positions[p],
          positions[p + 1],
          positions[p + 2]);
    
          return v;
        };
      };
    
      /**
       * Snapping order is: 1st vertices, 2nd edges, 3rd and final faces.
       *
       * @param face
       * @param fragIds
       * @param model
       * @private
       */
      this.snapping3DwithTopology = function (face, fragIds, model) {
    
        // Because edge topology data may be in other fragments with same dbId, need to iterate all of them.
        if (_snapResult.snapNode) {
          fragIds = [];
    
          model.getData().instanceTree.enumNodeFragments(_snapResult.snapNode, function (fragId) {
            fragIds.push(fragId);
          }, true);
        }
    
        _snapResult.geomFace = _snapResult.geomEdge = _snapResult.geomVertex = null;
        _distanceToEdge = Number.MAX_VALUE;
    
        for (var fi = 0; fi < fragIds.length; ++fi) {
    
          var fragId = fragIds[fi];
          var mesh = _viewer.impl.getRenderProxy(model, fragId);
          var geometry = mesh.geometry;
    
          var topoIndex = model.getTopoIndex(fragId);
          var topology = model.getTopology(topoIndex);
          var facesTopology = topology.faces;
          var edgesTopology = topology.edges;
    
          if (!_snapResult.geomFace) {
            _snapResult.geomFace = this.faceSnappingWithTopology(face, geometry, facesTopology, mesh);
    
            if (_snapResult.geomFace) {
              _snapResult.geomFace.fragId = fragId;
            }
    
            var normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
            _snapResult.faceNormal = face.normal.applyMatrix3(normalMatrix).normalize();
          }
    
          // Need to iterate all frags with same dbId, because when meshes are attached with each other, 
          // edge-topology data will only be on one mesh.
          this.edgeSnappingWithTopology(_snapResult.intersectPoint, geometry, edgesTopology, mesh);
    
        }
    
        _snapResult.geomVertex = this.vertexSnappingWithTopology(_snapResult.geomEdge, _snapResult.intersectPoint);
    
        if (_snapResult.geomFace) {
    
          // Determine which one should be drawn: face , edge or vertex
          _snapResult.radius = this.setDetectRadius(_snapResult.intersectPoint);
    
          if ((_options.forceSnapVertices || _distanceToVertex < _snapResult.radius) && _snapResult.geomVertex) {
            _snapResult.geomType = SnapType.SNAP_VERTEX;
          } else
          if ((_options.forceSnapEdges || _distanceToEdge < _snapResult.radius) && _snapResult.geomEdge) {
    
            var center = this.edgeIsCircle(_snapResult.geomEdge);
            if (center) {
              _snapResult.circularArcCenter = center;
    
              _snapResult.circularArcRadius = center.distanceTo(_snapResult.geomEdge.vertices[0]);
    
    
    
    
              _snapResult.geomEdge.center = _snapResult.circularArcCenter;
              _snapResult.geomEdge.radius = _snapResult.circularArcRadius;
              _snapResult.geomType = SnapType.SNAP_CIRCULARARC;
            } else
            if (this.edgeIsCurved(_snapResult.geomEdge)) {
              _snapResult.geomType = SnapType.SNAP_CURVEDEDGE;
            } else
            {
              _snapResult.geomType = SnapType.SNAP_EDGE;
            }
    
          } else
          {
    
            if (this.faceIsCurved(_snapResult.geomFace)) {
              _snapResult.geomType = SnapType.SNAP_CURVEDFACE;
            } else
            {
              _snapResult.geomType = SnapType.SNAP_FACE;
            }
    
          }
    
          _isSnapped = true;
        }
      };
    
      this.meshSnapping = function (face, mesh) {
        var geometry = mesh.geometry;
    
        // Handle 3D line geometry
        const isLine = mesh.isLine || mesh.isWideLine;
        if (isLine && face) {
    
          // For line meshes, face is a line {a, b} instead of a Face3 instance (see lineRayCast(..) in VBIntersector.js,
          // where a, b are vertex indices into the line mesh vertex array.
          //
          // Note: Unlike edge intersection for faces, we just use the line segment itself and don't search for topology
          //       of connected line segments to identify polylines as one item. If we need this, we have to add the corresponding code first.
          _snapResult.geomEdge = this.extractLineGeometry(face, geometry);
          _snapResult.geomEdge.applyMatrix4(mesh.matrixWorld);
    
          _snapResult.geomVertex = this.vertexSnapping(_snapResult.geomEdge, _snapResult.intersectPoint);
    
          _snapResult.radius = this.setDetectRadius(_snapResult.intersectPoint);
    
          // Determine which one should be drawn: edge or vertex
          if (_options.forceSnapVertices || _distanceToVertex < _snapResult.radius) {
            _snapResult.geomType = SnapType.SNAP_VERTEX;
          } else
          {
            // Note: Since we got the edge as hit result, we can already assume the intersection to be close to the line.
            _snapResult.geomType = SnapType.SNAP_EDGE;
          }
    
          _isSnapped = true;
          return true;
        }
    
        // Note that face may also be a line {a, b} (see lineRayCast(..) in VBIntersector.js
        if (face instanceof THREE.Face3) {
          _snapResult.geomFace = this.faceSnapping(face, geometry);
        }
    
        if (!_snapResult.geomFace)
        return false;
    
        _snapResult.geomFace.applyMatrix4(mesh.matrixWorld);
        _snapResult.geomEdge = this.edgeSnapping(_snapResult.geomFace, _snapResult.intersectPoint);
        _snapResult.geomVertex = this.vertexSnapping(_snapResult.geomEdge, _snapResult.intersectPoint);
    
        var normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
        _snapResult.faceNormal = face.normal.applyMatrix3(normalMatrix).normalize();
    
        _snapResult.radius = this.setDetectRadius(_snapResult.intersectPoint);
    
        // Determine which one should be drawn: face, edge or vertex
        if (_options.forceSnapVertices || _distanceToVertex < _snapResult.radius) {
          _snapResult.geomType = SnapType.SNAP_VERTEX;
        } else
        if (_options.forceSnapEdges || _distanceToEdge < _snapResult.radius) {
          _snapResult.geomType = SnapType.SNAP_EDGE;
        } else
        {
          _snapResult.geomType = SnapType.SNAP_FACE;
        }
    
        _isSnapped = true;
        return true;
      };
    
      this.snapping3DtoMesh = function (face, fragIds, model) {
        for (var fi = 0; fi < fragIds.length; ++fi) {
    
          var fragId = fragIds[fi];
          var mesh = _viewer.impl.getRenderProxy(model, fragId);
    
          if (this.meshSnapping(face, mesh)) {
            break;
          }
        }
      };
    
      this.faceSnappingWithTopology = function (face, geometry, facesTopology, mesh) {
    
        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();
        var vC = new THREE.Vector3();
    
        let geom;
    
        geom = new THREE.Geometry();
    
    
    
        const vertices = [];
    
        if (geometry.index !== undefined) {
    
          // Find the index of face topology list which includes the intersect face(triangle)
          for (var i = 0; i < facesTopology.length; i++) {
    
            var indexList = facesTopology[i].indexList;
            var faceId = facesTopology[i].id;
            let j = 0;
            for (; j < indexList.length; j += 3) {
    
              if (face.a === indexList[j]) {
                if (face.b === indexList[j + 1] && face.c === indexList[j + 2] || face.b === indexList[j + 2] && face.c === indexList[j + 1]) {
                  break;
                }
              } else
              if (face.a === indexList[j + 1]) {
                if (face.b === indexList[j] && face.c === indexList[j + 2] || face.b === indexList[j + 2] && face.c === indexList[j]) {
                  break;
                }
              } else
              if (face.a === indexList[j + 2]) {
                if (face.b === indexList[j] && face.c === indexList[j + 1] || face.b === indexList[j + 1] && face.c === indexList[j]) {
                  break;
                }
              }
            }
    
            if (j < indexList.length) {
              break;
            }
          }
    
          if (i < facesTopology.length) {
    
            const readVertex = this.makeReadVertexFunc(geometry);
    
            for (let j = 0; j < indexList.length; j += 3) {
              readVertex(indexList[j], vA);
              readVertex(indexList[j + 1], vB);
              readVertex(indexList[j + 2], vC);
    
    
              const vIndex = vertices.length;
              geom.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2));
    
              vertices.push(vA.clone());
              vertices.push(vB.clone());
              vertices.push(vC.clone());
            }
    
            geom.vertices = vertices;
    
    
    
    
          }
        }
    
        if (vertices.length > 0) {
    
          geom.faceId = faceId;
          geom.applyMatrix4(mesh.matrixWorld);
          return geom;
        } else
        {
    
          return null;
        }
    
      };
    
      /**
       * Find the closest face next to the cast ray
       *
       * @param {THREE.Face3} face - the intersect triangle of Hit Test.
       * @param {BufferGeometry} geometry - the geometry of mesh
       *
       * @private
       */
      this.faceSnapping = function (face, geometry) {
    
        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();
        var vC = new THREE.Vector3();
    
        let geom;
        const vertices = [];
    
        geom = new THREE.Geometry(); //Geometry which includes all the triangles on the same plane.
    
    
    
    
        var indices = geometry.index && (geometry.index.array || geometry.ib);
        var offsets = geometry.groups;
    
        if (!offsets || offsets.length === 0) {
    
          let positions;
    
          positions = geometry.vb ? geometry.vb : geometry.attributes.position.array;
    
    
    
          offsets = [{ start: 0, count: indices ? indices.length : positions.length, index: 0 }];
    
        }
    
        const readVertex = this.makeReadVertexFunc(geometry);
    
        const va = readVertex(face.a);
    
        for (var oi = 0; oi < offsets.length; ++oi) {
    
          var start = offsets[oi].start;
          var count = offsets[oi].count;
          var index = offsets[oi].index;
    
          for (var i = start; i < start + count; i += 3) {
    
            var a = index + (indices ? indices[i] : i);
            var b = index + (indices ? indices[i + 1] : i + 1);
            var c = index + (indices ? indices[i + 2] : i + 2);
    
            readVertex(a, vA);
            readVertex(b, vB);
            readVertex(c, vC);
    
            var faceNormal = new THREE.Vector3();
            THREE.Triangle.getNormal(vA, vB, vC, faceNormal);
    
            if (isEqualVectorsWithPrecision(faceNormal, face.normal) && isEqualWithPrecision(faceNormal.dot(vA), face.normal.dot(va)))
            {
    
    
              const vIndex = vertices.length;
              geom.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2));
    
              vertices.push(vA.clone());
              vertices.push(vB.clone());
              vertices.push(vC.clone());
            }
          }
        }
    
        geom.vertices = vertices;
    
    
    
    
    
        if (vertices.length > 0) {
    
          return this.getTrianglesOnSameFace(geom, face, readVertex);
        } else
        {
    
          return null;
        }
      };
    
      /**
       * Find triangles on the same face with the triangle intersected with the cast ray
       *
       * @param geom -Geometry which includes all the triangles on the same plane.
       * @param face -Triangle which intersects with the cast ray.
       * @param readVertexCB -Accessor function to read vertex data (see makeReadVertexFunc)
       *
       * @private
       */
      this.getTrianglesOnSameFace = function (geom, face, readVertexCB) {
    
        var isIncludeFace = false; // Check if the intersect face is in the mesh
        let vertexIndices = [];
    
        vertexIndices = geom.vertices.slice();
    
    
    
    
    
    
        const va = readVertexCB(face.a);
        const vb = readVertexCB(face.b);
        const vc = readVertexCB(face.c);
    
        let intersectFace;
    
        intersectFace = new THREE.Geometry();
        intersectFace.faces.push(new THREE.Face3(0, 1, 2));
    
    
    
        const vertices = [];
        vertices.push(va);
        vertices.push(vb);
        vertices.push(vc);
    
        var vCount = [];
    
        do {
    
          vCount = [];
    
          for (var j = 0; j < vertexIndices.length; j += 3) {
            // The triangle which is intersected with the ray
            if (vertexIndices[j].equals(va) && vertexIndices[j + 1].equals(vb) && vertexIndices[j + 2].equals(vc)) {
    
              isIncludeFace = true;
              vCount.push(j);
              continue;
            }
    
            for (var k = 0; k < vertices.length; k += 3) {
    
              // The triangles which are on the same face with the intersected triangle
              if (this.trianglesSharedEdge(vertexIndices[j], vertexIndices[j + 1], vertexIndices[j + 2],
              vertices[k], vertices[k + 1], vertices[k + 2])) {
    
    
                const vIndex = vertices.length;
                intersectFace.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2));
    
                vertices.push(vertexIndices[j].clone());
                vertices.push(vertexIndices[j + 1].clone());
                vertices.push(vertexIndices[j + 2].clone());
    
                vCount.push(j);
                break;
              }
            }
          }
    
          for (var ci = vCount.length - 1; ci >= 0; --ci) {
            vertexIndices.splice(vCount[ci], 3);
          }
    
        } while (vCount.length > 0);
    
        if (isIncludeFace) {
    
          intersectFace.vertices = vertices;
    
    
    
          return intersectFace;
        } else
        {
          return null;
        }
    
      };
    
      /**
       * Check if the two triangle share edge, the inputs are their vertices
       *
       * @param a1
       * @param a2
       * @param a3
       * @param b1
       * @param b2
       * @param b3
       * @private
       */
      this.trianglesSharedEdge = function (a1, a2, a3, b1, b2, b3) {
    
        var c1 = false;
        var c2 = false;
        var c3 = false;
    
        if (a1.equals(b1) || a1.equals(b2) || a1.equals(b3)) {
          c1 = true;
        }
        if (a2.equals(b1) || a2.equals(b2) || a2.equals(b3)) {
          c2 = true;
        }
        if (a3.equals(b1) || a3.equals(b2) || a3.equals(b3)) {
          c3 = true;
        }
    
        if (c1 & c2 || c1 & c3 || c2 & c3) {
          return true;
        }
    
        return false;
      };
    
      this.edgeSnappingWithTopology = function (intersectPoint, geometry, edgesTopology, mesh) {
    
        let edgeGeom;
        const vertices = [];
    
        edgeGeom = new THREE.Geometry(); //Geometry which includes all the triangles on the same plane.
    
    
    
        var minDistTopoIndex;
        var minDist = Number.MAX_VALUE;
    
        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();
    
        if (geometry.index !== undefined && edgesTopology != undefined) {
    
          const readVertex = this.makeReadVertexFunc(geometry);
          // Find the index of edge topology list which includes the nearest edge segment to the intersect point
          for (var i = 0; i < edgesTopology.length; i++) {
    
            var indexList = edgesTopology[i].indexList;
            // In edges topology index list the type is LineStrip
            for (var j = 0; j < indexList.length - 1; j++) {
              readVertex(indexList[j], vA);
              readVertex(indexList[j + 1], vB);
    
              vA.applyMatrix4(mesh.matrixWorld);
              vB.applyMatrix4(mesh.matrixWorld);
    
              var dist = distancePointToLine(intersectPoint, vA, vB);
              if (dist < minDist) {
                minDist = dist;
                minDistTopoIndex = i;
              }
            }
          }
    
          if (minDistTopoIndex) {
            indexList = edgesTopology[minDistTopoIndex].indexList;
            for (var k = 0; k < indexList.length - 1; k++) {
              const vK0 = readVertex(indexList[k]);
              const vK1 = readVertex(indexList[k + 1]);
    
              vertices.push(vK0);
              // To make the line's type to LinePieces which is used by drawLine function
              vertices.push(vK1);
            }
          }
    
          edgeGeom.vertices = vertices;
    
    
    
        }
    
        if (_distanceToEdge >= minDist && vertices.length > 0) {
    
          _distanceToEdge = minDist;
          edgeGeom.applyMatrix4(mesh.matrixWorld);
          _snapResult.geomEdge = edgeGeom;
        }
      };
    
      /**
       * Get Edge geometry for the case that the hittest result contained a 3D lines. For this case, we have no Face3, so
       * that faceSnapping and edgeSnapping don't work.
       * 
       *  @param {Object}         edge     - {a, b} with vertex indices a,b of lineStart/lineEnd vertex
       *  @param {GeometryBuffer} geometry
       *  @returns {THREE.Geometry|THREE.BufferGeometry} Geometry with simple line
       */
      this.extractLineGeometry = function (edge, geometry) {
    
        const readVertex = this.makeReadVertexFunc(geometry);
        const va = readVertex(edge.a);
        const vb = readVertex(edge.b);
    
        let edgeGeom;
    
        edgeGeom = new THREE.Geometry();
        edgeGeom.vertices.push(va, vb);
    
    
    
    
        return edgeGeom;
      };
    
      /**
       * Find the closest edge next to the intersect point
       *
       * @param face -Face which is found by faceSnapping.
       * @param intersectPoint -IntersectPoint between cast ray and face.
       *
       * @private
       */
      this.edgeSnapping = function (face, intersectPoint) {
    
        let lineGeom, verticesLength, facePos;
        const vertices = [];
    
        verticesLength = face.vertices.length;
    
    
    
    
        var isEdge_12 = true;
        var isEdge_13 = true;
        var isEdge_23 = true;
    
        for (var i = 0; i < verticesLength; i += 3) {
          let pi0, pi1, pi2;
    
          pi0 = face.vertices[i];
          pi1 = face.vertices[i + 1];
          pi2 = face.vertices[i + 2];
    
    
    
    
    
    
          for (var j = 0; j < verticesLength; j += 3) {
            if (i !== j) {
              let pj0, pj1, pj2;
    
              pj0 = face.vertices[j];
              pj1 = face.vertices[j + 1];
              pj2 = face.vertices[j + 2];
    
    
    
    
    
              // Check edge 12
              if ((pi0.equals(pj0) || pi0.equals(pj1) || pi0.equals(pj2)) && (
              pi1.equals(pj0) || pi1.equals(pj1) || pi1.equals(pj2))) {
                isEdge_12 = false;
              }
              // Check edge 13
              // Check edge 12
              if ((pi0.equals(pj0) || pi0.equals(pj1) || pi0.equals(pj2)) && (
              pi2.equals(pj0) || pi2.equals(pj1) || pi2.equals(pj2))) {
                isEdge_13 = false;
              }
              // Check edge 23
              // Check edge 12
              if ((pi1.equals(pj0) || pi1.equals(pj1) || pi1.equals(pj2)) && (
              pi2.equals(pj0) || pi2.equals(pj1) || pi2.equals(pj2))) {
                isEdge_23 = false;
              }
            }
          }
    
          if (isEdge_12) {
            vertices.push(pi0.clone());
            vertices.push(pi1.clone());
          }
          if (isEdge_13) {
            vertices.push(pi0.clone());
            vertices.push(pi2.clone());
          }
          if (isEdge_23) {
            vertices.push(pi1.clone());
            vertices.push(pi2.clone());
          }
    
          isEdge_12 = true;
          isEdge_13 = true;
          isEdge_23 = true;
    
        }
    
        //return lineGeom;
    
        let edgeGeom = new THREE.BufferGeometry();
        let edgeVertices = [];
    
        edgeGeom = new THREE.Geometry();
    
    
    
        var minDistIndex;
        var minDist = Number.MAX_VALUE;
    
        for (var k = 0; k < vertices.length; k += 2) {
    
          var dist = distancePointToLine(intersectPoint, vertices[k], vertices[k + 1]);
    
          if (dist < minDist) {
            minDist = dist;
            minDistIndex = k;
          }
    
        }
    
        edgeVertices.push(vertices[minDistIndex].clone());
        edgeVertices.push(vertices[minDistIndex + 1].clone());
    
    
        lineGeom = new THREE.Geometry();
        lineGeom.vertices = vertices;
        edgeGeom.vertices = this.getConnectedLineSegmentsOnSameLine(lineGeom, edgeVertices);
    
    
    
    
    
    
        _distanceToEdge = minDist;
    
        return edgeGeom;
      };
    
      this.getConnectedLineSegmentsOnSameLine = function (lineGeom, edgeVertices) {
    
        let vertices = [];
    
        vertices = lineGeom.vertices.slice();
    
    
    
    
    
    
        var va = edgeVertices[0];
        var vb = edgeVertices[1];
    
        var vCount = [];
    
        do {
    
          vCount = [];
    
          for (var j = 0; j < vertices.length; j += 2) {
    
            // The line which has min distance to intersection point
            if (vertices[j].equals(va) && vertices[j + 1].equals(vb)) {
    
              continue;
            }
    
            for (var k = 0; k < edgeVertices.length; k += 2) {
    
              // The line segments which are connected on the same line
              if (vertices[j].equals(edgeVertices[k]) || vertices[j + 1].equals(edgeVertices[k]) ||
              vertices[j].equals(edgeVertices[k + 1]) || vertices[j + 1].equals(edgeVertices[k + 1])) {
    
                var V0 = new THREE.Vector3();
                var V1 = new THREE.Vector3();
    
                V0.subVectors(edgeVertices[k], edgeVertices[k + 1]);
                V0.normalize();
                V1.subVectors(vertices[j], vertices[j + 1]);
                V1.normalize();
    
                //if (V0.equals(V1) || V0.equals(V1.negate())) {
                if (isEqualVectorsWithPrecision(V0, V1) || isInverseVectorsWithPrecision(V0, V1))
                {
    
                  vCount.push(j);
                  break;
    
                }
              }
            }
          }
    
          for (var ci = vCount.length - 1; ci >= 0; --ci) {
    
            edgeVertices.push(vertices[vCount[ci]]);
            edgeVertices.push(vertices[vCount[ci] + 1]);
            vertices.splice(vCount[ci], 2);
          }
    
        } while (vCount.length > 0);
    
        return edgeVertices;
    
      };
    
      this.vertexSnappingWithTopology = function (edge, intersectPoint) {
    
        var minDist = Number.MAX_VALUE;
        var point = new THREE.Vector3();
        if (!edge) {
          return point;
        }
    
        let verticesLength, edgePos;
    
        verticesLength = edge.vertices.length;
    
    
    
    
    
    
        if (verticesLength > 1) {
          let start, end;
    
          start = edge.vertices[0];
          end = edge.vertices[edge.vertices.length - 1];
    
    
    
    
          var dist1 = intersectPoint.distanceTo(start);
          var dist2 = intersectPoint.distanceTo(end);
    
          if (dist1 <= dist2) {
            minDist = dist1;
            point = start.clone();
          } else
          {
            minDist = dist2;
            point = end.clone();
          }
        }
    
        _distanceToVertex = minDist;
    
        return point;
      };
    
      /**
       * Find the closest vertex next to the intersect point
       *
       * @param edge -Edge which is found by edgeSnapping.
       * @param intersectPoint -IntersectPoint between cast ray and face.
       *
       * @private
       */
      this.vertexSnapping = function (edge, intersectPoint) {
    
        var minDist = Number.MAX_VALUE;
        var point = new THREE.Vector3();
        let verticesLength, edgePos;
    
        verticesLength = edge.vertices.length;
    
    
    
    
    
        for (let i = 0; i < verticesLength; ++i) {
          let pt;
    
          pt = edge.vertices[i];
    
    
    
          const dist = intersectPoint.distanceTo(pt);
    
          if (dist < minDist - SNAP_PRECISION) {
    
            minDist = dist;
            point = pt.clone();
    
          }
        }
    
        _distanceToVertex = minDist;
    
        return point;
      };
    
      // This is only a workaround to detect if an edge is circle
      this.edgeIsCircle = function (edge) {
    
        let verticesLength, vertices, edgePos;
    
        vertices = edge.vertices;
        verticesLength = vertices.length;
    
    
    
    
    
        // Exclude squares and regular polygons
        if (verticesLength < 8) {
          return false;
        }
    
        let start, end;
    
        start = vertices[0];
        end = vertices[vertices.length - 1];
    
    
    
    
    
        if (start.equals(end)) {
    
          var center = new THREE.Vector3(0, 0, 0);
          for (let i = 0; i < verticesLength; i += 2) {
    
            center.add(vertices[i]);
    
    
    
          }
          center.divideScalar(verticesLength / 2.0);
    
          var radius = center.distanceTo(start);
          for (let i = 0; i < verticesLength; i += 2) {
            let pt;
    
            pt = vertices[i];
    
    
    
            if (Math.abs(center.distanceTo(pt) - radius) <= SNAP_PRECISION) {
              continue;
            } else
            {
              return false;
            }
          }
          return center;
        } else
        {
          return false;
        }
      };
    
      this.edgeIsCurved = function (edge) {
    
        let verticesLength, vertices, edgePos, start, end;
    
        vertices = edge.vertices;
        verticesLength = vertices.length;
        start = vertices[0];
        end = vertices[vertices.length - 1];
    
    
    
    
    
    
    
        if (verticesLength <= 2) {
          return false;
        } else
        if (start.equals(end)) {
          return true;
        } else
        {
          var V1 = new THREE.Vector3();
          let pi0, pi1;
    
          pi1 = vertices[1];
    
    
    
    
          V1.subVectors(start, pi1);
    
          var V2 = new THREE.Vector3();
          for (var i = 2; i < verticesLength; i += 2) {
    
            pi0 = vertices[i];
            pi1 = vertices[i + i];
    
    
    
    
            V2.subVectors(pi0, pi1);
            if (!isEqualVectorsWithPrecision(V1, V2)) {
              return true;
            }
          }
    
          return false;
        }
      };
    
      /**
       * Checks if the given geometry is curved
       * @param {THREE.BufferGeometry} face The geometry
       * @returns {boolean} True if the any of the faces composing the geometry is curved
       */
      this.faceIsCurved = function (face) {
    
        let vertices, faces, geomPos, vA1;
    
        vertices = face.vertices;
        faces = face.faces;
    
    
    
    
    
    
        if (faces.length <= 1) {return false;}
    
    
    
    
        var fN1 = new THREE.Vector3();
    
        vA1 = vertices[faces[0].a];
        THREE.Triangle.getNormal(vertices[faces[0].a], vertices[faces[0].b], vertices[faces[0].c], fN1);
    
    
    
    
    
        var fN2 = new THREE.Vector3();
    
        for (let i = 1; i < faces.length; i++) {
          const vA2 = vertices[faces[i].a];
          THREE.Triangle.getNormal(vertices[faces[i].a], vertices[faces[i].b], vertices[faces[i].c], fN2);
          if (!isEqualVectorsWithPrecision(fN1, fN2) || !isEqualWithPrecision(fN1.dot(vA1), fN2.dot(vA2))) {
            return true;
          }
        }
    
    
    
    
    
    
    
    
    
    
    
        return false;
      };
    
      this.angleVector2 = function (vector) {
    
        if (vector.x > 0 && vector.y >= 0) {
          return Math.atan(vector.y / vector.x);
        } else
        if (vector.x >= 0 && vector.y < 0) {
          return Math.atan(vector.y / vector.x) + Math.PI * 2;
        } else
        if (vector.x < 0 && vector.y <= 0) {
          return Math.atan(vector.y / vector.x) + Math.PI;
        } else
        if (vector.x <= 0 && vector.y > 0) {
          return Math.atan(vector.y / vector.x) + Math.PI;
        } else
        {// x = 0, y = 0
          return null;
        }
      };
    
      // Creates a THREE.Geometry or THREE.BufferGeometry for tug build that represents an approximation of a given elliptical arc in {z=0} plane.
      // Points are obtained by by uniform sampling of a given elliptical arc.
      //  @param {number} numPoints - The length number of points that the output geometry will contain. segments in which we subdivide the arc. Resulting point count is numSegments+1.
      // See getEllipseArcPoint() for param details.
      const createEllipticalArcGeometry = (cx, cy, rx, ry, startAngle, endAngle, numPoints) => {
        let geometry;
    
        geometry = new THREE.Geometry();
    
    
    
        const vertices = [];
        for (let i = 0; i < numPoints; i++) {
          const p = new THREE.Vector3(0, 0, 0);
          const t = i / (numPoints - 1);
          Autodesk.Extensions.CompGeom.getEllipseArcPoint(t, cx, cy, rx, ry, startAngle, endAngle, 0.0, p);
          vertices.push(p);
        }
    
        geometry.vertices = vertices;
    
    
    
        return geometry;
      };
    
      /**
       * @param {Viewer3D} viewer - Viewer instance
       * @param snapper
       * @param aDetectRadius
       * @private
       */
      function GeometryCallback(viewer, snapper, aDetectRadius) {
        this.viewer = viewer;
        this.snapper = snapper;
    
    
        this.lineGeom = new THREE.Geometry();
    
    
    
    
        this.circularArc = null;
        this.circularArcCenter;
        this.circularArcRadius;
        this.ellipticalArc = null;
        this.ellipticalArcCenter;
    
        this.minDist = Number.MAX_VALUE;
    
        this.matrix = new THREE.Matrix4();
    
        this.vpIdLine = null;
        this.vpIdCircular = null;
        this.vpIdElliptical = null;
    
        this.detectRadius = aDetectRadius;
    
        // Collects candidate segments that we can snap to.
        // This is used to allow snapping to segment intersections.
        this.snapCandidates = []; // {SnappingCandidate[]}
      }
    
      GeometryCallback.prototype.onLineSegment = function (x1, y1, x2, y2, vpId) {
        var intersectPoint = this.snapper.getIntersectPoint();
        let linePos, vertices;
    
        vertices = this.lineGeom.vertices;
    
    
    
        var v1 = new THREE.Vector3(x1, y1, intersectPoint.z);
        var v2 = new THREE.Vector3(x2, y2, intersectPoint.z);
    
        // LMV-5515: Apply the supplied matrix to the line vector's
        if (this.matrix) {
          v1.applyMatrix4(this.matrix);
          v2.applyMatrix4(this.matrix);
        }
    
        // Skip segments outside detectRadius
        var dist = distancePointToLine(intersectPoint, v1, v2);
        if (dist > this.detectRadius) {
          return;
        }
    
        // Collect snap candidate
        this.snapCandidates.push(new SnapCandidate(vpId, dist).fromLine(v1, v2));
    
        // Track minDist and lineGeometry for best hit so far
        if (dist < this.minDist) {
    
          vertices.splice(0, 2, v1, v2);
    
    
    
    
    
    
    
    
    
          this.minDist = dist;
    
          this.vpIdLine = vpId;
        }
      };
    
      GeometryCallback.prototype.onCircularArc = function (cx, cy, start, end, radius, vpId) {
        var intersectPoint = this.snapper.getIntersectPoint();
        var point = new THREE.Vector2(intersectPoint.x, intersectPoint.y);
    
        var center = new THREE.Vector2(cx, cy);
        point.sub(center);
    
        // Compute closest point on arc
        const pointOnArc = (0,_SnapMath_js__WEBPACK_IMPORTED_MODULE_1__.nearestPointOnCircularArc)(intersectPoint, center, radius, start, end);
        const dist = pointOnArc.distanceTo(intersectPoint); // 2D distance
    
        // Collect snap candidate
        this.snapCandidates.push(new SnapCandidate(vpId, dist).fromCircularArc(center, radius, start, end));
    
        // Skip arcs outside detectRadius
        if (dist > this.detectRadius) {
          return;
        }
    
        // TODO: get rid of the CircleGeometry stuff below, because we computed the snapPoint above already.
        //       But this needs some refactoring, because the Geometry is passed around outside of snapper.
    
        var angle = this.snapper.angleVector2(point);
    
        let arc;
        if (end > start && angle >= start && angle <= end) {
          arc = new THREE.CircleGeometry(radius, 100, start, end - start);
        } else
        if (end < start && (angle >= start || angle <= end)) {
          arc = new THREE.CircleGeometry(radius, 100, start, Math.PI * 2 - start + end);
        } else
        {
          return;
        }
    
    
        {
          arc.vertices.splice(0, 1);
        }
    
    
    
    
    
    
    
    
        arc.applyMatrix4(new THREE.Matrix4().makeTranslation(cx, cy, intersectPoint.z));
        this.circularArc = arc;
        this.circularArcCenter = new THREE.Vector3(cx, cy, intersectPoint.z);
        this.circularArcRadius = radius;
    
        this.snapPoint = new THREE.Vector3(pointOnArc.x, pointOnArc.y, intersectPoint.z);
    
        this.vpIdCircular = vpId;
      };
    
      GeometryCallback.prototype.onEllipticalArc = function (cx, cy, start, end, major, minor, tilt, vpId) {
        var intersectPoint = this.snapper.getIntersectPoint();
        var point = new THREE.Vector2(intersectPoint.x, intersectPoint.y);
    
        var major1 = major - this.detectRadius;
        var minor1 = minor - this.detectRadius;
        var major2 = major + this.detectRadius;
        var minor2 = minor + this.detectRadius;
    
        var equation1 = (point.x - cx) * (point.x - cx) / (major1 * major1) + (point.y - cy) * (point.y - cy) / (minor1 * minor1);
        var equation2 = (point.x - cx) * (point.x - cx) / (major2 * major2) + (point.y - cy) * (point.y - cy) / (minor2 * minor2);
    
        var center = new THREE.Vector2(cx, cy);
        point.sub(center);
        point.x *= minor;
        point.y *= major;
        var angle = this.snapper.angleVector2(point);
    
        if (end > Math.PI * 2) {
          end = Math.PI * 2;
        }
    
        if (equation1 >= 1 && equation2 <= 1) {
    
          if (end > start && angle >= start && angle <= end || end < start && (angle >= start || angle <= end)) {
            var arc = createEllipticalArcGeometry(cx, cy, major, minor, start, end, 50);
            if (!isEqualWithPrecision(end - start, Math.PI * 2))
            {
    
              arc.vertices.pop();
    
    
    
    
    
            }
            arc.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, intersectPoint.z));
    
            // Compute distance between geometry and snapped point. 
            // We use the same way here as in getSnapResultPosition(). This will be replaced later by a more accurate solution.
            const nearestPoint = MeasureCommon.nearestVertexInVertexToEdge(intersectPoint, arc);
            const dist = THREE.Vector2.prototype.distanceTo.call(nearestPoint, intersectPoint); // only in x/y
    
            // Collect snap candidate
            const center = new THREE.Vector2(cx, cy);
            this.snapCandidates.push(new SnapCandidate(vpId, dist).makeEllipticalArc(center, major, minor, start, end));
    
            // Todo: Unlike for line-segments, arcs are currently collected by "last one wins" rule by the code for single-snapping. 
            //       We should consider the distance here as well.
            this.ellipticalArc = arc;
            this.ellipticalArcCenter = new THREE.Vector3(cx, cy, intersectPoint.z);
    
            this.vpIdElliptical = vpId;
          }
        }
      };
    
      /**
       * This method sets the matrix to identity if matrix is not supplied;
       *
       * @param {THREE.Matrix4} matrix - Matrix to set
       */
      GeometryCallback.prototype.setMatrix = function (matrix) {
        this.matrix = matrix || new THREE.Matrix4();
      };
    
      /**
       * Snap to a 2D model.
       * 
       * @param {object}      hitResult - a result of a ray intersection.
       * @param {object}      [options] - Options object.
       * @param {Function}    [options.enumSegments] - Enumerates all segments within a given bbox in model-space.
       *
       */
      this.snapping2D = function (hitResult) {let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    
        if (!hitResult) {
          return;
        }
    
        // hitResult is a result of a ray intersection. it may contain the following:
        let {
          dbId,
          fragId,
          intersectPoint,
          model = _viewer.model } =
        hitResult;
    
        if (model.is3d()) {
          return;
        }
        _snapResult.modelId = hitResult.model ? hitResult.model.id : null;
        _snapResult.hasTopology = false;
        _snapResult.intersectPoint = intersectPoint;
    
        let tr,scale = 1;
    
        // The model that we are trying to snap is 2D, but the viewer is 3D. It means that we are in hypermodeling scenario!
        // For that, we'll need to apply the inversed transform of the 2D model to the intersect point first, in order to get it in local model coords.
        if (!_viewer.impl.is2d) {
          tr = model.getModelToViewerTransform();
          // If there's a transform, move point to original location in sheet (will be restored at the end)
          if (tr) {
            scale = tr.getMaxScaleOnAxis();
            _snapResult.intersectPoint = intersectPoint.clone();
            _snapResult.intersectPoint.applyMatrix4(model.getInverseModelToViewerTransform());
          }
        }
    
        // Determine which one should be drawn: line, circular arc or elliptical arc
        // Use the un-transformed point, but scale down the radius because we are comparing with the unscaled geometry
        _snapResult.radius = this.setDetectRadius(intersectPoint) / scale;
    
        // Geometry snapping is only possible if a fragment list is available to obtain geometry per fragment.
        var supportsGeomSnapping = model.getFragmentList() != null;
        if (!supportsGeomSnapping) {
    
          // If no snapping is available, just accept the hitpoint as a vertex hit. This allows to measure
          // distances between arbitrary points in rasters.
          _isSnapped = true;
          _snapResult.geomType = SnapType.SNAP_VERTEX;
          _snapResult.geomVertex = intersectPoint; // Use the un-transformed point
          tr && _snapResult.intersectPoint.applyMatrix4(tr); // Restore to original location
          return;
        }
    
    
        var gc = new GeometryCallback(_viewer, this, _snapResult.radius);
    
        // Performs 2D snapping to segments based on an enumSegments() callback, which enumerates all segments
        // within in a given bbox in model-space.
        if (options.enumSegments) {
          // enum all segments within the snapRadius around intersectPoint
          const minx = _snapResult.intersectPoint.x - _snapResult.radius;
          const miny = _snapResult.intersectPoint.y - _snapResult.radius;
          const maxx = _snapResult.intersectPoint.x + _snapResult.radius;
          const maxy = _snapResult.intersectPoint.y + _snapResult.radius;
    
          options.enumSegments(minx, miny, maxx, maxy, gc);
        } else {
          // Regular snapping - snap to the 2D model's geometry.
          var fragIds = fragId;
    
          if (typeof fragIds === "undefined") {
            // LMV-6082 Do not return out if the snap to pixel flag (free measure) is enabled.
            if (!_snapToPixel) {
              return;
            }
            fragIds = [];
          } else if (!Array.isArray(fragIds)) {
            fragIds = [fragIds];
          }
    
          for (var fi = 0; fi < fragIds.length; ++fi) {
            var mesh = _viewer.impl.getRenderProxy(model, fragIds[fi]);
    
            if (mesh && mesh.geometry) {
              gc.setMatrix(mesh.matrix);
              var vbr = new VertexBufferReader(mesh.geometry);
              vbr.enumGeomsForObject(model.reverseMapDbIdFor2D(dbId), gc);
              // Set the matrix back to identity after processing a mesh
              gc.setMatrix();
            }
          }
        }
    
        // _snapResult.intersectPoint contains the possibly transformed point
        this.finishSnapping2D(gc, _snapResult.intersectPoint);
    
        // Snap the unsnapped point only if the snapping fails
        if (!_isSnapped && _snapToPixel) {
          _isSnapped = true;
          _snapResult.geomType = SnapType.RASTER_PIXEL;
          _snapResult.geomVertex = _snapResult.intersectPoint;
        }
    
        // Now apply the transform matrix on the results, so we'll get the results in their final transformed position.
        if (tr) {var _snapResult$geomEdge, _snapResult$geomEdge2;
          let start, end;
    
          start = (_snapResult$geomEdge = _snapResult.geomEdge) === null || _snapResult$geomEdge === void 0 ? void 0 : _snapResult$geomEdge.vertices[0];
          end = (_snapResult$geomEdge2 = _snapResult.geomEdge) === null || _snapResult$geomEdge2 === void 0 ? void 0 : _snapResult$geomEdge2.vertices[1];
    
    
    
    
    
    
          let results = [_snapResult.snapPoint, _snapResult.geomVertex, _snapResult.intersectPoint, _snapResult.circularArcCenter,
          start, end];
          // Remove undefined and possibly shared vectors
          results = [...new Set(results.filter((n) => n))];
          results.forEach((res) => res.applyMatrix4(tr));
          if (_snapResult.circularArcRadius) {
            _snapResult.circularArcRadius *= scale;
          }
          _snapResult.radius *= scale;
        }
      };
    
      // By default, snapper only considers model geometry that is written to ID buffer.
      // This function performs the 2D snapping on a set of given 2D meshes instead. It works similar to snapping2D() but 
      // enumerates the given meshes instead of getting them from the fragment list.
      //
      //  @param {THREE.Vector3}                 intersectPoint - click position in world-coords
      //  @param {function(dbId, layerId, vpId)} filter - Defines subset of primitives to be considered.
      //  @param {THREE.Mesh[]}                  meshes - The triangulated 2D shapes to be checked for snapping
      //  @param {number}                        [detectRadius] - Same coordinate system as the given geometry. Required if geometry is not in world-coords.
    
      this.snapping2DOverlay = function (intersectPoint, meshes, filter, detectRadius) {
        _snapResult.hasTopology = false;
        _snapResult.intersectPoint = intersectPoint;
        _snapResult.radius = detectRadius || this.setDetectRadius(intersectPoint);
    
        var gc = new GeometryCallback(_viewer, this, _snapResult.radius);
    
        for (var i = 0; i < meshes.length; i++) {
          var mesh = meshes[i];
          var vbr = new VertexBufferReader(mesh.geometry);
          vbr.enumGeoms(filter, gc);
        }
    
        this.finishSnapping2D(gc, intersectPoint);
      };
    
      // Finish 2D snapping operation - assuming that all candidate geometry for snapping has been processed by the geometryCallback gc already.
      this.finishSnapping2D = function (gc, intersectPoint) {
    
        // When restricting to a single viewport, exclude candidates of all other viewports
        if (_forcedVpId !== null) {
          const isSameViewport = (c) => c.viewportId === _forcedVpId;
          gc.snapCandidates = gc.snapCandidates.filter(isSameViewport);
        }
    
        // Check if we can snap to an intersection of two close segments
        const intersectSnap = findIntersectionSnap(gc.snapCandidates, intersectPoint, gc.detectRadius);
        if (intersectSnap) {
          _snapResult.viewportIndex2d = intersectSnap.viewportId;
          _snapResult.snapPoint = intersectSnap.snapPoint;
          _snapResult.geomType = SnapType.SNAP_INTERSECTION;
          _snapResult.geomVertex = intersectSnap.snapPoint;
          _isSnapped = true;
          return;
        }
    
        if (gc.circularArc) {
    
          _snapResult.viewportIndex2d = gc.vpIdCircular;
    
          _snapResult.snapPoint = gc.snapPoint;
    
          // Only snap the geometries which belong to the same viewport as the first selection
          if (_forcedVpId !== null && _forcedVpId !== _snapResult.viewportIndex2d)
          return;
    
          let start, end;
    
          start = gc.circularArc.vertices[0];
          end = gc.circularArc.vertices[gc.circularArc.vertices.length - 1];
    
    
    
    
    
    
    
          if (intersectPoint.distanceTo(start) < _snapResult.radius) {
    
            _snapResult.geomVertex = start;
            _snapResult.geomType = SnapType.SNAP_VERTEX;
          } else
          if (intersectPoint.distanceTo(end) < _snapResult.radius) {
    
            _snapResult.geomVertex = end;
            _snapResult.geomType = SnapType.SNAP_VERTEX;
          } else
          {
    
            this.lineStripToPieces(gc.circularArc);
            _snapResult.geomEdge = gc.circularArc;
            _snapResult.circularArcCenter = gc.circularArcCenter;
            _snapResult.circularArcRadius = gc.circularArcRadius;
            _snapResult.geomType = SnapType.SNAP_CIRCULARARC;
          }
    
          _isSnapped = true;
    
    
        } else
        if (gc.ellipticalArc) {
    
          _snapResult.viewportIndex2d = gc.vpIdElliptical;
    
          // Only snap the geometries which belong to the same viewport as the first selection
          if (_forcedVpId !== null && _forcedVpId !== _snapResult.viewportIndex2d)
          return;
    
          let start, end;
    
          start = gc.ellipticalArc.vertices[0];
          end = gc.ellipticalArc.vertices[gc.ellipticalArc.vertices.length - 1];
    
    
    
    
    
          if (intersectPoint.distanceTo(start) < _snapResult.radius) {
    
            _snapResult.geomVertex = start;
            _snapResult.geomType = SnapType.SNAP_VERTEX;
          } else
          if (intersectPoint.distanceTo(end) < _snapResult.radius) {
    
            _snapResult.geomVertex = end;
            _snapResult.geomType = SnapType.SNAP_VERTEX;
          } else
          {
    
            this.lineStripToPieces(gc.ellipticalArc);
            _snapResult.geomEdge = gc.ellipticalArc;
            // Before we have measure design for elliptical arc, measure the center for now
            _snapResult.circularArcCenter = gc.ellipticalArcCenter;
            _snapResult.circularArcRadius = null;
            _snapResult.geomType = SnapType.SNAP_CIRCULARARC;
          }
    
          _isSnapped = true;
    
        } else
        if (gc.lineGeom instanceof THREE.Geometry && gc.lineGeom.vertices.length ||
        gc.lineGeom.getAttribute && gc.lineGeom.getAttribute('position').count) {
    
          _snapResult.viewportIndex2d = gc.vpIdLine;
    
          // Only snap the geometries which belong to the same viewport as the first selection
          if (_forcedVpId !== null && _forcedVpId !== _snapResult.viewportIndex2d)
          return;
    
          // Always expose edge segment - no matter whether we snap to the edge or one of its vertices.
          // This allows us to combine it with other snap constraints later - as done by Edit2D.
          _snapResult.geomEdge = gc.lineGeom;
          let start, end;
    
          start = gc.lineGeom.vertices[0];
          end = gc.lineGeom.vertices[1];
    
    
    
    
    
    
          if (this.markupMode) {// Markup mode
            var mid = new THREE.Vector3();
            mid.addVectors(start, end);
            mid.divideScalar(2);
            var md = intersectPoint.distanceTo(mid);
            var sd = intersectPoint.distanceTo(start);
            var ed = intersectPoint.distanceTo(end);
    
            // Store it for snapping to parallel/perpendicular of underlying vectors
            _snapResult.geomEdge = gc.lineGeom;
    
            if (md < _snapResult.radius) {
              _snapResult.geomVertex = mid;
              _snapResult.geomType = SnapType.SNAP_VERTEX;
            } else
            if (sd < _snapResult.radius) {
              _snapResult.geomVertex = start;
              _snapResult.geomType = SnapType.SNAP_VERTEX;
            } else
            if (ed < _snapResult.radius) {
              _snapResult.geomVertex = end;
              _snapResult.geomType = SnapType.SNAP_VERTEX;
            } else
            {
              _snapResult.geomType = SnapType.SNAP_EDGE;
            }
    
            // Circle center
            if (start.distanceTo(end) < EPSILON) {
              _snapResult.geomType = SnapType.SNAP_CIRCLE_CENTER;
            }
          } else
          {// Measure mode
            if (intersectPoint.distanceTo(start) < _snapResult.radius) {
    
              if (start.distanceTo(end) < EPSILON) {
                _snapResult.geomType = SnapType.SNAP_CIRCLE_CENTER;
              } else {
                _snapResult.geomType = SnapType.SNAP_VERTEX;
              }
    
              _snapResult.geomVertex = start;
            } else
            if (_options.forceSnapVertices || intersectPoint.distanceTo(end) < _snapResult.radius) {
    
              _snapResult.geomVertex = end;
              _snapResult.geomType = SnapType.SNAP_VERTEX;
            } else
            {
              _snapResult.geomType = SnapType.SNAP_EDGE;
            }
          }
    
          _isSnapped = true;
        }
      };
    
      this.snappingRasterPixel = function (result) {
        if (!result) {
          return;
        }
    
        var intersectPoint = result.intersectPoint;
        _snapResult.intersectPoint = intersectPoint;
        _snapResult.hasTopology = false;
    
        // Determine which one should be drawn: line, circular arc or elliptical arc
        _snapResult.radius = this.setDetectRadius(intersectPoint);
        _snapResult.geomType = SnapType.RASTER_PIXEL;
        _snapResult.geomVertex = intersectPoint;
        _isSnapped = true;
      };
    
      this.snapMidpoint = function () {
        _snapResult.isMidpoint = false;
    
        // Snap midpoint for edge
        if (_isSnapped) {
          if (_snapResult.geomType === SnapType.SNAP_EDGE) {
            let p1, p2;
    
            const edge = _snapResult.geomEdge;
            p1 = edge.vertices[0];
            p2 = edge.vertices[1];
    
    
    
    
    
    
            var midpoint = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
    
            var cutPlanes = _viewer.impl.getAllCutPlanes();
            if (cutPlanes !== null && cutPlanes !== void 0 && cutPlanes.length) {
              for (let i = 0; i < cutPlanes.length; ++i) {
                const p = cutPlanes[i];
                const dot = midpoint.x * p.x + midpoint.y * p.y + midpoint.z * p.z + p.w;
                if (dot > 1e-5) {
                  // discard midpoint if clipped
                  return;
                }
              }
            }
    
            if (_snapResult.intersectPoint.distanceTo(midpoint) < 2 * _snapResult.radius) {
              _snapResult.geomVertex = midpoint;
              _snapResult.geomType = SnapType.SNAP_MIDPOINT;
            }
          }
        }
      };
    
      this.setPerpendicular = function (isPerpendicular) {
        _snapResult.isPerpendicular = isPerpendicular;
      };
    
      this.lineStripToPieces = function (geom) {
        let vertices;
    
        vertices = geom.vertices;
        for (var i = vertices.length - 2; i > 0; i--) {
          vertices.splice(i, 0, vertices[i]);
        }
    
    
    
    
    
    
    
    
    
    
      };
    
      this.setDetectRadius = function (point) {
    
        var navapi = _viewer.navigation;
        var camera = navapi.getCamera();
        var position = navapi.getPosition();
    
        var p = point.clone();
    
        var distance = camera.isPerspective ? p.sub(position).length() :
        navapi.getEyeVector().length();
    
        var fov = navapi.getVerticalFov();
        var worldHeight = 2.0 * distance * Math.tan(THREE.Math.degToRad(fov * 0.5));
    
        var viewport = navapi.getScreenViewport();
        var _window = this.getWindow();
        var devicePixelRatio = _window.devicePixelRatio || 1;
        var radius = this.detectRadiusInPixels * worldHeight / (viewport.height * devicePixelRatio);
    
        return radius;
      };
    
      this.handleButtonDown = function () {
        _isDragging = true;
        return false;
      };
    
      this.handleButtonUp = function () {
        _isDragging = false;
        return false;
      };
    
      this.handleMouseMove = function (event) {
    
        if (_isDragging)
        return false;
    
        this.onMouseMove({
          x: event.canvasX,
          y: event.canvasY });
    
    
        return false;
      };
    
      this.handleSingleTap = function (event) {
    
        return this.handleMouseMove(event);
      };
    
      this.handlePressHold = function (event) {
    
        if (av.isMobileDevice()) {
          switch (event.type) {
    
            case "press":
              _isPressing = true;
              this.onMouseMove({ x: event.canvasX, y: event.canvasY });
              break;
    
            case "pressup":
              this.onMouseMove({ x: event.canvasX, y: event.canvasY });
              _isPressing = false;
              break;}
    
        }
        return false;
    
      };
    
      this.handleGesture = function (event)
      {
        if (av.isMobileDevice()) {
          if (_isPressing) {
            switch (event.type) {
    
              case "dragstart":
              case "dragmove":
                this.onMouseMove({ x: event.canvasX, y: event.canvasY });
                break;
    
              case "dragend":
                this.onMouseMove({ x: event.canvasX, y: event.canvasY });
                _isPressing = false;
                break;
    
              case "pinchstart":
              case "pinchmove":
              case "pinchend":
                break;}
    
          }
        }
    
        return false;
      };
    
      /**
       * Handler to mouse move events, used to snap in markup edit mode.
       *
       * @param mousePosition
       * @private
       */
      this.onMouseDown = function (mousePosition) {
        return this.onMouseMove(mousePosition);
      };
    
      /**
       * Handler to mouse move events, used to snap in markup edit mode.
       *
       * @param mousePosition
       * @private
       */
      this.onMouseMove = function (mousePosition) {var _result$model, _viewer$model;
    
        this.clearSnapped();
    
        var result = _viewer.impl.snappingHitTest(mousePosition.x, mousePosition.y, false);
    
        if (!result && _snapToPixel) {
          var vpVec = _viewer.impl.clientToViewport(mousePosition.x, mousePosition.y);
          let point = _viewer.impl.intersectGroundViewport(vpVec);
          result = { intersectPoint: point };
        }
    
        if (!result || !result.intersectPoint)
        return false;
    
        const isLeaflet = ((_result$model = result.model) === null || _result$model === void 0 ? void 0 : _result$model.isLeaflet()) || _viewer.impl.is2d && ((_viewer$model = _viewer.model) === null || _viewer$model === void 0 ? void 0 : _viewer$model.isLeaflet());
        // 3D Snapping
        if (result.face) {
          this.snapping3D(result);
        }
        // 2D Snapping
        else if ((result.dbId || result.dbId === 0) && !isLeaflet) {
          this.snapping2D(result);
        }
        // Pixel Snapping
        else {
          const isPixelSnap = _snapToPixel || isLeaflet;
          if (isPixelSnap) {
            this.snappingRasterPixel(result);
          }
        }
    
        this.snapMidpoint();
    
        if (_snapFilter && !_snapFilter(_snapResult)) {
          this.clearSnapped();
          return false;
        }
    
        return true;
      };
    }
    
    av.GlobalManagerMixin.call(Snapper.prototype);
    
    /***/ }),
    
    /***/ "./extensions/Snapping/SnapperIndicator.js":
    /*!*************************************************!*\
      !*** ./extensions/Snapping/SnapperIndicator.js ***!
      \*************************************************/
    /***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
    
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony export */ __webpack_require__.d(__webpack_exports__, {
    /* harmony export */   "NullSnapperIndicator": () => (/* binding */ NullSnapperIndicator),
    /* harmony export */   "SnapperIndicator": () => (/* binding */ SnapperIndicator),
    /* harmony export */   "getXYZFromPos": () => (/* binding */ getXYZFromPos)
    /* harmony export */ });
    const MeasureCommon = Autodesk.Viewing.MeasureCommon;
    const isEqualVectors = MeasureCommon.isEqualVectors;
    const EPSILON = MeasureCommon.EPSILON;
    const SnapType = MeasureCommon.SnapType;
    
    const NO_OVERLAY = 0;
    const FACE_OVERLAY = 1;
    const EDGE_OVERLAY = 2;
    const POINT_OVERLAY = 3;
    
    const GEOMETRIES_OVERLAY = 'MeasureTool-snapper-geometries';
    const INDICATOR_OVERLAY = 'MeasureTool-snapper-indicator';
    
    const _geometryLineWidth = 0.3;
    const _indicatorLineWidth = 0.2;
    const _indicatorSize = 1.2;
    const _indicatorColor = 0xff7700;
    const _geometryColor = 0x00CC00;
    
    let _point = null;
    
    const tmpVec3 = new THREE.Vector3();
    /**
     * 
     * @param {BufferAttribute} positionAttribute 
     * @param {number} idx 
     * @returns {THREE.Vector3} Vector3 corresponding to the indicated index. The returned value will be overriden by
     * subsequent calls
     */
    function getXYZFromPos(positionAttribute, idx) {
      tmpVec3.x = positionAttribute.getX(idx);
      tmpVec3.y = positionAttribute.getY(idx);
      tmpVec3.z = positionAttribute.getZ(idx);
      return tmpVec3;
    }
    
    class NullSnapperIndicator {
      isNull() {
        return true;
      }
    
      render() {}
      removeOverlay(overlayName) {}
      clearOverlay(overlayName) {}
      clearOverlays() {}
      addOverlay(overlayName, mesh) {}
      drawFace(geom, material, overlayName) {}
      cylinderMesh(pointX, pointY, material, width) {
        return new THREE.Mesh();
      }
      renderGeometry(snapResult) {}
      renderVertexIndicator(snapResult) {}
      renderMidpointIndicator(snapResult) {}
      renderEdgeIndicator(snapResult) {}
      renderCircleIndicator(snapResult) {}
      renderPerpendicular(snapResult) {}
      renderPixelIndicator(snapResult) {}
      renderIndicator(snapResult) {}
      drawLine(geom, material, width, overlayName) {}
      drawPoint(point, material, overlayName) {}
      drawCircle(point, material, overlayName) {}
      setScale(point) {
        return 1;
      }
      setPointScale(pointMesh) {}
      setCircleScale(torusMesh) {}
      setEdgeScale(cylinderMesh) {}
      updatePointScale(overlayName) {}
      updateEdgeScale(overlayName) {}
      onCameraChange() {}
      destroy() {}}
    
    
    class SnapperIndicator extends NullSnapperIndicator {
      constructor(viewer, snapper) {
        super();
    
        this.viewer = viewer;
        this.snapper = snapper;
        this.overlayType = NO_OVERLAY;
        this.previewsIntersectPoint = null;
    
        this.viewer.impl.createOverlayScene(GEOMETRIES_OVERLAY);
        this.viewer.impl.createOverlayScene(INDICATOR_OVERLAY);
    
        this.geometryMaterial = new THREE.MeshPhongMaterial({
          color: _geometryColor,
          opacity: 0.5,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide });
    
    
        this.indicatorMaterial = new THREE.MeshBasicMaterial({
          color: _indicatorColor,
          opacity: 1,
          transparent: false,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide });
    
      }
    
      isNull() {
        return false;
      }
    
      render() {
    
        const snapResult = this.snapper.getSnapResult();
    
        if (!isEqualVectors(this.previewsIntersectPoint, snapResult.intersectPoint, EPSILON)) {
          this.clearOverlay(GEOMETRIES_OVERLAY);
        }
    
        this.clearOverlay(INDICATOR_OVERLAY);
    
        if (snapResult.isEmpty())
        return;
    
        if (this.snapper.renderSnappedGeometry ||
        snapResult.hasTopology && this.snapper.renderSnappedTopology) {
          this.renderGeometry(snapResult);
        }
        this.renderIndicator(snapResult);
    
        this.previewsIntersectPoint = snapResult.intersectPoint.clone();
      }
    
      removeOverlay(overlayName) {
    
        this.viewer.impl.clearOverlay(overlayName);
        this.viewer.impl.removeOverlayScene(overlayName);
    
      }
    
      clearOverlay(overlayName) {
    
        this.removeOverlay(overlayName);
        this.viewer.impl.createOverlayScene(overlayName);
    
      }
    
      clearOverlays() {
    
        this.removeOverlay(GEOMETRIES_OVERLAY);
        this.viewer.impl.createOverlayScene(GEOMETRIES_OVERLAY);
    
        this.removeOverlay(INDICATOR_OVERLAY);
        this.viewer.impl.createOverlayScene(INDICATOR_OVERLAY);
    
        this.previewsIntersectPoint = null;
    
      }
    
      addOverlay(overlayName, mesh) {
    
        this.viewer.impl.addOverlay(overlayName, mesh);
    
      }
    
      /**
       * Draw the planar face
       * @param geom - Geometry which needs to be draw.
       * @param material - Material for the geometry.
       * @param overlayName - Name of the overlay.
       */
      drawFace(geom, material, overlayName) {
    
        const snapperPlane = new THREE.Mesh(geom, material, true);
    
        if (overlayName === GEOMETRIES_OVERLAY) {
          this.overlayType = FACE_OVERLAY;
        }
    
        this.addOverlay(overlayName, snapperPlane);
    
      }
    
      cylinderMesh(pointX, pointY, material, width) {
    
        const direction = new THREE.Vector3().subVectors(pointY, pointX);
        const orientation = new THREE.Matrix4();
        orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
        orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
        0, 0, 1, 0,
        0, -direction.length(), 0, 0,
        0, 0, 0, 1));
    
        width = width || 0.5;
        let cylinder = new THREE.CylinderGeometry(width, width, 1.0, 8, 1, true);
        const edge = new THREE.Mesh(cylinder, material);
        cylinder = null;
    
        edge.applyMatrix4(orientation);
        edge.position.x = (pointY.x + pointX.x) / 2;
        edge.position.y = (pointY.y + pointX.y) / 2;
        edge.position.z = (pointY.z + pointX.z) / 2;
        return edge;
      }
    
      renderGeometry(snapResult) {
    
        if (isEqualVectors(this.previewsIntersectPoint, snapResult.intersectPoint, EPSILON)) {
          return;
        }
    
        switch (snapResult.geomType) {
          case SnapType.SNAP_VERTEX:
            SnapType.RASTER_PIXEL;
            this.drawPoint(snapResult.geomVertex, this.geometryMaterial, GEOMETRIES_OVERLAY);
            break;
    
          case SnapType.SNAP_EDGE:
          case SnapType.SNAP_CURVEDEDGE:
          case SnapType.SNAP_CIRCULARARC:
          case SnapType.SNAP_MIDPOINT:
            this.drawLine(snapResult.geomEdge, this.geometryMaterial, _geometryLineWidth, GEOMETRIES_OVERLAY);
            break;
    
          case SnapType.SNAP_FACE:
          case SnapType.SNAP_CURVEDFACE:
            this.drawFace(snapResult.geomFace, this.geometryMaterial, GEOMETRIES_OVERLAY);
            break;}
    
      }
    
      /**
       * Renders a square around the given snap result.
       * Is used when youâ€™re snapping on a vertex, intersection, circular
       * arc on a F2D sheet, and the curved face.
       * @param {Autodesk.Viewing.MeasureCommon.SnapResult} snapResult
       */
      renderVertexIndicator(snapResult) {
    
        const pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        const scale = this.setScale(pos);
        const length = _indicatorSize * scale;
    
        const rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        const upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);
    
        const geom = new THREE.BufferGeometry();
    
        const vertices = [];
        const p = new THREE.Vector3();
    
        // Upper line
        p.addVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[1] = p.clone();
    
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Right line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.addVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
      }
    
      /**
       * Renders a triangle around the given snap result
       * on a midpoint
       * @param {Autodesk.Viewing.MeasureCommon.SnapResult} snapResult
       */
      renderMidpointIndicator(snapResult) {
    
        const pos = snapResult.geomVertex;
        const scale = this.setScale(pos);
        const length = _indicatorSize * scale;
    
        const rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        const upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);
    
        const geom = new THREE.BufferGeometry();
        const vertices = [];
        const p = new THREE.Vector3();
    
        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.addVectors(pos, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Right line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.addVectors(pos, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
      }
    
      /**
       * Renders an upside-down Y around the given snap result
       * on an edge or a curved edge..
       * @param {Autodesk.Viewing.MeasureCommon.SnapResult} snapResult
       */
      renderEdgeIndicator(snapResult) {
    
        const pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        const scale = this.setScale(pos);
        const length = _indicatorSize * scale;
    
        const rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        const upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);
    
        const geom = new THREE.BufferGeometry();
        const vertices = [];
        const p = new THREE.Vector3();
    
        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Right line
        p.addVectors(pos, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
      }
    
      /**
       * Renders an circle on a center of a circle
       * and circular arc for other than F2D sheets.
       * @param {Autodesk.Viewing.MeasureCommon.SnapResult} snapResult
       */
      renderCircleIndicator(snapResult) {
    
        const pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        this.drawCircle(pos, this.indicatorMaterial, INDICATOR_OVERLAY);
    
      }
    
      /**
       * Renders an right-angle ( |_ ) indicator around the given snap result
       * when the result is perpendicular.
       * @param {Autodesk.Viewing.MeasureCommon.SnapResult} snapResult
       */
      renderPerpendicular(snapResult) {
    
        const pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        const scale = this.setScale(pos);
        const length = _indicatorSize * scale;
    
        const rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        const upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);
    
        const geom = new THREE.BufferGeometry();
        const vertices = [];
        const p = new THREE.Vector3();
    
        // Upper line
        vertices[0] = pos.clone();
        p.subVectors(pos, rightVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Right line
        vertices[0] = pos.clone();
        p.subVectors(pos, upVec);
        vertices[1] = p.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
      }
    
      /**
       * Renders an X around the given snap result.
       * Usually shown when using "Free Measure" mode is enabled.
       * @param {Autodesk.Viewing.MeasureCommon.SnapResult} snapResult
       */
      renderPixelIndicator(snapResult) {
    
        const pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        const scale = this.setScale(pos);
        const length = _indicatorSize * scale;
    
        const rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        const upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);
    
        const geom = new THREE.BufferGeometry();
        const vertices = [];
        const p = new THREE.Vector3();
    
        // Top-left line
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Top-right line
        p.addVectors(pos, rightVec);
        p.addVectors(p, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Bottom-right line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
        // Bottom-left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        vertices[0] = p.clone();
        vertices[1] = pos.clone();
        geom.setFromPoints(vertices);
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
    
      }
    
      renderIndicator(snapResult) {
    
        if (snapResult.isPerpendicular) {
          this.renderPerpendicular(snapResult);
          return;
        }
    
        if (snapResult.snapToArc) {
          if (snapResult.isArc && snapResult.geomType === SnapType.SNAP_CIRCULARARC && this.viewer.model.is2d() && !this.viewer.model.isPdf()) {
            this.renderVertexIndicator(snapResult);
          }
          return;
        }
    
    
        switch (snapResult.geomType) {
          case SnapType.SNAP_VERTEX:
          case SnapType.SNAP_INTERSECTION:
            this.renderVertexIndicator(snapResult);
            break;
    
          case SnapType.SNAP_MIDPOINT:
            this.renderMidpointIndicator(snapResult);
            break;
    
          case SnapType.SNAP_CIRCLE_CENTER:
            this.renderCircleIndicator(snapResult);
            break;
    
          case SnapType.SNAP_EDGE:
          case SnapType.SNAP_CURVEDEDGE:
            this.renderEdgeIndicator(snapResult);
            break;
    
          case SnapType.SNAP_CIRCULARARC:
            if (this.viewer.model.is2d()) {
              this.renderVertexIndicator(snapResult);
            } else {
              this.renderCircleIndicator(snapResult);
            }
            break;
    
          case SnapType.SNAP_FACE:
          case SnapType.SNAP_CURVEDFACE:
            this.renderVertexIndicator(snapResult);
            break;
    
          case SnapType.RASTER_PIXEL:
            this.renderPixelIndicator(snapResult);
            break;}
    
      }
    
      /**
       * Draws a line in an overlyay
       * @param {THREE.Geometry|THREE.BufferGeometry} geom 
       * @param {THREE.Material} material 
       * @param {number} width 
       * @param {string} overlayName 
       */
      drawLine(geom, material, width, overlayName) {
    
        // Line Pieces
        if (overlayName === GEOMETRIES_OVERLAY) {
          this.overlayType = EDGE_OVERLAY;
        }
    
        let verticesLength, geomPos;
        if (geom instanceof THREE.Geometry) {
          console.warn('SnapperIndicator.drawLine(geom, material, width, overlayName): THREE.Geometry has been depecrated and the geom argument should use a THREE.BufferGeometry instead');
          verticesLength = geom.vertices.length;
        } else {
          geomPos = geom.getAttribute('position');
          verticesLength = geomPos.count;
        }
        for (let i = 0; i < verticesLength; i += 2) {
          let cylinder;
          if (geom instanceof THREE.Geometry) {
            cylinder = this.cylinderMesh(geom.vertices[i], geom.vertices[i + 1], material, width);
          } else {
            cylinder = this.cylinderMesh(getXYZFromPos(geomPos, i).clone(), getXYZFromPos(geomPos, i + 1).clone(), material, width);
          }
          this.setEdgeScale(cylinder);
          this.addOverlay(overlayName, cylinder);
        }
      }
    
      drawPoint(point, material, overlayName) {
    
        // Because every point is snappable in PDFs, don't display the green dot for PDFs.
        if (this.viewer.model.isLeaflet()) {
          return;
        }
    
        if (!_point)
        _point = new THREE.SphereGeometry(1.0);
    
        const pointMesh = new THREE.Mesh(_point, material);
        pointMesh.position.set(point.x, point.y, point.z);
    
        this.setPointScale(pointMesh);
    
        if (overlayName === GEOMETRIES_OVERLAY) {
          this.overlayType = POINT_OVERLAY;
        }
    
        this.addOverlay(overlayName, pointMesh);
    
      }
    
      drawCircle(point, material, overlayName) {
    
        let torus = new THREE.TorusGeometry(_indicatorSize, _indicatorLineWidth, 2, 20);
        const torusMesh = new THREE.Mesh(torus, material);
        torusMesh.lookAt(this.viewer.navigation.getEyeVector().normalize());
        torus = null;
    
        torusMesh.position.set(point.x, point.y, point.z);
    
        this.setCircleScale(torusMesh);
    
        this.addOverlay(overlayName, torusMesh);
    
      }
    
      setScale(point) {
    
        const pixelSize = 5;
    
        const navapi = this.viewer.navigation;
        const camera = navapi.getCamera();
        const position = navapi.getPosition();
    
        const p = point.clone();
    
        const distance = camera.isPerspective ? p.sub(position).length() :
        navapi.getEyeVector().length();
    
        const fov = navapi.getVerticalFov();
        const worldHeight = 2.0 * distance * Math.tan(THREE.Math.degToRad(fov * 0.5));
    
        const viewport = navapi.getScreenViewport();
        const scale = pixelSize * worldHeight / viewport.height;
    
        return scale;
      }
    
      setPointScale(pointMesh) {
    
        const scale = this.setScale(pointMesh.position);
        pointMesh.scale.x = scale;
        pointMesh.scale.y = scale;
        pointMesh.scale.z = scale;
    
      }
    
      setCircleScale(torusMesh) {
    
        const scale = this.setScale(torusMesh.position);
        torusMesh.scale.x = scale;
        torusMesh.scale.y = scale;
      }
    
      setEdgeScale(cylinderMesh) {
    
        const scale = this.setScale(cylinderMesh.position);
        cylinderMesh.scale.x = scale;
        cylinderMesh.scale.z = scale;
      }
    
      updatePointScale(overlayName) {
    
        if (this.overlayType !== POINT_OVERLAY)
        return;
    
        const overlay = this.viewer.impl.overlayScenes[overlayName];
        if (overlay) {
          const scene = overlay.scene;
    
          for (let i = 0; i < scene.children.length; i++) {
            const pointMesh = scene.children[i];
            if (pointMesh) {
    
              this.setPointScale(pointMesh);
            }
          }
        }
      }
    
      updateEdgeScale(overlayName) {
    
        if (this.overlayType !== EDGE_OVERLAY)
        return;
    
        const overlay = this.viewer.impl.overlayScenes[overlayName];
        if (overlay) {
          const scene = overlay.scene;
    
          for (let i = 0; i < scene.children.length; i++) {
            const cylinderMesh = scene.children[i];
            if (cylinderMesh) {
    
              this.setEdgeScale(cylinderMesh);
            }
          }
        }
      }
    
      onCameraChange() {
    
        this.updatePointScale(GEOMETRIES_OVERLAY);
        this.updateEdgeScale(GEOMETRIES_OVERLAY);
    
        // if (!this.snapper.markupMode) {
        this.render();
        // }
      }
    
      destroy() {
    
        this.removeOverlay(GEOMETRIES_OVERLAY);
        this.removeOverlay(INDICATOR_OVERLAY);
    
        if (_point) {
          _point.dispose();
          _point = null;
        }
      }}
    
    /***/ }),
    
    /***/ "./extensions/Snapping/index.js":
    /*!**************************************!*\
      !*** ./extensions/Snapping/index.js ***!
      \**************************************/
    /***/ ((module, __unused_webpack_exports, __webpack_require__) => {
    
    
    var av = Autodesk.Viewing;
    
    /**
     * @namespace Autodesk.Viewing.Extensions.Snapping
     */
    var namespace = AutodeskNamespace('Autodesk.Viewing.Extensions.Snapping');
    
    /**
     * @param m
     * @param ns
     * @private
     */
    function _export(m, ns) {
      for (var prop in m) {
        if (Object.prototype.hasOwnProperty.call(m, prop)) {
          //Export directly into the module (e.g. for node.js use, where LMV is used via require instead from global namespace)
          module.exports[prop] = m[prop];
    
          //Export into the desired viewer namespace
          ns[prop] = m[prop];
        }
      }
    }
    
    _export(__webpack_require__(/*! ./SnapMath.js */ "./extensions/Snapping/SnapMath.js"), namespace);
    _export(__webpack_require__(/*! ./Snapper.js */ "./extensions/Snapping/Snapper.js"), namespace);
    _export(__webpack_require__(/*! ./SnapperIndicator.js */ "./extensions/Snapping/SnapperIndicator.js"), namespace);
    
    
    /**
     * Utility extension that provides access to the {@link Autodesk.Viewing.Extensions.Snapping.Snapper} tool.
     * 
     * The extension id is: `Autodesk.Snapping`
     * 
     * @example
     *   viewer.loadExtension('Autodesk.Snapping')
     *  
     * @memberof Autodesk.Viewing.Extensions
     * @alias Autodesk.Viewing.Extensions.SnappingExtension
     * @see {@link Autodesk.Viewing.Extension} for common inherited methods.
     * @class
     */
    class SnappingExtension extends av.Extension {
    
      /**
       * @param {Viewer3D} viewer - Viewer instance
       * @param {object} options - Configurations for the extension
       * @alias Autodesk.Viewing.Extensions.SnappingExtension
       * @class
       */
      constructor(viewer, options) {
        super(viewer, options);
      }
    
      /**
       * Load the extension.
       *
       * @returns {Promise} that resolves when dependent extension finishes loading.
       * 
       * @alias Autodesk.Viewing.Extensions.SnappingExtension#load
       */
      load() {
        // Load the required dependency (and return the pending load as the load completion Promise)
        return this.viewer.loadExtension('Autodesk.CompGeom');
      }
    
      /**
       * Unloads the extension.
       * It does not unload dependent extensions.
       *
       * @returns {boolean} Always returns true
       * 
       * @alias Autodesk.Viewing.Extensions.SnappingExtension#unload
       */
      unload() {return true;}
    
    
      /**
       * Unused method.
       *
       * @returns {boolean} Always returns true
       * 
       * @alias Autodesk.Viewing.Extensions.SnappingExtension#activate
       */
      activate() {return true;}
    
      /**
       * Unused method.
       *
       * @returns {boolean} Always returns false
       * 
       * @alias Autodesk.Viewing.Extensions.SnappingExtension#deactivate
       */
      deactivate() {return false;}}
    
    
    // The ExtensionManager requires an extension to be registered.
    av.theExtensionManager.registerExtension('Autodesk.Snapping', SnappingExtension);
    
    /***/ })
    
    /******/ 	});
    /************************************************************************/
    /******/ 	// The module cache
    /******/ 	var __webpack_module_cache__ = {};
    /******/ 	
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/ 		// Check if module is in cache
    /******/ 		var cachedModule = __webpack_module_cache__[moduleId];
    /******/ 		if (cachedModule !== undefined) {
    /******/ 			return cachedModule.exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = __webpack_module_cache__[moduleId] = {
    /******/ 			// no module.id needed
    /******/ 			// no module.loaded needed
    /******/ 			exports: {}
    /******/ 		};
    /******/ 	
    /******/ 		// Execute the module function
    /******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    /******/ 	
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/ 	
    /************************************************************************/
    /******/ 	/* webpack/runtime/define property getters */
    /******/ 	(() => {
    /******/ 		// define getter functions for harmony exports
    /******/ 		__webpack_require__.d = (exports, definition) => {
    /******/ 			for(var key in definition) {
    /******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
    /******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    /******/ 				}
    /******/ 			}
    /******/ 		};
    /******/ 	})();
    /******/ 	
    /******/ 	/* webpack/runtime/hasOwnProperty shorthand */
    /******/ 	(() => {
    /******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
    /******/ 	})();
    /******/ 	
    /******/ 	/* webpack/runtime/make namespace object */
    /******/ 	(() => {
    /******/ 		// define __esModule on exports
    /******/ 		__webpack_require__.r = (exports) => {
    /******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 			}
    /******/ 			Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 		};
    /******/ 	})();
    /******/ 	
    /************************************************************************/
    /******/ 	
    /******/ 	// startup
    /******/ 	// Load entry module and return exports
    /******/ 	// This entry module is referenced by other modules so it can't be inlined
    /******/ 	var __webpack_exports__ = __webpack_require__("./extensions/Snapping/index.js");
    /******/ 	Autodesk.Extensions.Snapping = __webpack_exports__;
    /******/ 	
    /******/ })()
    ;
    //# sourceMappingURL=Snapping.js.map
    1