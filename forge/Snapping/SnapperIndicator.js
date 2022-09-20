const MeasureCommon = Autodesk.Viewing.MeasureCommon;
const isEqualVectors = MeasureCommon.isEqualVectors;
const EPSILON = MeasureCommon.EPSILON;
const SnapType = MeasureCommon.SnapType;

    var NO_OVERLAY = 0;
    var FACE_OVERLAY = 1;
    var EDGE_OVERLAY = 2;
    var POINT_OVERLAY = 3;
    
    var GEOMETRIES_OVERLAY = 'MeasureTool-snapper-geometries';
    var INDICATOR_OVERLAY = 'MeasureTool-snapper-indicator';

    var _geometryLineWidth = 0.3;
    var _indicatorLineWidth = 0.2;
    var _indicatorSize = 1.2;
    var _point = null;

    var _indicatorColor = 0xff7700;
    var _geometryColor = 0x00CC00;

    // /** @constructor */
    export function SnapperIndicator( viewer, snapper )
    {
        this.viewer = viewer;
        this.snapper = snapper;
        this.overlayType = NO_OVERLAY;
        this.previewsIntersectPoint = null;

        this.viewer.impl.createOverlayScene(GEOMETRIES_OVERLAY);
        this.viewer.impl.createOverlayScene(INDICATOR_OVERLAY);

        this.geometryMaterial = new THREE.MeshPhongMaterial({
            color: _geometryColor,
            ambient: _geometryColor,
            opacity: 0.5,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.indicatorMaterial = new THREE.MeshBasicMaterial({
            color: _indicatorColor,
            ambient: _indicatorColor,
            opacity: 1,
            transparent: false,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    SnapperIndicator.prototype.constructor = SnapperIndicator;
    var proto = SnapperIndicator.prototype;


    proto.render = function() {

        var snapResult = this.snapper.getSnapResult();

        if (!isEqualVectors(this.previewsIntersectPoint, snapResult.intersectPoint, EPSILON)) {
            this.clearOverlay(GEOMETRIES_OVERLAY);
        }
        
        this.clearOverlay(INDICATOR_OVERLAY);

        if (snapResult.isEmpty())
            return;

        if (this.snapper.renderSnappedGeometry ||
            (snapResult.hasTopology && this.snapper.renderSnappedTopology)) {
            this.renderGeometry(snapResult);
        }
        this.renderIndicator(snapResult);

        this.previewsIntersectPoint = snapResult.intersectPoint.clone();
    };

    proto.removeOverlay = function(overlayName) {
        
        this.viewer.impl.clearOverlay(overlayName);
        this.viewer.impl.removeOverlayScene(overlayName);

    };

    proto.clearOverlay = function(overlayName) {
        
        this.removeOverlay(overlayName);
        this.viewer.impl.createOverlayScene(overlayName);

    };

    proto.clearOverlays = function() {
        
        this.removeOverlay(GEOMETRIES_OVERLAY);
        this.viewer.impl.createOverlayScene(GEOMETRIES_OVERLAY);

        this.removeOverlay(INDICATOR_OVERLAY);
        this.viewer.impl.createOverlayScene(INDICATOR_OVERLAY);

        this.previewsIntersectPoint = null;

    };

    proto.addOverlay = function(overlayName, mesh) {

        this.viewer.impl.addOverlay(overlayName, mesh);

    };

    /**
     * Draw the planar face
     * @param geom -Geometry which needs to be draw.
     * @param mesh -Mesh which is loaded.
     */
    proto.drawFace = function(geom, material, overlayName) {

        var snapperPlane = new THREE.Mesh(geom, material, true);

        if (overlayName === GEOMETRIES_OVERLAY) {
            this.overlayType = FACE_OVERLAY;
        }

        this.addOverlay(overlayName, snapperPlane);

    };

    proto.cylinderMesh = function(pointX, pointY, material, width) {

        var direction = new THREE.Vector3().subVectors(pointY, pointX);
        var orientation = new THREE.Matrix4();
        orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
        orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0,
            0, 0, 1, 0,
            0, -direction.length(), 0, 0,
            0, 0, 0, 1));

        width = width || 0.5;
        var cylinder = new THREE.CylinderGeometry(width, width, 1.0, 8, 1, true);
        var edge = new THREE.Mesh(cylinder, material);
        cylinder = null;

        edge.applyMatrix(orientation);
        edge.position.x = (pointY.x + pointX.x) / 2;
        edge.position.y = (pointY.y + pointX.y) / 2;
        edge.position.z = (pointY.z + pointX.z) / 2;
        return edge;

    };

    proto.renderGeometry = function(snapResult) {

        if (isEqualVectors(this.previewsIntersectPoint, snapResult.intersectPoint, EPSILON)){
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
                break;
        }
    };

    proto.renderVertexIndicator = function(snapResult) {

        var pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        var scale = this.setScale(pos);
        var length = _indicatorSize * scale;

        var rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        var upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);

        var geom = new THREE.Geometry();
        var p = new THREE.Vector3();

        // Upper line
        p.addVectors(pos, rightVec);
        p.addVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Right line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.addVectors(pos, rightVec);
        p.addVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

    };

    proto.renderMidpointIndicator = function(snapResult) {

        var pos = snapResult.geomVertex;
        var scale = this.setScale(pos);
        var length = _indicatorSize * scale;

        var rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        var upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);

        var geom = new THREE.Geometry();
        var p = new THREE.Vector3();

        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.addVectors(pos, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Right line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.addVectors(pos, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

    };

    proto.renderEdgeIndicator = function(snapResult) {

        var pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        var scale = this.setScale(pos);
        var length = _indicatorSize * scale;

        var rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        var upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);

        var geom = new THREE.Geometry();
        var p = new THREE.Vector3();

        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Right line
        p.addVectors(pos, upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

    };

    proto.renderCircleIndicator = function(snapResult){

        var pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        this.drawCircle(pos, this.indicatorMaterial, INDICATOR_OVERLAY);

    };

    proto.renderPerpendicular = function(snapResult) {

        var pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        var scale = this.setScale(pos);
        var length = _indicatorSize * scale;

        var rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        var upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);

        var geom = new THREE.Geometry();
        var p = new THREE.Vector3();

        // Upper line
        geom.vertices[0] = pos.clone();
        p.subVectors(pos, rightVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Bottom line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        p.subVectors(pos, rightVec);
        p.addVectors(p, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Right line
        geom.vertices[0] = pos.clone();
        p.subVectors(pos, upVec);
        geom.vertices[1] = p.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

    };

    proto.renderPixelIndicator = function(snapResult) {

        var pos = MeasureCommon.getSnapResultPosition(snapResult, this.viewer);
        var scale = this.setScale(pos);
        var length = _indicatorSize * scale;

        var rightVec = this.viewer.navigation.getCameraRightVector().multiplyScalar(length);
        var upVec = this.viewer.navigation.getCameraUpVector().multiplyScalar(length);

        var geom = new THREE.Geometry();
        var p = new THREE.Vector3();

        // Top-left line
        p.subVectors(pos, rightVec);
        p.addVectors(p,upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Top-right line
        p.addVectors(pos, rightVec);
        p.addVectors(p,upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);

        // Bottom-right line
        p.addVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);
        
        // Bottom-left line
        p.subVectors(pos, rightVec);
        p.subVectors(p, upVec);
        geom.vertices[0] = p.clone();
        geom.vertices[1] = pos.clone();
        this.drawLine(geom, this.indicatorMaterial, _indicatorLineWidth, INDICATOR_OVERLAY);


    };

    proto.renderIndicator = function(snapResult) {

        if (snapResult.isPerpendicular) {
            this.renderPerpendicular(snapResult);
            return;
        }

        switch (snapResult.geomType) {
            case SnapType.SNAP_VERTEX:            
                this.renderVertexIndicator(snapResult);
                break;

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
                break;
        }
    };

    proto.drawLine = function(geom, material, width, overlayName) {

        // Line Pieces
        if (overlayName === GEOMETRIES_OVERLAY) {
            this.overlayType = EDGE_OVERLAY;    
        }
        
        for (var i = 0; i < geom.vertices.length; i += 2) {
            var cylinder = this.cylinderMesh(geom.vertices[i], geom.vertices[i + 1], material, width);
            this.setEdgeScale(cylinder);
            this.addOverlay(overlayName, cylinder);
        }
    };

    proto.drawPoint = function(point, material, overlayName) {
        
        // Because every point is snappable in PDFs, don't display the green dot for PDFs.
        if (this.viewer.model.getData().isLeaflet) {
            return;
        }

        if (!_point)
            _point = new THREE.SphereGeometry(1.0);

        var pointMesh = new THREE.Mesh(_point, material);
        pointMesh.position.set(point.x, point.y, point.z);

        this.setPointScale(pointMesh);

        if (overlayName === GEOMETRIES_OVERLAY) {
            this.overlayType = POINT_OVERLAY;
        }

        this.addOverlay(overlayName, pointMesh);

    };

    proto.drawCircle = function(point, material, overlayName) {

        var torus = new THREE.TorusGeometry(_indicatorSize, _indicatorLineWidth, 2, 20);
        var torusMesh = new THREE.Mesh(torus, material);
        torusMesh.lookAt(this.viewer.navigation.getEyeVector().normalize());
        torus = null;

        torusMesh.position.set(point.x, point.y, point.z);

        this.setCircleScale(torusMesh);

        this.addOverlay(overlayName, torusMesh);

    };

    proto.setScale = function (point) {

        var pixelSize = 5;

        var navapi = this.viewer.navigation;
        var camera = navapi.getCamera();
        var position = navapi.getPosition();

        var p = point.clone();

        var distance = camera.isPerspective ? p.sub(position).length()
            : navapi.getEyeVector().length();

        var fov = navapi.getVerticalFov();
        var worldHeight = 2.0 * distance * Math.tan(THREE.Math.degToRad(fov * 0.5));

        var viewport = navapi.getScreenViewport();
        var scale = pixelSize * worldHeight / viewport.height;

        return scale;

    };

    proto.setPointScale = function (pointMesh) {

        var scale = this.setScale(pointMesh.position);
        pointMesh.scale.x = scale;
        pointMesh.scale.y = scale;
        pointMesh.scale.z = scale;

    };

    proto.setCircleScale = function (torusMesh) {

        var scale = this.setScale(torusMesh.position);
        torusMesh.scale.x = scale;
        torusMesh.scale.y = scale;
    };

    proto.setEdgeScale = function (cylinderMesh) {

        var scale = this.setScale(cylinderMesh.position);
        cylinderMesh.scale.x = scale;
        cylinderMesh.scale.z = scale;
    };

    proto.updatePointScale = function(overlayName) {

        if (this.overlayType != POINT_OVERLAY)
            return;

        var overlay = this.viewer.impl.overlayScenes[overlayName];
        if (overlay) {
            var scene = overlay.scene;

            for (var i = 0; i < scene.children.length; i++) {
                var pointMesh = scene.children[i];
                if (pointMesh) {

                    this.setPointScale(pointMesh);
                }
            }
        }
    };

    proto.updateEdgeScale = function(overlayName) {

        if (this.overlayType != EDGE_OVERLAY)
            return;

        var overlay = this.viewer.impl.overlayScenes[overlayName];
        if (overlay) {
            var scene = overlay.scene;

            for (var i = 0; i < scene.children.length; i++) {
                var cylinderMesh = scene.children[i];
                if (cylinderMesh) {

                    this.setEdgeScale(cylinderMesh);
                }
            }
        }
    };

    proto.onCameraChange = function () {

        this.updatePointScale(GEOMETRIES_OVERLAY);
        this.updateEdgeScale(GEOMETRIES_OVERLAY);

        // if (!this.snapper.markupMode) {
            this.render();
        // }
    };

    proto.destroy = function() {

        this.removeOverlay(GEOMETRIES_OVERLAY);
        this.removeOverlay(INDICATOR_OVERLAY);

        if (_point) {
            _point.dispose();
            _point = null;
        }
    };

