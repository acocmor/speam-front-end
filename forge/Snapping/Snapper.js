
import { SnapperIndicator } from "./SnapperIndicator.js";
import {isMobileDevice} from "./src/compat.js";
import { VertexBufferReader } from "./src/wgs/scene/VertexBufferReader.js";
import { nearestPointOnCircularArc, sampleEllipsePoint, intersectLines } from "./SnapMath.js";

const MeasureCommon = Autodesk.Viewing.MeasureCommon;
const EPSILON = MeasureCommon.EPSILON;
const SnapType = MeasureCommon.SnapType;
const SnapResult = MeasureCommon.SnapResult;

var SNAP_PRECISION = 0.001;

const av = Autodesk.Viewing;

function isEqualWithPrecision(a, b) {
    return Math.abs(a - b) <= SNAP_PRECISION;
}

function isEqualVectorsWithPrecision(v1, v2) {
    return Math.abs(v1.x - v2.x) <= SNAP_PRECISION
        && Math.abs(v1.y - v2.y) <= SNAP_PRECISION
        && Math.abs(v1.z - v2.z) <= SNAP_PRECISION;
}

function isInverseVectorsWithPrecision(v1, v2) {
    return Math.abs(v1.x + v2.x) <= SNAP_PRECISION
        && Math.abs(v1.y + v2.y) <= SNAP_PRECISION
        && Math.abs(v1.z + v2.z) <= SNAP_PRECISION;
}

function distancePointToLine(point, lineStart, lineEnd) {

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
    }
    else if (param > 1) {
        distance = point.distanceTo(lineEnd);
    }
    else {
        X0.subVectors(point, lineStart);
        X1.subVectors(point, lineEnd);
        X0.cross(X1);
        X1.subVectors(lineEnd, lineStart);

        distance = Math.sqrt(X0.dot(X0)) / Math.sqrt(X1.dot(X1));
    }

    return distance;
};

const SnapCandidateType = {
    Unknown:       0,
    Line:          1,
    CircularArc:   2,
    EllipticalArc: 3
};

// A SnapCandidate references a single segment (line or arc) that we could snap to.
class SnapCandidate {
    constructor(viewportId, distance) {

        this.type = SnapCandidateType.Unknown;
        this.viewportId = viewportId;

        // 2d distance between original (unsnapped) position and the geometry of this candidate.
        this.distance = 0;

        // {Vector2} Start/Endpoint - only for line segments
        this.lineStart = null;
        this.lineEnd   = null;

        // Fixed radius - only for CircularArcs
        this.radius = 0;
        
        // Separate radii - only for ellipse arcs
        this.radiusX = 0; // = major radius - by convention
        this.radiusY = 0;
        
        // Center point as Vector2 (for arcs)
        this.center = null;

        // Start/end angle for arcs: Ccw angle in radians. Angle 0 corresponds to direction x+.
        this.startAngle = 0;
        this.endAngle   = 0; 
    }

    fromLine(p1, p2) {
        this.type = SnapCandidateType.Line;
        this.lineStart = p1.clone();
        this.lineEnd   = p2.clone();
        return this;
    }

    fromCircularArc(center, radius, start, end) {
        this.type   = SnapCandidateType.CircularArc;
        this.center = center.clone();
        this.radius = radius;
        this.start  = start;
        this.end    = end;
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

    isLine()          { return this.type === SnapCandidateType.Line; }
    isCircularArc()   { return this.type === SnapCandidateType.CirularArc; }
    isEllipticalArc() { return this.type === SnapCandidateType.EllipticalArc; }

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
            return intersectLines(this.lineStart, this.lineEnd, other.lineStart, other.lineEnd, false, optionalTarget);
        }
        
