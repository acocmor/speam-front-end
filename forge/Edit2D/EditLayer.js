function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
import { LmvCanvasContext } from '../PDF/LmvCanvasContext.js';
import { addContextCurrentTransform } from '../PDF/test-pattern.js';

var nextLayerId = 1;

// Radius in pixels used for hit-tests of thin lines. Hits within this distance are always considered, even if actual lineWidth is smaller.
var DefaultLineHitRadius = 10;

var av = Autodesk.Viewing;

// A layer manages a set of 2D shapes like polygons, polylines etc. for editing and display.
var EditLayer = /*#__PURE__*/function () {

  // @param {Viewer3D} viewer - Viewer instance needed to create materials
  function EditLayer(viewer) {var _this = this;_classCallCheck(this, EditLayer);

    av.EventDispatcher.prototype.apply(this);

    // Contains the triangulated geometry ready for rendering.
    this.scene = new THREE.Scene();

    // @param {Shape[]}
    this.shapes = [];

    // @param {CanvasGizmoBase[]}
    this.canvasGizmos = [];

    this.id = nextLayerId++;

    // We don't use font rendering so far
    var fontEngine = null;

    // Always use client coords for drawing
    var toPageUnits = 1.0;

    // LMVCanvasContext doesn't really need a viewport - unless it's used with Pdf.js
    var dummyViewport = { width: 0, height: 0 };
    this.context = new LmvCanvasContext(dummyViewport, toPageUnits, this._processMesh.bind(this), fontEngine);

    this.viewer = viewer;
    this.setGlobalManager(viewer.globalManager);

    // By default, we always update on modification operations. But it can (and should) be temporarily disabled 
    // for batch operations. 
    this.autoUpdate = true;

    this.toPageUnits = toPageUnits;

    this.styleModifiers = [];

    addContextCurrentTransform(this.context.canvasContext);

    // Update gizmo positions on camera changes
    this.onCameraChange = function () {return _this.updateCanvasGizmos();};
    this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChange);

    // Use custom tesselation accuracy for Bezier arcs. We use a bit finer values than PDF does right now.
    this.context.setTessParams({
      numIterations: 100,
      minSegLenFraction: 0.01 });


    // Optional transform between layer geometry and LMV world coords (default: identity)
    this.layerToWorld = new THREE.Matrix4();
    this.worldToLayer = new THREE.Matrix4();

    // Reused tmp values
    this.tmp_pWorld = new THREE.Vector3();
    this.tmp_p0 = new THREE.Vector2();
    this.tmp_p1 = new THREE.Vector2();
    this.tmp_ray = new THREE.Ray();

    // For editing on planes in 3D
    this.is3d = false;
    this.plane = new THREE.Plane();
    this._updatePlane();
  }_createClass(EditLayer, [{ key: "dtor", value: function dtor()

    {
      this._clearScene();
      this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChange);
    }

    // @param {Shape} shape
    // @returns {number} - The id of the shape. Used to access this shape later.
  }, { key: "addShape", value: function addShape(shape) {
      this.shapes.push(shape);

      this.dispatchEvent({ type: EditLayer.SHAPE_ADDED, shape: shape });

      this._onModified();
    }

    // Removes the given shape. 
    //  @returns {bool} true if shape was found and removed, otherwise false.
  }, { key: "removeShape", value: function removeShape(shape) {
      var index = this.shapes.indexOf(shape);
      if (index === -1) {
        return false;
      }
      this.shapes.splice(index, 1);

      this.dispatchEvent({ type: EditLayer.SHAPE_REMOVED, shape: shape });

      this._onModified();
      return true;
    } }, { key: "clear", value: function clear()

    {
      this.shapes.length = 0;

      this.dispatchEvent({ type: EditLayer.LAYER_CLEARED });

      this._onModified();
    }

    // Must be called after modifications to update the scene.
  }, { key: "update", value: function update() {

      // clear scene
      this._clearScene();

      for (var i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];

        // apply override style if specified
        var overrideStyle = this._getOverrideStyle(shape);

        shape.draw(this.context, overrideStyle);
      }

      // Make sure that all shapes are processed
      this.context.flushBuffer(0, true);

      // Currently, we only draw to overlay scenes. We may generalize that if we use it for planes in 3D later.
      this.viewer.impl.invalidate(false, false, true);

      // Update CanvasGizmos, e.g., to update polygon gizmo position if a polygon changed
      this.updateCanvasGizmos();
    } }, { key: "updateCanvasGizmos", value: function updateCanvasGizmos()

    {
      for (var i = 0; i < this.canvasGizmos.length; i++) {
        this.canvasGizmos[i].update();
      }
    }

    // @param {CanvasGizmoBase} gizmo - Must implement gizmo.update() to respond to changes.
  }, { key: "addCanvasGizmo", value: function addCanvasGizmo(gizmo) {
      this.canvasGizmos.push(gizmo);
    }

    // @param {CanvasGizmoBase} gizmo
  }, { key: "removeCanvasGizmo", value: function removeCanvasGizmo(gizmo) {
      var index = this.canvasGizmos.indexOf(gizmo);
      if (index === -1) {
        return false;
      }
      this.canvasGizmos.splice(index, 1);
      return true;
    } }, { key: "getViewport", value: function getViewport()

    {
      return this.viewport;
    }

    // Returns the topmost shape containing the point (x,y)
    //  @param {number} hitRadius - Used for hit-test of thin line-features. Points within this radius around a line are considered as hits - even if the actual lineWidth is smaller.
  }, { key: "hitTest", value: function hitTest(x, y) {var hitRadius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DefaultLineHitRadius;

      // process shapes backwards to find topmost first
      for (var i = this.shapes.length - 1; i >= 0; i--) {
        var shape = this.shapes[i];
        var radiusLC = this.getLineHitRadius(shape, hitRadius);

        if (shape.hitTest(x, y, radiusLC)) {
          return shape;
        }
      }
    }

    // Used for line-feature hit tests: 
    // We consider a point p to be "on edge e" if p is within a certain radius around e.
    // This radius depends on style and a certain min-distance in pixels used for thin lines. Result is in layer-coords.
  }, { key: "getLineHitRadius", value: function getLineHitRadius(shape) {var hitRadius = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DefaultLineHitRadius;

      var unitsPerPixel = this.getUnitsPerPixel();

      // Get line-width in layer coords
      var lineWidth = (shape.style.isScreenSpace ? unitsPerPixel : 1) * shape.style.lineWidth;

      // For thin lines, consider hits as long as they are within minPixels radius
      return Math.max(lineWidth, hitRadius * unitsPerPixel);
    }

    // Optional: Sets a callback to override the style for either all or a subset of shapes.
    //  @param {function(Shape, Style)} modifier - A callback that takes a shape as input and returns undefined (=no change) or a valid override style object.
  }, { key: "addStyleModifier", value: function addStyleModifier(modifier) {
      this.styleModifiers.push(modifier);
      this._onModified();
    } }, { key: "removeStyleModifier", value: function removeStyleModifier(

    modifier) {
      var index = this.styleModifiers.indexOf(modifier);
      if (index == -1) {
        return false;
      }
      this.styleModifiers.splice(index, 1);
      this._onModified();
      return true;
    }

    // Convert layer coordinates to canvas coords.
    //  @param {Vector2|Vector3} [target]
  }, { key: "layerToCanvas", value: function layerToCanvas(x, y) {var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new THREE.Vector2();

      // get point in LMV world coords
      var pWorld = this.tmp_pWorld.set(x, y, 0).applyMatrix4(this.layerToWorld);

      // For now, worldCoords.xy is identical with layer coords. This will change once we extend it to planes that can be embedded into 3D.
      var res = this.viewer.impl.worldToClient(pWorld);
      return target.set(res.x, res.y, 0.0); // Set z to 0 if target is Vector3. Otherwise, the param has no effect
    }

    // Note: This function currently assumes a uniform unitPerPixel ratio. This may change if we add support for projected
    //       planes in 3D, where pixelRatio may vary across the layer and may require different values in x/y direction.
  }, { key: "getPixelsPerUnit", value: function getPixelsPerUnit() {
      var _window = this.getWindow();

      // get screen projections of two points in layer-coords that have unit-distance
      var p0 = this.layerToCanvas(0, 0, this.tmp_p0);
      var p1 = this.layerToCanvas(1, 0, this.tmp_p1);
      return p0.distanceTo(p1) / _window.devicePixelRatio;
    } }, { key: "getUnitsPerPixel", value: function getUnitsPerPixel()

    {
      return 1.0 / this.getPixelsPerUnit();
    }

    // Convert canvas coordinates (from input events) to layer viewport coordinates
    //  @param {Vector2|Vector3} [target]
  }, { key: "canvasToLayer", value: function canvasToLayer(canvasX, canvasY)
    {var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new THREE.Vector2();
      // Compute "ray through pixel" in world-coords.
      var vpVec = this.viewer.impl.clientToViewport(canvasX, canvasY);
      var ray = this.viewer.impl.viewportToRay(vpVec, this.tmp_ray);

      // Intersect ray with plane that we edit on
      var intersect = ray.intersectPlane(this.plane, this.tmp_pWorld);

      if (!intersect) {
        // TODO: For 3D scenarios, we must properly support the case that canvasToLayer fails.
        return target.set(0, 0);
      }

      // Convert from world to layer coords
      intersect.applyMatrix4(this.worldToLayer);

      // Set 3rd-component to 0 for Vector3 targets. For 2D, the z param is ignored
      return target.set(intersect.x, intersect.y, 0);
    }

    // Runs the callback for all shapes in the layer that overlap the given bbox
    //  @param {Box2} bbox
    //  @param {function(Shape)} cb
  }, { key: "enumShapes", value: function enumShapes(bbox, cb) {
      for (var i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];

        // Make sure that bbox is up-to-date
        shape.updateBBox();

        if (bbox.isIntersectionBox(shape.bbox)) {
          cb(shape);
        }
      }
    }

    // Runs the callback for all triangulated 2D meshes created in the last update() call.
  }, { key: "enumMeshes", value: function enumMeshes(bbox, cb) {
      for (var i = 0; i < this.scene.children.length; i++) {
        var mesh = this.scene.children[i];
        var meshBox = mesh.geometry.boundingBox;

        // Note: The worldMatrix is not used for triangulated Edit2D meshes, so it will always be identity. Otherwise,
        //       we would need to compute a world-box using applyMatrixWorld() here.

        // Note that meshes have a 3D box, but we are only interested in 2D check. Therefore,
        // it's important to call intersectsBox on the input box and not on the mesh.
        if (bbox.isIntersectionBox(meshBox)) {
          cb(mesh);
        }
      }
    } }, { key: "findShapeById", value: function findShapeById(

    id) {
      return this.shapes.find(function (s) {return s.id == id;});
    } }, { key: "setMatrix", value: function setMatrix(

    layerToWorld) {
      this.layerToWorld.copy(layerToWorld);
      this.worldToLayer.getInverse(layerToWorld);

      // Update projection plane
      this._updatePlane();
    }

    // 
    // --- Internal functions ---
    //

    // process meshData produced by LmvCanvasContext
  }, { key: "_processMesh", value: function _processMesh(meshData) {

      // create GeometryBuffer
      var mdata = { mesh: meshData, is2d: true, packId: "0", meshIndex: 0 };
      Autodesk.Viewing.Private.BufferGeometryUtils.meshToGeometry(mdata);
      var geom = mdata.geometry;

      // create 2D material
      // Note that it is essential not to associate the material witha model. Otherwise,
      // the EditShapes will disappear if model layer 0 is switched off.
      var matman = this.viewer.impl.getMaterials();
      var matName = matman.create2DMaterial(null, meshData.material);
      var material = matman.findMaterial(null, matName);

      var mesh = new THREE.Mesh(geom, material);

      // Set mesh matrix
      mesh.matrix = this.layerToWorld;
      mesh.matrixAutoUpdate = false; // make sure matrix is not overwritten within updateMatrixWorld() later

      this.scene.children.push(mesh);
    } }, { key: "_onModified", value: function _onModified()

    {
      if (this.autoUpdate) {
        this.update();
      }
    }

    // Apply one or more style modifiers
  }, { key: "_getOverrideStyle", value: function _getOverrideStyle(shape) {
      var style = shape.style;
      for (var i = 0; i < this.styleModifiers.length; i++) {
        var mod = this.styleModifiers[i];
        style = mod(shape, style) || style;
      }
      return style;
    }

    // Dispose all shapes generated by this layer.
  }, { key: "_clearScene", value: function _clearScene() {

      // Dispose any GPU resources for previous output geometry
      // Note that we construct the scene as a flat list of meshes (see _processMesh). So, we don't need a generic traversal here.
      var meshes = this.scene.children;
      for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        mesh.geometry.dispose();

        // TODO: We have to take care to dispose materials here as well. However, just disposing materials here as well would produce a couple of issues:
        //
        //  1. MaterialManager caches materials based on properties. So, we cannot safely assume that the materials are solely used by ourselves.
        //     => MaterialManager currently only allows models to own 2D materials. We have to generalize it to support "ownerIDs" so
        //        that we can ensure that the materials are owned by this layer.
        //  2. Recompiling shaders on each update would be a waste. So we will need some caching.
      }
      this.scene.children.length = 0;
    }

    // Only needed for 3D scenes
  }, { key: "_updatePlane", value: function _updatePlane() {
      // The layer geometry itself is in the {z=0} plane
      this.plane.normal.set(0, 0, 1);
      this.plane.constant = 0.0;

      // Transform plane to world-coords
      this.plane.applyMatrix4(this.layerToWorld);
    } }]);return EditLayer;}();export { EditLayer as default };


av.GlobalManagerMixin.call(EditLayer.prototype);

EditLayer.SHAPE_ADDED = 'shapeAdded';
EditLayer.SHAPE_REMOVED = 'shapeRemoved';
EditLayer.LAYER_CLEARED = 'layerCleared';