function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
import AngleSnapper from './AngleSnapper.js';
import SegmentTree from './SegmentTree.js';

var SnapType = Autodesk.Viewing.MeasureCommon.SnapType;

// Edit2DSnapper combines 3 different types of snapping:
//  1. Snapping to sheet geometry
//  2. Snapping to other geometry in the same layer
//  3. Snapping to angles and alignments

var av = Autodesk.Viewing;var

Edit2DSnapper = /*#__PURE__*/function () {

  // @param {Viewer3D} viewer
  // @param {Layer} layer
  // @param {EditLayer} gizmoLayer - used to add temporary snapping indicators (e.g., dashed lines for angle snapping)
  function Edit2DSnapper(viewer, layer, gizmoLayer) {_classCallCheck(this, Edit2DSnapper);

    this.viewer = viewer;
    this.setGlobalManager(viewer.globalManager);
    this.layer = layer;
    this.gizmoLayer = gizmoLayer;

    // Snapper for sheet geometry and layer geometry.
    // Note: SnapResults are always stored in LMV world-coords (!=layer coords). Otherwise, SnapperIndicator would not display correctly.
    this.sheetSnapper = new Autodesk.Viewing.Extensions.Snapping.Snapper(viewer);
    this.layerSnapper = new Autodesk.Viewing.Extensions.Snapping.Snapper(viewer);

    // Used for snapping to angles and alignments
    this.angleSnapper = new AngleSnapper(gizmoLayer);

    // tmp box reused for snapping
    this.snapBox = new THREE.Box2();

    // make sure SnapperIndicator exists. Note that angleSnapper does not need this - only the standard LMV snapper.
    this.sheetSnapper.activate();
    this.layerSnapper.activate();

    // update Snapper indicator on camera changes (otherwise, it grows/shrinks on camera zoom)
    this.onCameraChangeCb = this.onCameraChange.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChangeCb);

    // If there is a model already, compute SegmentTree right now
    this.initSegmentTrees();

    // Reused tmp vector
    this.tmpVec = new THREE.Vector3();

    // If we snapped to a line segment, this member contains
    // this line segment in layer coords. See _getGeomSnapLine().
    this.geomSnapLine = {
      a: new THREE.Vector3(),
      b: new THREE.Vector3() };

  }_createClass(Edit2DSnapper, [{ key: "dtor", value: function dtor()

    {
      this.sheetSnapper.deactivate();
      this.layerSnapper.deactivate();
      this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChangeCb);
    } }, { key: "onCameraChange", value: function onCameraChange()

    {
      this.updateSnapperIndicators();
    }

    // Make sure that all visible models have a SegmentTree
  }, { key: "initSegmentTrees", value: function initSegmentTrees() {
      var models = this.viewer.getVisibleModels();
      models.forEach(function (model) {
        // Note: We have to wait until the model finished loading. Otherwise, we may end up with a segmentTree that only
        //       contains a subset of the segments.
        //       In addition, make sure to skip the segment building in case it's a leaflet (e.g. a raster PDF).
        var isLeaflet = !!(model.myData && model.myData.isLeaflet);
        if (model.is2d() && !isLeaflet && !model.segmentTree && model.isLoadDone()) {
          model.segmentTree = new SegmentTree();
          model.segmentTree.buildFromModel(model);
        }
      });
    } }, { key: "updateSnapperIndicators", value: function updateSnapperIndicators()

    {
      // Note: All LMV snappers use (and clear) the same overlay scene. Therefore, we can call render() only on one of the Snapper
      // indicators. Otherwise, when snapping to sheet geometry, calling layerSnapper.indicator.render() afterwards would clear 
      // the sheet-snapping indicator again.
      if (this.sheetSnapper.isSnapped()) {
        this.sheetSnapper.indicator.render();
      } else {
        // If none is snapped, it doesn't matter which indicator we call: Both will just clear the overlay.
        this.layerSnapper.indicator.render();
      }
    }

    // Returns snapPosition as Vector2 in layer-coords. If no snapping happens, it just maps the position directly.
    //  @param {function(shape)} [snappingFilter] - Option filter to restrict EditLayer snapping to certain EditLayer shapes.
  }, { key: "getSnapPosition", value: function getSnapPosition(canvasX, canvasY, snappingFilter) {

      var p = this._getSnapPosition(canvasX, canvasY, snappingFilter);

      // keep snapping gizmos up to date
      this.angleSnapper.updateSnapLineGizmos(p);

      this.updateSnapperIndicators();

      return p;
    } }, { key: "clearSnappingGizmos", value: function clearSnappingGizmos()

    {
      this.angleSnapper.clearSnappingGizmos();
      this.sheetSnapper.clearSnapped();
      this.sheetSnapper.indicator && this.sheetSnapper.indicator.clearOverlays();
      this.layerSnapper.clearSnapped();
      this.layerSnapper.indicator && this.layerSnapper.indicator.clearOverlays();
    }

    // Angle and Alignment snapping can only be used when explicitly activated for a given polygon.
    // Otherwise, it has no effect.
  }, { key: "startAngleSnapping", value: function startAngleSnapping(poly, draggedVertex) {
      this.angleSnapper.startSnapping(poly, draggedVertex);
    }

    // Stop snapping to angles. (No effect if angleSnapping is already off).
  }, { key: "stopAngleSnapping", value: function stopAngleSnapping() {
      this.angleSnapper.stopSnapping();
    }

    // Like getSnapPosition, but excluding Snapping gizmo updates.
  }, { key: "_getSnapPosition", value: function _getSnapPosition(canvasX, canvasY, snappingFilter) {

      // Discard any outdated snapping results
      this.angleSnapper.clearSnappingResult();
      this.sheetSnapper.clearSnapped();
      this.layerSnapper.clearSnapped();

      var p = this.layer.canvasToLayer(canvasX, canvasY);

      // Check if geom-snapping is possible (pGeom is in layer-coords)
      var pGeom = this._getGeomSnapPosition(canvasX, canvasY, snappingFilter);

      // Check if we snapped to line geometry. If so, we can still allow angle-snapping - as long as we constrain it to the geometry snapLine.
      var geomSnapLine = this._getGeomSnapLine();

      if (pGeom && !geomSnapLine) {
        // We snapped to geometry and the snapType does not allow us to combine it with angle snapping
        // => Just return result of geometry snapping
        return pGeom;
      }

      // Apply angle-snapping. If we snapped to line geometry already, constrain angleSnapping to this line.
      this.angleSnapper.snapToAngle(p, geomSnapLine);

      // If there is no angle-snap, just apply the geometry snap
      if (geomSnapLine && !this.angleSnapper.isSnapped()) {
        return pGeom;
      }

      // By default, SnapperIndicator only considers the geometry snapping result. If we corrected the snap point and used the intersection with an
      // angle snapLine, we have to update the SnapResult so that the snapPoint is correctly reflected by the SnapperIndicator.
      if (geomSnapLine && this.angleSnapper.isSnapped()) {
        var result = this._getGeomSnapResult();

        // p is in 2D layer coords, but LMV Snapper snapResults are always stored in LMV world coords
        var pWorld = new THREE.Vector3(p.x, p.y, 0.0).applyMatrix4(this.layer.layerToWorld);

        result.geomType = SnapType.SNAP_INTERSECTION;
        result.snapPoint = pWorld;
        result.geomVertex = result.snapPoint; // Otherwise, snapResult.isEmpty() returns true
      }

      return p;
    }

    // Gets snap position from mouse event. 
    //  @returns {Vector2|null} Snapped position or null if not snapped.
  }, { key: "_getGeomSnapPosition", value: function _getGeomSnapPosition(canvasX, canvasY, snappingFilter) {

      var p = this.layer.canvasToLayer(canvasX, canvasY);

      // Compute snap position for model geom and edit layer. 
      // Both may be undefined if there was nothing to snap to.
      var pSheet = this._getSheetSnapPosition(canvasX, canvasY);
      var pLayer = this._getEditLayerSnapPosition(canvasX, canvasY, snappingFilter);

      // If nothing is snapped, don't snap
      if (!pSheet && !pLayer) {
        return null;
      }

      // If only one snap point was found, use it
      if (!pLayer) {
        return pSheet;
      } else if (!pSheet) {
        return pLayer;
      }

      // Get distances of snapPoints to accurate position
      var distSheet = THREE.Vector2.prototype.distanceToSquared.call(pSheet, p);
      var distLayer = THREE.Vector2.prototype.distanceToSquared.call(pLayer, p);

      // Choose the closer snap. If equal, prefer edit layer snap.
      // We discard unused snap results here, so that snapper indicator keeps correct
      if (distSheet < distLayer) {
        // Use sheet snap and discard the other snap result
        this.layerSnapper.clearSnapped();
        return pSheet;
      } else {
        // Use layer snap and discard the other snap result
        this.sheetSnapper.clearSnapped();
        return pLayer;
      }
    }

    // Returns the SnapResult of sheetSnapper or layerSnapper if any of them is currently snapped. Returns null otherwise.
    // Note that LMV snapResults contain values in lmv world coords.
  }, { key: "_getGeomSnapResult", value: function _getGeomSnapResult() {

      // Check which of the snappers has snapped
      var sheetSnap = this.sheetSnapper.isSnapped();
      var layerSnap = this.layerSnapper.isSnapped();
      if (!sheetSnap && !layerSnap) {
        return null;
      }

      // Get latest SnapResult
      var geomSnapper = sheetSnap ? this.sheetSnapper : this.layerSnapper;
      return geomSnapper.getSnapResult();
    }

    // If the last geometry snapping successfully snapped to a line segment, this function returns this line segment.
    // Result is in layer-coords.
    //  @returns {Object} - If we snapped to a line segment, we return r={a, b} where r.a and r.b are line start/end as Vector2.
  }, { key: "_getGeomSnapLine", value: function _getGeomSnapLine() {

      var result = this._getGeomSnapResult();
      if (!result) {
        return null;
      }

      // If we snapped to an edge, return this edge. Note that SnapType may be SNAP_EDGE, but may also be SNAP_VERTEX
      var edgeGeom = result.geomEdge;
      if (edgeGeom) {
        var verts = result.geomEdge.vertices;

        // Copy edge start/end to this.geomSnapLine
        this.geomSnapLine.a.copy(verts[0]);
        this.geomSnapLine.b.copy(verts[1]);

        // SnapResults are in world coords. We want the geomSnapLine in layer coords.
        this.geomSnapLine.a.applyMatrix4(this.layer.worldToLayer);
        this.geomSnapLine.b.applyMatrix4(this.layer.worldToLayer);

        return this.geomSnapLine;
      }

      // Another SnapType => No line constraint.
      return null;
    }

    // Snaps to 2D edit layer geometry. Returns the snapped point in layer coordinates or undefined if not snapped.
    //  @returns {Vector2} - snap position in layer coords.
  }, { key: "_getEditLayerSnapPosition", value: function _getEditLayerSnapPosition(canvasX, canvasY, snappingFilter) {

      // Note that snapper needs a Vector3 to work.
      var point = this.layer.canvasToLayer(canvasX, canvasY, this.tmpVec);

      // compute snap radius in layer coords
      var radius = this.layerSnapper.detectRadiusInPixels * this.layer.getUnitsPerPixel();

      // create bbox centered at the point and expanded by snapRadius in each direction
      this.snapBox.min.set(point.x - radius, point.y - radius);
      this.snapBox.max.set(point.x + radius, point.y + radius);

      // Build dictionary of dbIds of all shapes intersecting the snapBox
      var dbIds = {};
      this.layer.enumShapes(this.snapBox, function (shape) {
        // Collect dbId - unless shape is excluded from snapping
        if (!snappingFilter || snappingFilter(shape)) {
          dbIds[shape.id] = true;
        }
      });

      // Collect all triangulated meshes intersecting the snapBox
      var meshes = [];
      this.layer.enumMeshes(this.snapBox, function (mesh) {return meshes.push(mesh);});

      // Only consider edges/arcs/vertices within snapRadius
      var filter = function filter(dbId) {return Boolean(dbIds[dbId]);};

      // Run snapper on the given meshes/dbIds. Note that we run snapping in layer coords.
      this.layerSnapper.clearSnapped();
      this.layerSnapper.snapping2DOverlay(point, meshes, filter, radius);

      // Stop here if nothing was snapped
      if (!this.layerSnapper.isSnapped()) {
        return undefined;
      }

      // get snapped position in layer-coords
      var res = this.layerSnapper.getSnapResult();
      var snapPos = Autodesk.Viewing.MeasureCommon.getSnapResultPosition(res, this.viewer);

      // snapPos points to a vector inside snapResult. SnapResult will finally be converted to 
      // LMV world coords to make SnapperIndicator work. So, we copy it to a 2D vector first.
      snapPos = new THREE.Vector2().copy(snapPos);

      // SnapperIndicator requires world-coords in getSnapResult() to display correctly. 
      // Since we computed snapping in layer-coords, we finally convert it to LMV world coords.
      res.applyMatrix4(this.layer.layerToWorld);

      // Return snap position in layer coords
      return snapPos;
    }

    // Snaps to sheet geometry. Returns the snapped point in layer coordinates or undefined if not snapped.
  }, { key: "_getSheetSnapPosition", value: function _getSheetSnapPosition(canvasX, canvasY) {var _this = this;

      // Make sure that SegmentTree exists for all visible 2D models
      this.initSegmentTrees();

      // Callback to enum segments of all visible models
      var enumSegments = function enumSegments() {for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
        var models = _this.viewer.getVisibleModels();
        models.forEach(function (model) {
          // NOTE: SegmentTree may not be available yet if a model is still loading.
          //       In this case, we exclude it from snapping until loading is done.
          if (model.is2d() && model.segmentTree) {var _model$segmentTree;
            (_model$segmentTree = model.segmentTree).enumSegments.apply(_model$segmentTree, args);
          }
        });
      };

      // Note that we cannot use layer.canvasToLayer here, because snapper needs a Vector3 to work.
      var pos = this.viewer.impl.intersectGround(canvasX, canvasY);
      this.sheetSnapper.snapping2DWithSegmentEnum(pos, enumSegments);

      // If not snapped, just return current position
      if (!this.sheetSnapper.isSnapped()) {
        return undefined;
      }

      // get snapped position
      var res = this.sheetSnapper.getSnapResult();
      var p3D = Autodesk.Viewing.MeasureCommon.getSnapResultPosition(res, this.viewer); // returns Vector3

      // convert result from LMV world coords to layer coords
      // Note that we have to copy first, because p3D is a reference into the SnapResult. 
      // The SnapResult itself must remain in world coords to keep SnapperIndicator correct.
      p3D = this.tmpVec.copy(p3D).applyMatrix4(this.layer.worldToLayer);

      // Make sure that we consistently return 2D for all snapping types. Otherwise, we produce traps when using things like distanceTo()
      return new THREE.Vector2().copy(p3D);
    } }]);return Edit2DSnapper;}();export { Edit2DSnapper as default };


av.GlobalManagerMixin.call(Edit2DSnapper.prototype);