        // TODO: Currently, we only support snapping to line-line intersections
    }
};

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
        snapPoint:  new THREE.Vector3(0, 0, intersectPoint.z)
    };
    
    // Check for any candidate that intersects with the closest one we found
    const first = candidates[0];
    for (let i=1; i<candidates.length; i++) {
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
 * @memberof Autodesk.Viewing.Extensions.Snapping
 * @alias Autodesk.Viewing.Extensions.Snapping.Snapper
 * @constructor
 */
export function Snapper(viewer, options) {

    var _snapResult = new SnapResult();

    var _viewer = viewer;
    this.setGlobalManager(viewer.globalManager);

    var _options = options || {};
    var _names;

    if (_options.markupMode) {
        _names = ["snapper-markup"];
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

    this.indicator = new SnapperIndicator(viewer, this);

    this.markupMode = _options.markupMode;
    this.renderSnappedGeometry = _options.renderSnappedGeometry;
    this.renderSnappedTopology = _options.renderSnappedTopology;

    //Notice: The pixelSize should correspond to the amount of pixels per line in idAtPixels, the shape of
    //detection area is square in idAtPixels, but circle in snapper, should make their areas match roughly.
    this.detectRadiusInPixels = isMobileDevice() ? 50 : 10;

    /**
     * @returns {boolean} true when the tool is active
     *
     * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#isActive
     */
    this.isActive = function() {
        return _active;
    };

    this.getNames = function() {
        return _names;
    };

    this.getName = function() {
        return _names[0];
    };

    this.getPriority = function() {
        return _priority;
    };

    /**
     * Starts intercepting pointer events.
     * Invoked automatically by the {@link ToolController}.
     *
     * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#activate
     */
    this.activate = function() {
        _active = true;

        if (!this.indicator) {
            this.indicator = new SnapperIndicator(viewer, this);
        }
    };


    /**
     * Stops intercepting pointer events.
     * Invoked automatically by the {@link ToolController}.
     *
     * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#deactivate
     */
    this.deactivate = function() {
        _active = false;
        _snapToPixel = false;

        if (this.indicator) {
            this.indicator.destroy();
            this.indicator = null;    
        }        
    };

    this.copyResults = function(destiny) {
        _snapResult.copyTo(destiny);
    };

    this.getEdge = function() {
        return _snapResult.geomEdge;
    };

    this.getVertex = function() {
        return _snapResult.geomVertex;
    };

    this.getGeometry = function() {
        return _snapResult.getGeometry();
    };

    this.getGeometryType = function() {
        return _snapResult.geomType;
    };

    this.getIntersectPoint = function() {
        return _snapResult.intersectPoint;
    };


    /**
     * @returns {SnapResult} The snapping status of the last pointer event performed.
     *
     * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#getSnapResult
     */
    this.getSnapResult = function() {
        return _snapResult;
    };

    /**
     * Checks whether the tool's last update resulted on a snap.
     *
     * @returns {boolean} true when the last pointer event got snapped.
     *
     * @alias Autodesk.Viewing.Extensions.Snapping.Snapper#isSnapped
     */
    this.isSnapped = function() {
        return _isSnapped;
    };

    this.clearSnapped = function() {
        _snapResult.clear();
        _isSnapped = false;
    };

    this.setViewportId = function(vpId) {
        _forcedVpId = vpId;
    };

    this.setSnapToPixel = function(enable) {
        _snapToPixel = enable;
    };

    /**
     * 3D Snapping
     * @param result -Result of Hit Test.
     */
    this.snapping3D = function(result) {

        _snapResult.snapNode = result.dbId;
        _snapResult.intersectPoint = result.intersectPoint;
        _snapResult.modelId = result.model ? result.model.id : null;

        // Avoid crash if the hit test does not belong to a model. This may happen, if a 3D overlay was hit (see Viewer3DImpl.rayIntersect).
        if (!result.model) {
            return;
        }

        var face = result.face;
        var fragIds;

        if (!result.fragId || result.fragId.length === undefined) {
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
    };

    /**
     * Snapping order is: 1st vertices, 2nd edges, 3rd and final faces.
     */
    this.snapping3DwithTopology = function(face, fragIds, model) {

        // Because edge topology data may be in other fragments with same dbId, need to iterate all of them.
        if (_snapResult.snapNode) {
            fragIds = [];

            model.getData().instanceTree.enumNodeFragments(_snapResult.snapNode, function(fragId) {
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
            }
            else if ((_options.forceSnapEdges || _distanceToEdge < _snapResult.radius) && _snapResult.geomEdge) {

                var center = this.edgeIsCircle(_snapResult.geomEdge);
                if (center) {
                    _snapResult.circularArcCenter = center;
                    _snapResult.circularArcRadius = center.distanceTo(_snapResult.geomEdge.vertices[0]);
                    _snapResult.geomEdge.center = _snapResult.circularArcCenter;
                    _snapResult.geomEdge.radius = _snapResult.circularArcRadius;
                    _snapResult.geomType = SnapType.SNAP_CIRCULARARC;
                }
                else if (this.edgeIsCurved(_snapResult.geomEdge)) {
                    _snapResult.geomType = SnapType.SNAP_CURVEDEDGE;
                }
                else {
                    _snapResult.geomType = SnapType.SNAP_EDGE;
                }

            }
            else {

                if (this.faceIsCurved(_snapResult.geomFace)) {
                    _snapResult.geomType = SnapType.SNAP_CURVEDFACE;
                }
                else {
                    _snapResult.geomType = SnapType.SNAP_FACE;
                }

            }
            
            _isSnapped = true;
        }
    };

    this.snapping3DtoMesh = function(face, fragIds, model) {
         for (var fi = 0; fi < fragIds.length; ++fi) {

            var fragId = fragIds[fi];
            var mesh = _viewer.impl.getRenderProxy(model, fragId);
            var geometry = mesh.geometry;

            // Note that face may also be a line {a, b} (see lineRayCast(..) in VBIntersector.js
            if (face instanceof THREE.Face3) {
                _snapResult.geomFace = this.faceSnapping(face, geometry);
            }

            if (!_snapResult.geomFace)
                continue;

            _snapResult.geomFace.applyMatrix(mesh.matrixWorld);
            _snapResult.geomEdge = this.edgeSnapping(_snapResult.geomFace, _snapResult.intersectPoint);
            _snapResult.geomVertex = this.vertexSnapping(_snapResult.geomEdge, _snapResult.intersectPoint);

            var normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
            _snapResult.faceNormal = face.normal.applyMatrix3(normalMatrix).normalize();

            // Determine which one should be drawn: face , edge or vertex
            _snapResult.radius = this.setDetectRadius(_snapResult.intersectPoint);

            if ((_options.forceSnapVertices || (_distanceToVertex < _snapResult.radius))) {
                _snapResult.geomType = SnapType.SNAP_VERTEX;
            }
            else if (_options.forceSnapEdges || (_distanceToEdge < _snapResult.radius)) {
                _snapResult.geomType = SnapType.SNAP_EDGE;
            }
            else {
                _snapResult.geomType = SnapType.SNAP_FACE;
            }

            _isSnapped = true;
            break;
        }
    };

    this.faceSnappingWithTopology = function(face, geometry, facesTopology, mesh) {

        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();
        var vC = new THREE.Vector3();

        var geom = new THREE.Geometry();

        var attributes = geometry.attributes;

        if (attributes.index !== undefined) {

            var positions = geometry.vb ? geometry.vb : attributes.position.array;
            var stride = geometry.vb ? geometry.vbstride : 3;

            // Find the index of face topology list which includes the intersect face(triangle)
            for (var i = 0; i < facesTopology.length; i++) {

                var indexList = facesTopology[i].indexList;
                var faceId = facesTopology[i].id;
                for (var j = 0; j < indexList.length; j += 3) {

                    if (face.a === indexList[j]) {
                        if ((face.b === indexList[j + 1] && face.c === indexList[j + 2]) || (face.b === indexList[j + 2] && face.c === indexList[j + 1])) {
                            break;
                        }
                    }
                    else if (face.a === indexList[j + 1]) {
                        if ((face.b === indexList[j] && face.c === indexList[j + 2]) || (face.b === indexList[j + 2] && face.c === indexList[j])) {
                            break;
                        }
                    }
                    else if (face.a === indexList[j + 2]) {
                        if ((face.b === indexList[j] && face.c === indexList[j + 1]) || (face.b === indexList[j + 1] && face.c === indexList[j])) {
                            break;
                        }
                    }
                }

                if (j < indexList.length) {
                    break;
                }
            }

            if (i < facesTopology.length) {

                for (var j = 0; j < indexList.length; j += 3) {
                    vA.set(
                        positions[ indexList[j] * stride ],
                        positions[ indexList[j] * stride + 1 ],
                        positions[ indexList[j] * stride + 2 ]
                    );
                    vB.set(
                        positions[ indexList[j + 1] * stride ],
                        positions[ indexList[j + 1] * stride + 1 ],
                        positions[ indexList[j + 1] * stride + 2 ]
                    );
                    vC.set(
                        positions[ indexList[j + 2] * stride ],
                        positions[ indexList[j + 2] * stride + 1 ],
                        positions[ indexList[j + 2] * stride + 2 ]
                    );

                    var vIndex = geom.vertices.length;

                    geom.vertices.push(vA.clone());
                    geom.vertices.push(vB.clone());
                    geom.vertices.push(vC.clone());

                    geom.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2));
                }
            }
        }

        //console.log(face);

        if (geom.vertices.length > 0) {

            geom.faceId = faceId;
            geom.applyMatrix(mesh.matrixWorld);
            return geom;
        }
        else {

            return null;
        }

    };

    /**
     * Find the closest face next to the cast ray
     * @param {THREE.Face3} face - the intersect triangle of Hit Test.
     * @param geometry - the geometry of mesh
     *
     * @private
     */
    this.faceSnapping = function(face, geometry) {

        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();
        var vC = new THREE.Vector3();

        var geom = new THREE.Geometry();  //Geometry which includes all the triangles on the same plane.



        var attributes = geometry.attributes;

        if (attributes.index !== undefined) {

            var indices = attributes.index.array || geometry.ib;
            var positions = geometry.vb ? geometry.vb : attributes.position.array;
            var stride = geometry.vb ? geometry.vbstride : 3;
            var offsets = geometry.offsets;

            if ( !offsets || offsets.length === 0) {

                offsets = [{start: 0, count: indices.length, index: 0}];

            }

            for (var oi = 0; oi < offsets.length; ++oi) {

                var start = offsets[oi].start;
                var count = offsets[oi].count;
                var index = offsets[oi].index;

                for (var i = start; i < start + count; i += 3) {

                    var a = index + indices[i];
                    var b = index + indices[i + 1];
                    var c = index + indices[i + 2];

                    vA.set(
                        positions[a * stride],
                        positions[a * stride + 1],
                        positions[a * stride + 2]
                    );
                    vB.set(
                        positions[b * stride],
                        positions[b * stride + 1],
                        positions[b * stride + 2]
                    );
                    vC.set(
                        positions[c * stride],
                        positions[c * stride + 1],
                        positions[c * stride + 2]
                    );

                    var faceNormal = THREE.Triangle.normal(vA, vB, vC);

                    var va = new THREE.Vector3();
                    va.set(
                        positions[ face.a * stride ],
                        positions[ face.a * stride + 1 ],
                        positions[ face.a * stride + 2 ]
                    );

                    if (isEqualVectorsWithPrecision(faceNormal, face.normal) && isEqualWithPrecision(faceNormal.dot(vA), face.normal.dot(va)))
                    {

                        var vIndex = geom.vertices.length;

                        geom.vertices.push(vA.clone());
                        geom.vertices.push(vB.clone());
                        geom.vertices.push(vC.clone());

                        geom.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2));

                    }
                }
            }
        }

        if (geom.vertices.length > 0) {

            return this.getTrianglesOnSameFace(geom, face, positions, stride);
        }
        else {

            return null;
        }
    };

    /**
     * Find triangles on the same face with the triangle intersected with the cast ray
     * @param geom -Geometry which includes all the triangles on the same plane.
     * @param face -Triangle which intersects with the cast ray.
     * @param positions -Positions of all vertices.
     * @param stride -Stride for the interleaved buffer.
     *
     * @private
     */
    this.getTrianglesOnSameFace = function(geom, face, positions, stride) {

        var isIncludeFace = false; // Check if the intersect face is in the mesh
        var vertexIndices = geom.vertices.slice();

        var va = new THREE.Vector3();
        va.set(
            positions[ face.a * stride ],
            positions[ face.a * stride + 1 ],
            positions[ face.a * stride + 2 ]
        );
        var vb = new THREE.Vector3();
        vb.set(
            positions[ face.b * stride ],
            positions[ face.b * stride + 1 ],
            positions[ face.b * stride + 2 ]
        );
        var vc = new THREE.Vector3();
        vc.set(
            positions[ face.c * stride ],
            positions[ face.c * stride + 1 ],
            positions[ face.c * stride + 2 ]
        );
        var intersectFace = new THREE.Geometry();
        intersectFace.vertices.push(va);
        intersectFace.vertices.push(vb);
        intersectFace.vertices.push(vc);
        intersectFace.faces.push(new THREE.Face3(0, 1, 2));

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

                for (var k = 0; k < intersectFace.vertices.length; k += 3) {

                    // The triangles which are on the same face with the intersected triangle
                    if (this.trianglesSharedEdge(vertexIndices[j], vertexIndices[j + 1], vertexIndices[j + 2],
                            intersectFace.vertices[k], intersectFace.vertices[k + 1], intersectFace.vertices[k + 2])) {

                        var vIndex = intersectFace.vertices.length;
                        intersectFace.vertices.push(vertexIndices[j].clone());
                        intersectFace.vertices.push(vertexIndices[j + 1].clone());
                        intersectFace.vertices.push(vertexIndices[j + 2].clone());
                        intersectFace.faces.push(new THREE.Face3(vIndex, vIndex + 1, vIndex + 2));

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
            return intersectFace;
        }
        else {
            return null;
        }

    };

    /**
     * Check if the two triangle share edge, the inputs are their vertices
     *
     * @private
     */
    this.trianglesSharedEdge = function(a1, a2, a3, b1, b2, b3) {

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

    this.edgeSnappingWithTopology = function(intersectPoint, geometry, edgesTopology, mesh) {

        var edgeGeom = new THREE.Geometry();
        var minDistTopoIndex;
        var minDist = Number.MAX_VALUE;

        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();

        var attributes = geometry.attributes;

        if (attributes.index !== undefined && edgesTopology != undefined) {

            var positions = geometry.vb ? geometry.vb : attributes.position.array;
            var stride = geometry.vb ? geometry.vbstride : 3;

            // Find the index of edge topology list which includes the nearest edge segment to the intersect point
            for (var i = 0; i < edgesTopology.length; i++) {

                var indexList = edgesTopology[i].indexList;
                // In edges topology index list the type is LineStrip
                for (var j = 0; j < indexList.length - 1; j++) {
                    vA.set(
                        positions[ indexList[j] * stride ],
                        positions[ indexList[j] * stride + 1 ],
                        positions[ indexList[j] * stride + 2 ]
                    );
                    vB.set(
                        positions[ indexList[j + 1] * stride ],
                        positions[ indexList[j + 1] * stride + 1 ],
                        positions[ indexList[j + 1] * stride + 2 ]
                    );

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
                    edgeGeom.vertices.push(new THREE.Vector3(positions[indexList[k] * stride], positions[indexList[k] * stride + 1], positions[indexList[k] * stride + 2]));
                    // To make the line's type to LinePieces which is used by drawLine function
                    edgeGeom.vertices.push(new THREE.Vector3(positions[indexList[k + 1] * stride], positions[indexList[k + 1] * stride + 1], positions[indexList[k + 1] * stride + 2]));
                }
            }
        }

        if (_distanceToEdge >= minDist && edgeGeom.vertices.length > 0) {

            _distanceToEdge = minDist;
            edgeGeom.applyMatrix(mesh.matrixWorld);
            _snapResult.geomEdge = edgeGeom;
        }
    };

    /**
     * Find the closest edge next to the intersect point
     * @param face -Face which is found by faceSnapping.
     * @param intersectPoint -IntersectPoint between cast ray and face.
     * @param mesh -The whole mesh of one fragment.
     *
     * @private
     */
    this.edgeSnapping = function(face, intersectPoint) {

        var lineGeom = new THREE.Geometry();
        var isEdge_12 = true;
        var isEdge_13 = true;
        var isEdge_23 = true;

        for (var i = 0; i < face.vertices.length; i += 3) {

            for (var j = 0; j < face.vertices.length; j += 3) {

                if ( i !== j ) {
                    // Check edge 12
                    if ((face.vertices[i].equals(face.vertices[j]) || face.vertices[i].equals(face.vertices[j + 1])
                        || face.vertices[i].equals(face.vertices[j + 2]))
                        && (face.vertices[i + 1].equals(face.vertices[j]) || face.vertices[i + 1].equals(face.vertices[j + 1])
                        || face.vertices[i + 1].equals(face.vertices[j + 2]))) {

                        isEdge_12 = false;

                    }
                    // Check edge 13
                    if ((face.vertices[i].equals(face.vertices[j]) || face.vertices[i].equals(face.vertices[j + 1])
                        || face.vertices[i].equals(face.vertices[j + 2]))
                        && (face.vertices[i + 2].equals(face.vertices[j]) || face.vertices[i + 2].equals(face.vertices[j + 1])
                        || face.vertices[i + 2].equals(face.vertices[j + 2]))) {

                        isEdge_13 = false;

                    }
                    // Check edge 23
                    if ((face.vertices[i + 1].equals(face.vertices[j]) || face.vertices[i + 1].equals(face.vertices[j + 1])
                        || face.vertices[i + 1].equals(face.vertices[j + 2]))
                        && (face.vertices[i + 2].equals(face.vertices[j]) || face.vertices[i + 2].equals(face.vertices[j + 1])
                        || face.vertices[i + 2].equals(face.vertices[j + 2]))) {

                        isEdge_23 = false;

                    }
                }
            }

            if (isEdge_12) {

                lineGeom.vertices.push(face.vertices[i].clone());
                lineGeom.vertices.push(face.vertices[i + 1].clone());

            }
            if (isEdge_13) {

                lineGeom.vertices.push(face.vertices[i].clone());
                lineGeom.vertices.push(face.vertices[i + 2].clone());

            }
            if (isEdge_23) {

                lineGeom.vertices.push(face.vertices[i + 1].clone());
                lineGeom.vertices.push(face.vertices[i + 2].clone());

            }

            isEdge_12 = true;
            isEdge_13 = true;
            isEdge_23 = true;

        }

        //return lineGeom;

        var edgeGeom = new THREE.Geometry();
        var minDistIndex;
        var minDist = Number.MAX_VALUE;

        for (var k = 0; k < lineGeom.vertices.length; k += 2) {

            var dist = distancePointToLine(intersectPoint, lineGeom.vertices[k], lineGeom.vertices[k + 1]);

            if (dist < minDist) {
                minDist = dist;
                minDistIndex = k;
            }

        }

        edgeGeom.vertices.push(lineGeom.vertices[ minDistIndex ].clone());
        edgeGeom.vertices.push(lineGeom.vertices[ minDistIndex + 1 ].clone());

        edgeGeom.vertices = this.getConnectedLineSegmentsOnSameLine(lineGeom, edgeGeom.vertices);

        _distanceToEdge = minDist;

        return edgeGeom;

    };

    this.getConnectedLineSegmentsOnSameLine = function(lineGeom, edgeVertices) {

        var vertices = lineGeom.vertices.slice();
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

                        V0.subVectors(edgeVertices[k],  edgeVertices[k + 1]);
                        V0.normalize();
                        V1.subVectors(vertices[j],vertices[j + 1]);
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

                edgeVertices.push(vertices[ vCount[ci] ]);
                edgeVertices.push(vertices[ vCount[ci] + 1 ]);
                vertices.splice(vCount[ci], 2);

            }

        } while (vCount.length > 0);

        return edgeVertices;

    };

    this.vertexSnappingWithTopology = function(edge, intersectPoint) {

        var minDist = Number.MAX_VALUE;
        var point = new THREE.Vector3();

        if (edge && edge.vertices.length > 1) {
            var dist1 = intersectPoint.distanceTo(edge.vertices[0]);
            var dist2 = intersectPoint.distanceTo(edge.vertices[edge.vertices.length - 1]);

            if (dist1 <= dist2) {
                minDist = dist1;
                point = edge.vertices[0].clone();
            }
            else {
                minDist = dist2;
                point = edge.vertices[edge.vertices.length - 1].clone();
            }
        }

        _distanceToVertex = minDist;

        return point;
    };

    /**
     * Find the closest vertex next to the intersect point
     * @param edge -Edge which is found by edgeSnapping.
     * @param intersectPoint -IntersectPoint between cast ray and face.
     *
     * @private
     */
    this.vertexSnapping = function(edge, intersectPoint) {

        var minDist = Number.MAX_VALUE;
        var point = new THREE.Vector3();

        for (var i = 0; i < edge.vertices.length; ++i) {

            var dist = intersectPoint.distanceTo(edge.vertices[i]);

            if (dist < minDist - SNAP_PRECISION) {

                minDist = dist;
                point = edge.vertices[i].clone();

            }
        }

        _distanceToVertex = minDist;

        return point;
    };

    // This is only a workaround to detect if an edge is circle
    this.edgeIsCircle = function(edge) {

        var vertices = edge.vertices;

        // Exclude squares and regular polygons
        if (vertices.length < 8) {
            return false;
        }

        if (vertices[0].equals(vertices[vertices.length - 1])) {

            var center = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < vertices.length; i += 2) {
                center.add(vertices[i]);
            }
            center.divideScalar(vertices.length / 2.0);

            var radius = center.distanceTo(vertices[0]);
            for (var i = 0; i < vertices.length; i += 2) {
                if (Math.abs(center.distanceTo(vertices[i]) - radius) <= SNAP_PRECISION) {
                    continue;
                }
                else {
                    return false;
                }
            }
            return center;
        }
        else {
            return false;
        }
    };

    this.edgeIsCurved = function (edge) {

        var vertices = edge.vertices;

        if (vertices.length <= 2) {
            return false;
        }
        else if (vertices[0].equals(vertices[vertices.length - 1])) {
            return true;
        }
        else {
            var V1 = new THREE.Vector3();
            V1.subVectors(vertices[0], vertices[1]);

            var V2 = new THREE.Vector3();
            for (var i = 2; i < vertices.length; i += 2) {
                V2.subVectors(vertices[i], vertices[i + 1]);
                if (!isEqualVectorsWithPrecision(V1, V2)) {
                    return true;
                }
            }

            return false;
        }
    };

    this.faceIsCurved = function (face) {

        var vertices = face.vertices;
        var faces = face.faces;

        if (faces.length <= 1) {
            return false;
        }
        else {
            var fN1 = THREE.Triangle.normal(vertices[faces[0].a], vertices[faces[0].b], vertices[faces[0].c]);
            var vA1 = vertices[faces[0].a];

            for (var i = 1; i < faces.length; i++) {
                var fN2 = THREE.Triangle.normal(vertices[faces[i].a], vertices[faces[i].b], vertices[faces[i].c]);
                var vA2 = vertices[faces[i].a];

                if (!isEqualVectorsWithPrecision(fN1, fN2) || !isEqualWithPrecision(fN1.dot(vA1), fN2.dot(vA2))) {
                    return true;
                }
            }

            return false;
        }
    };

    this.angleVector2 = function(vector) {

        if (vector.x > 0 && vector.y >= 0) {
            return Math.atan(vector.y / vector.x);
        }
        else if (vector.x >= 0 && vector.y < 0) {
            return Math.atan(vector.y / vector.x) + Math.PI * 2;
        }
        else if (vector.x < 0 && vector.y <= 0) {
            return Math.atan(vector.y / vector.x) + Math.PI;
        }
        else if (vector.x <= 0 && vector.y > 0) {
            return Math.atan(vector.y / vector.x) + Math.PI;
        }
        else{ // x = 0, y = 0
            return null;
        }
    };

    // Creates a THREE.Geometry that represents an approximation of a given elliptical arc in {z=0} plane.
    // Points are obtained by by uniform sampling of a given elliptical arc.
    //  @param {number} numPoints - The length number of points that the output geometry will contain. segments in which we subdivide the arc. Resulting point count is numSegments+1.
    // See sampleEllipsePoint for param details.
    const createEllipticalArcGeometry = (cx, cy, rx, ry, startAngle, endAngle, numPoints) => {
        const geometry = new THREE.Geometry();
        for (let i=0; i<numPoints; i++) {
            let p = new THREE.Vector3(0,0,0);
            sampleEllipsePoint(cx, cy, rx, ry, startAngle, endAngle, i/(numPoints-1), p);

            geometry.vertices.push(p);
        }
        return geometry;
    };

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

        this.vpIdLine = null;
        this.vpIdCircular = null;
        this.vpIdElliptical = null;

        this.detectRadius = aDetectRadius;

        // Collects candidate segments that we can snap to.
        // This is used to allow snapping to segment intersections.
        this.snapCandidates = []; // {SnappingCandidate[]}
    }

    GeometryCallback.prototype.onLineSegment = function(x1, y1, x2, y2, vpId) {
        var intersectPoint = this.snapper.getIntersectPoint();
        var vertices = this.lineGeom.vertices;
        var v1 = new THREE.Vector3(x1, y1, intersectPoint.z);
        var v2 = new THREE.Vector3(x2, y2, intersectPoint.z);

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

    GeometryCallback.prototype.onCircularArc = function(cx, cy, start, end, radius, vpId) {
        var intersectPoint = this.snapper.getIntersectPoint();
        var point = new THREE.Vector2(intersectPoint.x, intersectPoint.y);

        var center = new THREE.Vector2(cx, cy);
        point.sub(center);

        // Compute closest point on arc
        const pointOnArc = nearestPointOnCircularArc(intersectPoint, center, radius, start, end);
        const dist       = pointOnArc.distanceTo(intersectPoint); // 2D distance

        // Collect snap candidate
        this.snapCandidates.push(new SnapCandidate(vpId, dist).fromCircularArc(center, radius, start, end));

        // Skip arcs outside detectRadius
        if (dist > this.detectRadius) {
            return;
        }

        // TODO: get rid of the CircleGeometry stuff below, because we computed the snapPoint above already.
        //       But this needs some refactoring, because the Geometry is passed around outside of snapper.

        var angle = this.snapper.angleVector2(point);

        if (end > start && angle >= start && angle <= end) {
            var arc = new THREE.CircleGeometry(radius, 100, start, end - start);
        }
        else if (end < start && (angle >= start || angle <= end)) {
            var arc = new THREE.CircleGeometry(radius, 100, start, Math.PI * 2 - start + end);
        }
        else {
            return;
        }
        arc.vertices.splice(0, 1);
        arc.applyMatrix(new THREE.Matrix4().makeTranslation(cx, cy, intersectPoint.z));
        this.circularArc = arc;
        this.circularArcCenter = new THREE.Vector3(cx, cy, intersectPoint.z);
        this.circularArcRadius = radius;

        this.snapPoint = new THREE.Vector3(pointOnArc.x, pointOnArc.y, intersectPoint.z);

        this.vpIdCircular = vpId;
    };

    GeometryCallback.prototype.onEllipticalArc = function(cx, cy, start, end, major, minor, tilt, vpId) {
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

            if ((end > start && angle >= start && angle <= end) || (end < start && (angle >= start || angle <= end))){
                var arc = createEllipticalArcGeometry(cx, cy, major, minor, start, end, 50);
                if (!isEqualWithPrecision(end - start, Math.PI * 2))
                {
                    arc.vertices.pop();
                }
                arc.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, intersectPoint.z));

                // Compute distance between geometry and snapped point. 
                // We use the same way here as in getSnapResultPosition(). This will be replaced later by a more accurate solution.
                const nearestPoint = nearestVertexInVertexToEdge(intersectPoint, arc);
                const dist = THREE.Vector2.prototype.distanceTo.call(nearestPoint, intersectPoint); // only in x/y

                // Collect snap candidate
                const center = new THREE.Vector2(cx, cy)
                this.snapCandidates.push(new SnapCandidate(vpId, dist).makeEllipticalArc(center, major, minor, start, end));

                // Todo: Unlike for line-segments, arcs are currently collected by "last one wins" rule by the code for single-snapping. 
                //       We should consider the distance here as well.
                this.ellipticalArc = arc;
                this.ellipticalArcCenter = new THREE.Vector3(cx, cy, intersectPoint.z);

                this.vpIdElliptical = vpId;
            }
        }
    };

    this.snapping2D = function(result) {

        if (!result) {
            return;
        }
        
        var intersectPoint = result.intersectPoint;
        var fragIds = result.fragId;

        if (typeof fragIds === "undefined") {
            return;
        }
        else if (!Array.isArray(fragIds)) {
            fragIds = [fragIds];
        }

        _snapResult.modelId = result.model ? result.model.id : null;
        _snapResult.hasTopology = false;
        _snapResult.intersectPoint = intersectPoint;

        // Determine which one should be drawn: line, circular arc or elliptical arc
        _snapResult.radius = this.setDetectRadius(intersectPoint);

        // Geometry snapping is only possible if a fragment list is available to obtain geometry per fragment.
        var supportsGeomSnapping = (_viewer.model.getFragmentList()!=null);
        if (!supportsGeomSnapping) {

            // If no snapping is available, just accept the hitpoint as a vertex hit. This allows to measure
            // distances between arbitrary points in rasters.
            _isSnapped = true;
            _snapResult.geomType = SnapType.SNAP_VERTEX;
            _snapResult.geomVertex = intersectPoint;

            return;
        }


        var gc = new GeometryCallback(_viewer, this, _snapResult.radius);

        for (var fi = 0; fi < fragIds.length; ++fi) {

            var mesh = _viewer.impl.getRenderProxy(_viewer.model, fragIds[fi]);

            if (mesh && mesh.geometry) {
                var vbr = new VertexBufferReader(mesh.geometry);
                vbr.enumGeomsForObject(_viewer.model.reverseMapDbId(result.dbId), gc);
            }
        }

        this.finishSnapping2D(gc, intersectPoint);

        // Snap the unsnapped point only if the snapping fails
        if(!_isSnapped && _snapToPixel) {
            _isSnapped = true;
            _snapResult.geomType = SnapType.RASTER_PIXEL;
            _snapResult.geomVertex = intersectPoint;
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

    this.snapping2DOverlay = function(intersectPoint, meshes, filter, detectRadius) {
        _snapResult.hasTopology = false;
        _snapResult.intersectPoint = intersectPoint;
        _snapResult.radius = detectRadius || this.setDetectRadius(intersectPoint);
        
        var gc = new GeometryCallback(_viewer, this, _snapResult.radius);
             
        for (var i=0; i<meshes.length; i++) {
            var mesh = meshes[i];
            var vbr = new VertexBufferReader(mesh.geometry);
            vbr.enumGeoms(filter, gc);
        }
         
        this.finishSnapping2D(gc, intersectPoint);
    }

    // Performs 2D snapping to segments based on an enumSegments() callback, which enumerates all segments
    // within in a given bbox in model-space.
    //  @param {Vector3}                          intersectPoint (3D with z=0)
    //  @param {function(minx, miny, maxx, maxy)} enumSegments
    this.snapping2DWithSegmentEnum = function(intersectPoint, enumSegments) {

        _snapResult.hasTopology = false;
        _snapResult.intersectPoint = intersectPoint;
        _snapResult.radius = this.setDetectRadius(intersectPoint);

        var gc = new GeometryCallback(_viewer, this, _snapResult.radius);

        // enum all segments within the snapRadius around intersectPoint
        var minx = intersectPoint.x - _snapResult.radius;
        var miny = intersectPoint.y - _snapResult.radius;
        var maxx = intersectPoint.x + _snapResult.radius;
        var maxy = intersectPoint.y + _snapResult.radius;
        enumSegments(minx, miny, maxx, maxy, gc);

        this.finishSnapping2D(gc, intersectPoint);
    }

    // Finish 2D snapping operation - assuming that all candidate geometry for snapping has been processed by the geometryCallback gc already.
    this.finishSnapping2D = function(gc, intersectPoint) {

        // When restricting to a single viewport, exclude candidates of all other viewports
        if (_forcedVpId !== null) {
            const isSameViewport = c => (c.viewportId === _forcedVpId);
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

            if (intersectPoint.distanceTo(gc.circularArc.vertices[0]) < _snapResult.radius) {

                _snapResult.geomVertex = gc.circularArc.vertices[0];
                _snapResult.geomType = SnapType.SNAP_VERTEX;
            }
            else if (intersectPoint.distanceTo(gc.circularArc.vertices[gc.circularArc.vertices.length - 1]) < _snapResult.radius) {

                _snapResult.geomVertex = gc.circularArc.vertices[gc.circularArc.vertices.length - 1];
                _snapResult.geomType = SnapType.SNAP_VERTEX;
            }
            else {

                this.lineStripToPieces(gc.circularArc);
                _snapResult.geomEdge = gc.circularArc;
                _snapResult.circularArcCenter = gc.circularArcCenter;
                _snapResult.circularArcRadius = gc.circularArcRadius;
                _snapResult.geomType = SnapType.SNAP_CIRCULARARC;
            }

            _isSnapped = true;


        }
        else if (gc.ellipticalArc) {

            _snapResult.viewportIndex2d = gc.vpIdElliptical;

            // Only snap the geometries which belong to the same viewport as the first selection
            if (_forcedVpId !== null && _forcedVpId !== _snapResult.viewportIndex2d)
                return;

            if (intersectPoint.distanceTo(gc.ellipticalArc.vertices[0]) < _snapResult.radius) {

                _snapResult.geomVertex = gc.ellipticalArc.vertices[0];
                _snapResult.geomType = SnapType.SNAP_VERTEX;
            }
            else if (intersectPoint.distanceTo(gc.ellipticalArc.vertices[gc.ellipticalArc.vertices.length - 1]) < _snapResult.radius) {

                _snapResult.geomVertex = gc.ellipticalArc.vertices[gc.ellipticalArc.vertices.length - 1];
                _snapResult.geomType = SnapType.SNAP_VERTEX;
            }
            else {

                this.lineStripToPieces(gc.ellipticalArc);
                _snapResult.geomEdge = gc.ellipticalArc;
                // Before we have measure design for elliptical arc, measure the center for now
                _snapResult.circularArcCenter = gc.ellipticalArcCenter;
                _snapResult.circularArcRadius = null;
                _snapResult.geomType = SnapType.SNAP_CIRCULARARC;
            }

            _isSnapped = true;

        }
        else if (gc.lineGeom.vertices.length) {

            _snapResult.viewportIndex2d = gc.vpIdLine;

            // Only snap the geometries which belong to the same viewport as the first selection
            if (_forcedVpId !== null && _forcedVpId !== _snapResult.viewportIndex2d)
                return;

            // Always expose edge segment - no matter whether we snap to the edge or one of its vertices.
            // This allows us to combine it with other snap constraints later - as done by Edit2D.
            _snapResult.geomEdge = gc.lineGeom;

            if (this.markupMode) {  // Markup mode
                var start = gc.lineGeom.vertices[0];
                var end = gc.lineGeom.vertices[1];
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
                }
                else if (sd < _snapResult.radius) {
                    _snapResult.geomVertex = start;
                    _snapResult.geomType = SnapType.SNAP_VERTEX;
                }
                else if (ed < _snapResult.radius) {
                    _snapResult.geomVertex = end;
                    _snapResult.geomType = SnapType.SNAP_VERTEX;
                }
                else {
                    _snapResult.geomType = SnapType.SNAP_EDGE;
                }

                // Circle center
                if (gc.lineGeom.vertices[0].distanceTo(gc.lineGeom.vertices[1]) < EPSILON) {
                    _snapResult.geomType = SnapType.SNAP_CIRCLE_CENTER;
                }
            }
            else {  // Measure mode
                if (intersectPoint.distanceTo(gc.lineGeom.vertices[0]) < _snapResult.radius) {

                    if (gc.lineGeom.vertices[0].distanceTo(gc.lineGeom.vertices[1]) < EPSILON) {
                        _snapResult.geomType = SnapType.SNAP_CIRCLE_CENTER;
                    } else {
                        _snapResult.geomType = SnapType.SNAP_VERTEX;
                    }

                    _snapResult.geomVertex = gc.lineGeom.vertices[0];
                }
                else if ((_options.forceSnapVertices || (intersectPoint.distanceTo(gc.lineGeom.vertices[1]) < _snapResult.radius))) {

                    _snapResult.geomVertex = gc.lineGeom.vertices[1];
                    _snapResult.geomType = SnapType.SNAP_VERTEX;
                }
                else {
                    _snapResult.geomType = SnapType.SNAP_EDGE;
                }
            }

            _isSnapped = true;
        }
    };

    this.snappingLeaflet = function(result) {
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

    this.snapMidpoint = function() {
        _snapResult.isMidpoint = false;

        // Snap midpoint for edge
        if (_isSnapped) {
            if (_snapResult.geomType === SnapType.SNAP_EDGE) {
                var edge = _snapResult.geomEdge;
                var p1 = edge.vertices[0];
                var p2 = edge.vertices[1];

                var midpoint = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);

                if (_snapResult.intersectPoint.distanceTo(midpoint) < 2 * _snapResult.radius) {
                    _snapResult.geomVertex = midpoint;
                    _snapResult.geomType = SnapType.SNAP_MIDPOINT;
                }
            }
        }
    };

    this.setPerpendicular = function(isPerpendicular) {
        _snapResult.isPerpendicular = isPerpendicular;
    };

    this.lineStripToPieces = function(geom) {

        var vertices = geom.vertices;
        for (var i = vertices.length - 2; i > 0; i--) {
            vertices.splice(i, 0, vertices[i]);
        }
    };

    this.setDetectRadius = function(point) {

        var navapi = _viewer.navigation;
        var camera = navapi.getCamera();
        var position = navapi.getPosition();

        var p = point.clone();

        var distance = camera.isPerspective ? p.sub(position).length()
            : navapi.getEyeVector().length();

        var fov = navapi.getVerticalFov();
        var worldHeight = 2.0 * distance * Math.tan(THREE.Math.degToRad(fov * 0.5));

        var viewport = navapi.getScreenViewport();
        var _window = this.getWindow();
        var devicePixelRatio = _window.devicePixelRatio || 1;
        var radius = this.detectRadiusInPixels * worldHeight / (viewport.height * devicePixelRatio);

        return radius;
    };

    this.handleButtonDown = function (event, button) {
        _isDragging = true;
        return false;
    };

    this.handleButtonUp = function (event, button) {
        _isDragging = false;
        return false;
    };

    this.handleMouseMove = function (event) {

        if (_isDragging)
            return false;

        this.onMouseMove({ 
            x: event.canvasX, 
            y: event.canvasY 
        });

        return false;
    };

    this.handleSingleTap = function(event) {

        return this.handleMouseMove(event);
    };

    this.handlePressHold = function (event) {
        
        if (isMobileDevice()) {
            switch( event.type )
            {
                case "press":
                    _isPressing = true;
                    this.onMouseMove({x: event.canvasX, y: event.canvasY});
                    break;

                case "pressup":
                    this.onMouseMove({x: event.canvasX, y: event.canvasY});
                    _isPressing = false;
                    break;
            }
        }
        return false;

    };

    this.handleGesture = function( event )
    {   
        if (isMobileDevice()) {
            if (_isPressing) {
                switch( event.type )
                {
                    case "dragstart":
                        this.onMouseMove({x: event.canvasX, y: event.canvasY});
                        break;

                    case "dragmove":
                        this.onMouseMove({x: event.canvasX, y: event.canvasY});
                        break;

                    case "dragend":
                        this.onMouseMove({x: event.canvasX, y: event.canvasY});
                        _isPressing = false;
                        break;

                    case "pinchstart":
                        
                        break;

                    case "pinchmove":
                        break;

                    case "pinchend":
                        break;
                }
            }
        }

        return false;
    };

    /**
     * Handler to mouse move events, used to snap in markup edit mode.
     * @private
     */
    this.onMouseDown = function(mousePosition) {
        return this.onMouseMove(mousePosition);
    };

    /**
     * Handler to mouse move events, used to snap in markup edit mode.
     * @private
     */
    this.onMouseMove = function(mousePosition) {

        this.clearSnapped();

        var result = _viewer.impl.snappingHitTest(mousePosition.x, mousePosition.y, false);

        if(!result && _snapToPixel) {
            var vpVec = _viewer.impl.clientToViewport(mousePosition.x, mousePosition.y);
            let point = _viewer.impl.intersectGroundViewport(vpVec);
            result = { intersectPoint : point };
        }

        if (!result || !result.intersectPoint) 
            return false;

        // 3D Snapping
        if (result.face) {
            this.snapping3D(result);
        }
        // 2D Snapping
        else if (result.dbId || result.dbId === 0){
            this.snapping2D(result);
        }
        // PDF - Leaflet Snapping
        else {
            this.snappingLeaflet(result);
        }

        this.snapMidpoint();

        return true;
    };
};

av.GlobalManagerMixin.call(Snapper.prototype);
