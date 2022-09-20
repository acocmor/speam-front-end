function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
import { Polyline, Style } from './EditShapes.js';
import { Math2D } from './Math2D.js';

// AngleSnapper is responsible for snapping based on angles and alignment on hover while choosing the position of a vertex. 
//
// If pMov is the vertex being moved, the snapping behavior includes:
//
//  1. Angle to previous edge: Snap if edge ending at pMov forms a snapAngle (0, 45, 90,...) with its predecessor edge.
//
//  2. Angle to next edge: Snap if the edge starting at pMov forms a snapAngle with its successor edge.
//
//  3. Collinear Align: Snap if for pMov is collinear with any (non-adjacent) edge.
//
//  4. Vertical Align: Snap if pMov is collinear with the edge normal at start/center/end of any non-adjacent edge.
//

// A SnapLine is a line that we consider for snapping. 
var SnapLine = /*#__PURE__*/function () {

  function SnapLine(a, b) {_classCallCheck(this, SnapLine);

    // start and end point
    this.a = a.clone();
    this.b = b.clone();

    // normalized edge direction
    this.dir = Math2D.getEdgeDirection(a, b);
  }

  // Check for intersection with another SnapLine. If found, intersection point is written to outPoint.
  // @returns {bool} true on success
  _createClass(SnapLine, [{ key: "intersect", value: function intersect(line, outPoint) {
      return Math2D.intersectLines(this.a, this.dir, line.a, line.dir, outPoint);
    }

    // project point to SnapLine
  }, { key: "snapToLine", value: function snapToLine(p) {
      Math2D.projectToLine(p, this.a, this.dir);
    }

    // Checks if SnapLine is close enough to p to allow snapping. snapRadius is in layer-coords.
  }, { key: "isUsable", value: function isUsable(p, snapRadius) {
      return Math2D.pointLineDistance(p, this.a, this.dir) < snapRadius;
    }

    // Checks if a SnapLine is (approx.) identical with another one
  }, { key: "isEqual", value: function isEqual(snapLine, precision) {
      return Math2D.collinear(this.a, this.dir, snapLine.a, snapLine.dir, precision);
    } }]);return SnapLine;}();
;

// Snap position based on 1 or 2 SnapLines.
//  @param {Vector2}  pos         - Initial position in layer coords. Modified in-place
//  @param {SnapLine} snapLine1   - First line to snap to
//  @param {SnapLine} [snapLine2] - If there are 2 SnapLines, we snap to the intersection of both lines.
// Preconditions:
//  - SnapLine1: Is close to pos (wrt. to snap tolerance)
//  - SnapLine2: If existing, its intersection with SnapLine1 is close to the position  
var snapToLines = function snapToLines(pos, snapLine1, snapLine2) {

  // No snaplines => keep original pos
  if (!snapLine1 && !snapLine2) {
    return;
  }

  // If only SnapLine1 exists
  if (!snapLine2) {
    // project pos to snapLine1
    snapLine1.snapToLine(pos);
    return;
  }

  // If only snapLine2 exists
  if (!snapLine1) {
    // project pos to snapLine2
    snapLine2.snapToLine(pos);
    return;
  }

  // Snap pos to line intersection.
  snapLine1.intersect(snapLine2, pos);
};

// Get point i within a polygon, whereby indices outside [0, ..., this.poly.length-1] are auto-corrected using modulo.
// Accepts negative indices up to -this.poly.length.
var getPointMod = function getPointMod(poly, index) {
  index = (index + poly.vertexCount) % poly.vertexCount;
  return poly.getPoint(index);
};

// Returns an array of SnapLines used to align with each edge of the given polygon.
//  @param {Polygon} poly
//  @param {vIndex}  vIndex - index of the vertex being moved. We exclude edges directly adjacent to this vertex, because they are not fixed.
var findSnapLines = function findSnapLines(poly, vIndex) {

  // tmp vectors
  var normal = new THREE.Vector2();
  var center = new THREE.Vector2();
  var pEnd = new THREE.Vector2();

  var snapLines = [];

  // Given an edge of a polygon/polyline, this function collects snapping lines for alignment with this this edge.
  // and adds it to snapLines.
  // Generated snapLines are:
  //  - Line spanned by the edge
  //  - Orthogonal lines at start, center, and end point.
  var addEdgeSnapLines = function addEdgeSnapLines(a, b) {

    // add line spanned by the edge
    snapLines.push(new SnapLine(a, b));

    // get edge normal and center point
    normal = Math2D.turnLeft(Math2D.getEdgeDirection(a, b, normal));
    center = Math2D.getEdgeCenter(a, b, center);

    // add orthogonal line add edge start
    pEnd.copy(a).add(normal); // pEnd = p1 + normal
    snapLines.push(new SnapLine(a, pEnd));

    // add orthogonal line at edge center
    pEnd.copy(center).add(normal); // pEnd = center + normal
    snapLines.push(new SnapLine(center, pEnd));

    // add orthogonal line at edge end
    pEnd.copy(b).add(normal); // pEnd = p2 + normal
    snapLines.push(new SnapLine(b, pEnd));
  };

  poly.enumEdges(function (a, b, ia, ib) {

    // Exclude edges containing the moved vertex: These edges are not fixed yet and should not
    // be used for alignment.
    if (ia == vIndex || ib == vIndex) {
      return;
    }

    // skip edge if degenerate
    if (Math2D.edgeIsDegenerated(a, b)) {
      return;
    }

    addEdgeSnapLines(a, b);
  });
  return snapLines;
};

// Checks if the given SnapLine candidate is suitable to be used - assuming that another snapLine1 was already chosen.
// A candidate is only suitable if...
//  1. The intersection with snapLine1 is within snapping tolerance
//  2. The angle formed with snapLine1 is as closer to 90° than all other candidates. This makes sure that we rather 
//     snap to orthogonal SnapLines than trying to snap to two nearly parallel ones.
// 
//  @param {SnapLine} candidate       - SnapLine candidates to be compared    
//  @param {SnapLine} [bestCandidate] - Best candidate found so far (may be null)
//  @param {SnapLine} snapLine1       - First SnapLine that has already been chosen to snap to.
//  @param {Vector2}  pos             - position to be snapped
//  @param {number}   snapRadius      - in layer coords
//  @returns {SnapLine} Returns the best candidate - either bestCandidate or snapLineCandidate
var checkSecondSnapCandidate = function checkSecondSnapCandidate(candidate, bestCandidate, snapLine1, pos, snapRadius) {

  // If candidate does not intersect snapLine1, we cannot use it.
  var pIntersect = new THREE.Vector2();
  if (!snapLine1.intersect(candidate, pIntersect)) {
    return bestCandidate;
  }

  // If intersection point is outside snapRadius, discard candidate
  if (pIntersect.distanceTo(pos) > snapRadius) {
    return bestCandidate;
  }

  // If there is no competitor, the candidate made it.
  if (!bestCandidate) {
    return candidate;
  }

  // Check which of the candidates is "less parallel" to snapLine1
  var dp1 = Math.abs(snapLine1.dir.dot(candidate.dir));
  var dp2 = Math.abs(snapLine1.dir.dot(bestCandidate.dir));
  return dp1 > dp2 ? candidate : bestCandidate;
};

var xAxis = new THREE.Vector2(1, 0);

var av = Autodesk.Viewing;
// AngleSnapper helps to draw right angles, parallel lines etc.
var AngleSnapper = /*#__PURE__*/function () {

  function AngleSnapper(gizmoLayer) {_classCallCheck(this, AngleSnapper);
    // Polygon/Polyline being edited. We assume that it includes the vertex being moved.
    this.poly = null;

    // Index of the vertex in this.poly that is beging moved.
    this.vIndex = -1;

    // If an edge forms one of these angles with the previous one, we display the helper line and snap to the angle
    this.snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];

    // We consider an angle "close to" another one if they differ by this value or less.
    this.snapAngleTolerance = 2; // in degrees

    // Allow snapping to lines within x pixels.
    this.snapRadius = 10;

    this.gizmoLayer = gizmoLayer;
    this.setGlobalManager(gizmoLayer.globalManager);

    // reused tmp points
    this.movedPoint = new THREE.Vector2(); // the vertex being moved
    this.prevPoint = new THREE.Vector2(); // the vertex before movedPoint
    this.prevPoint2 = new THREE.Vector2(); // the vertex before prevPoint

    this.edgeDir = new THREE.Vector2(); // direction of new edge ending at movedPoint
    this.alignAxis = new THREE.Vector2(); // direction that we align to: Either the direction of the previous edge or the x-axis

    // Array of snapLines to align a vertex position with other edges
    this.edgeSnapLines = [];

    // SnapLines that contributed to last snapping call. Used to update the SnapLine gizmos.
    this.snapLine1 = null;
    this.snapLine2 = null;

    // Optional: External line constraint. This is used if we already snapped to a line geometry and
    //           want to combine the snap with angle snapping.
    this.snapLineExt = null;

    // Gizmos to display the lines considered for snapping
    this.snapLineStyle = new Style({
      lineColor: 'rgb(255, 0, 0)',
      lineWidth: 1.0,
      lineStyle: 10 });

    this.snapLineGizmos = [];
    this.snapLineGizmosUsed = 0;
  }_createClass(AngleSnapper, [{ key: "onSetGlobalManager", value: function onSetGlobalManager(

    globalManager) {
      this.globalManager = globalManager;
      this.snapLineGizmos.forEach(function (g) {return g.setGloblaManager(globalManager);});
    } }, { key: "acquireSnapLineGizmo", value: function acquireSnapLineGizmo()

    {
      var gizmo = this.snapLineGizmos[this.snapLineGizmosUsed];
      if (!gizmo) {
        // Create new line gizmo
        gizmo = new Polyline([], this.snapLineStyle);
        gizmo.setGlobalManager(this.globalManager);
        this.snapLineGizmos[this.snapLineGizmosUsed] = gizmo;
      }
      this.snapLineGizmosUsed++;
      return gizmo;
    } }, { key: "clearSnappingGizmos", value: function clearSnappingGizmos()

    {var _this = this;
      var removeGizmo = function removeGizmo(g) {return _this.gizmoLayer.removeShape(g);};
      this.snapLineGizmos.forEach(removeGizmo);
      this.snapLineGizmosUsed = 0;
    }

    // Configures snapping to align to edges of the given polygon/polyline
    //  @param {Polygon|Polyline} poly   - shape being edited. Expected to include the vertex being moved.
    //  @param {number}           vIndex - index into poly that marks the vertex that is moved and to which snapping should be applied.
  }, { key: "startSnapping", value: function startSnapping(poly, vIndex) {
      this.poly = poly;
      this.vIndex = vIndex;

      // precompute snapLines for alignment. These don't change while moving a vertex.
      this.edgeSnapLines = findSnapLines(poly, vIndex);
    } }, { key: "stopSnapping", value: function stopSnapping()

    {

      this.poly = null;
      this.vIndex = -1;

      // Discard any outdated results and hide gizmos
      this.snapLine1 = null;
      this.snapLine2 = null;
      this.clearSnappingGizmos();
    }

    // Discard latest snapping results, but polygon, vIndex, and edge snapLines. This is used when temporarily hiding the SnapLines when
    // snapping while snapping is bypassed.
  }, { key: "clearSnappingResult", value: function clearSnappingResult() {
      this.snapLine1 = null;
      this.snapLine2 = null;
    } }, { key: "getPrevSnapLine",





    // Snap angles relative to previous edge: Return a snapLine if the edge being modified forms a snapAngle (e.g. 90 degrees) with the previous edge.
    //  @param {Vector2} pMov - point to be snapped
    //  @returns {null|SnapLine} Returns null if no SnapLine is within this.angleTolerance.
    value: function getPrevSnapLine(pMov) {

      // Get vertices one and two indices before the moved one.
      var pPrev = getPointMod(this.poly, this.vIndex - 1);
      var pPrev2 = getPointMod(this.poly, this.vIndex - 2);

      // Check angle between (pPrev, pMov) and its predecessor edge (pPrev2, pPrev)
      var alignAxis = Math2D.getEdgeDirection(pPrev2, pPrev);
      return this.computeAngleSnapLine(pMov, pPrev, alignAxis);
    }

    // Snap angles relative to previous edge: Return a snapLine if the edge being modified forms a snapAngle (e.g. 90 degrees) with the next edge.
    //  @param {Vector2} pMov - point to be snapped
    //  @returns {null|SnapLine} Returns null if no SnapLine is within this.angleTolerance.
  }, { key: "getNextSnapLine", value: function getNextSnapLine(pMov) {

      // When moving one of the last two vertices of a polyline, there is actually no "next edge", because start and end
      // vertex are not connected. Therefore, we skip snapping to "next edge" for this case.
      var ignoreNextEdge = this.poly.isPolyline() && this.vIndex >= this.poly.vertexCount - 2;
      if (ignoreNextEdge) {
        return null;
      }

      var pNext = getPointMod(this.poly, this.vIndex + 1);
      var pNext2 = getPointMod(this.poly, this.vIndex + 2);

      // Snap to angle wrt. to next edge: (only for polygons)
      //   Check angle between (pNext, pMov) and its successor edge (pNext, pNext2);
      var alignAxis = Math2D.getEdgeDirection(pNext, pNext2, alignAxis);
      return this.computeAngleSnapLine(pMov, pNext, alignAxis);
    }

    // Given a new position in layer-coords to be assigned to the moved vertex, this function checks if the adjacent edges of the moved
    // vertex are close to a snap angle. If so, the movedPoint is corrected to match the snap angle exactly.
    //  @param {Vector2} pMov - Position to be snapped
    //  @param {Object}  [lineConstraint] - Optional: External line-constraint {a,b}. If specified, we only allow snapping to
    //                                                intersections with angle snapLines and the line (lineConstraint.a, lineConstraint.b).
  }, { key: "snapToAngle", value: function snapToAngle(pMov, lineConstraint) {var _this2 = this;

      // Reset the two lines that we consider for snapping.
      this.snapLine1 = null;
      this.snapLine2 = null;

      // Create snapLine from external line constraint (if specified)
      this.snapLineExt = lineConstraint && new SnapLine(lineConstraint.a, lineConstraint.b);

      if (!this.active || this.poly.vertexCount <= 1) {
        return;
      }

      // Get point before the moved one.
      var pPrev = getPointMod(this.poly, this.vIndex - 1);

      // If we just have a single edge, we can only snap to angles relative to x-axis
      var isFirstEdge = this.poly.vertexCount == 2;
      if (isFirstEdge) {
        // Get closest angle-snap line relative to mainAxis (or null if no snapAngle is close enough)
        var snapAxis = this.computeAngleSnapLine(pMov, pPrev, xAxis);

        if (snapAxis && this.snapLineExt) {
          // If an external line constraint is set, snapAxis can only be considered as a secondary snap.
          // This means, we can only consider if it intersects with the costraint line and the intersection is close to pMov
          this.snapLine1 = checkSecondSnapCandidate(snapAxis, null, this.snapLineExt, pMov, snapRadiusLC);
        } else {
          // No other constraints. Just use the snapAxis (or no axis at all if snapAxis is null)
          this.snapLine1 = snapAxis;
        }

        snapToLines(pMov, this.snapLine1, this.snapLineExt);
        return;
      }

      var prevSnapLine = this.getPrevSnapLine(pMov);
      var nextSnapLine = this.getNextSnapLine(pMov);

      // get snapRadius in layer-coords. This is the maximum distance that we allow
      // between mouse pos and the final snap position that we obtain by projecting
      // to a SnapLine or by intersecting two SnapLines.
      var snapRadiusLC = this.snapRadius * this.gizmoLayer.getUnitsPerPixel();

      // Filter to lines that are close enough to pMov
      var snapLineUsable = function snapLineUsable(snapLine) {

        if (!snapLine) {
          return false;
        }

        if (_this2.snapLineExt) {
          // Consider line-constraint: Only accept snapLine if...
          //  1. ...it intersects constraint line
          //  2. ...intersection point is within snapRadius.
          return Boolean(checkSecondSnapCandidate(snapLine, null, _this2.snapLineExt, pMov, snapRadiusLC));
        }

        // No constraint: Accept any snapLines within snapRadius
        return snapLine.isUsable(pMov, snapRadiusLC);
      };

      var candidates = this.edgeSnapLines.filter(snapLineUsable);

      // Reject prevSnapLine/nextSnapLine if they are not usable
      prevSnapLine = snapLineUsable(prevSnapLine) && prevSnapLine;
      nextSnapLine = snapLineUsable(nextSnapLine) && nextSnapLine;

      // choose first snapLine
      this.snapLine1 = prevSnapLine || nextSnapLine || candidates[0];

      // Stop here if there is no snapping candidate at all
      if (!this.snapLine1) {
        return;
      }

      // If we have an external line constraint, we can only choose a single snapLine, because we already
      // have to intersect it with the external constraint line.
      if (this.snapLineExt) {
        return snapToLines(pMov, this.snapLine1, this.snapLineExt);
      }

      // If prev and next edge allow angle snapping, check if we can snap to both
      if (prevSnapLine && nextSnapLine) {
        this.snapLine2 = checkSecondSnapCandidate(nextSnapLine, null, this.snapLine1, pMov, snapRadiusLC);
      }

      // If prevEdge and nextEdge already gave us 2 SnapLines, give these two preference. Otherwise,
      // check if we can snap to another edge to be aligned with other edges.
      if (!this.snapLine2) {
        for (var i = 0; i < candidates.length; i++) {
          var c = candidates[i];
          this.snapLine2 = checkSecondSnapCandidate(c, this.snapLine2, this.snapLine1, pMov, snapRadiusLC);
        }
      }

      // We selected one or two SnapLines. Now, use them to decide snapped position
      return snapToLines(pMov, this.snapLine1, this.snapLine2);
    } }, { key: "isSnapped", value: function isSnapped()

    {
      return Boolean(this.snapLine1 || this.snapLine2);
    } }, { key: "updateSnapLineGizmos", value: function updateSnapLineGizmos(

    snappedPos) {var _this3 = this;

      // First, clear any outdated gizmos
      this.clearSnappingGizmos();

      if (!this.poly) {
        return;
      }

      // Collect all snapLines that we want to display
      //
      // Note that we don't just want to indicate SnapLines that actively affected the position,
      // but also the "accidentally" matched ones. E.g., if we snapped to a geometry intersection,
      // the actual snapping was not affected by angle snapping, but the resulting position may still
      // match with angle snapLines as well.
      var snapLinesToShow = [];

      // We consider the snapped position p to be "on a snapLine L" if the distance d(p,L) is within the tolerance below.
      var tolerance = 0.0001;
      var shouldBeShown = function shouldBeShown(sl) {return sl && sl.isUsable(snappedPos, tolerance);}; // Decides whether a SnapLine should be displayed

      // If we only have a single edge, angle snapping is only possible wrt. to main axes
      var isFirstEdge = this.poly.vertexCount == 2;

      // Collect SnapLines to display
      if (isFirstEdge) {
        // Just a single edge: Only snap if this first edge forms a snapping angle with x- or y-axis.
        var pPrev = getPointMod(this.poly, this.vIndex - 1);
        var snapAxis = this.computeAngleSnapLine(snappedPos, pPrev, xAxis);

        // Display snapAxis if the p is on this line
        if (snapAxis && shouldBeShown(snapAxis)) {
          snapLinesToShow.push(snapAxis);
        }
      } else {
        // Consider all edge snaplines that contain pSnappedPos
        snapLinesToShow = this.edgeSnapLines.filter(shouldBeShown);

        // Consider angles to previous and next edge
        var prevSnapLine = this.getPrevSnapLine(snappedPos);
        var nextSnapLine = this.getNextSnapLine(snappedPos);
        shouldBeShown(prevSnapLine) && snapLinesToShow.push(prevSnapLine);
        shouldBeShown(nextSnapLine) && snapLinesToShow.push(nextSnapLine);
      }

      // Eliminate duplicates: If a SnapLine is collinear with another one, displaying it would just cause artifacts.
      // Note: This is a brute-force n^2 loop. The number of SnapLines to display is usually small, so that this shouldn't be a problem.
      var isRelevant = function isRelevant(sl, index) {
        // Check if sl is a duplicate of any previous SnapLine
        var isDuplicate = false;
        for (var i = 0; i < index; i++) {
          var sl2 = snapLinesToShow[i];
          if (sl.isEqual(sl2, tolerance)) {
            isDuplicate = true;
            break;
          }
        }
        return !isDuplicate;
      };
      snapLinesToShow = snapLinesToShow.filter(isRelevant);

      // Choose SnapLineLength large enough to fill whole canvas
      var canvas = this.gizmoLayer.viewer.canvas;
      var diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      var snapLineLength = this.gizmoLayer.getUnitsPerPixel() * diag;

      // A SnapLine indicator is constructed as follows:
      //  - It starts at the snapLine start point, which "explains where the SnapLine comes from". 
      //    This may be start/center/end of another edge.
      //  - It should always point towards the moved vertex (note that an original edge normal may point away from the moved vertex)
      //  - It is enlarged to overshoot pMov 
      var showSnapLine = function showSnapLine(line, gizmo) {
        if (!line) {
          return;
        }

        var a = line.a;

        // Let line start at a, point towards dir, and be long enough to leave screen
        gizmo.makeLine(
        a.x - snapLineLength * line.dir.x,
        a.y - snapLineLength * line.dir.y,
        a.x + snapLineLength * line.dir.x,
        a.y + snapLineLength * line.dir.y);

        _this3.gizmoLayer.addShape(gizmo);
      };

      // Add lineGizmo for each SnapLine to be displayed
      for (var i = 0; i < snapLinesToShow.length; i++) {
        var snapLine = snapLinesToShow[i];
        var gizmo = this.acquireSnapLineGizmo();
        showSnapLine(snapLine, gizmo);
      }
    } }, { key: "dtor", value: function dtor()

    {
      this.clearSnapping();
    }

    // Checks if the angle between edge (pPrev, p) and alignment direction is close to a snapping angle.
    // If so, it returns a SnapLine from pPrev towards the snapped direction, otherwise null.
    //  @param {Vector2} p              - vertex being moved
    //  @param {Vector2} pPrev          - vertex connected to p
    //  @param {Vector2} alignAxis      - direction that we align to. Must be normalized.
  }, { key: "computeAngleSnapLine", value: function computeAngleSnapLine(p, pPrev, alignAxis) {

      // Don't try angle snapping with degenerated edges
      if (Math2D.edgeIsDegenerated(pPrev, p)) {
        return null;
      }

      // get direction of new edge (ending at pMov)
      var edgeDir = p.clone().sub(pPrev);

      // Compute angle between new edge and alignment direction
      var angle = THREE.Math.radToDeg(Math2D.angleBetweenDirections(edgeDir, alignAxis));

      // Check if angle matches with any index in snapAngles array
      var snapIndex = -1;
      for (var i = 0; i < this.snapAngles.length; i++) {
        var _snapAngle = this.snapAngles[i];

        var dif = Math.abs(_snapAngle - angle);
        if (dif < this.snapAngleTolerance) {
          snapIndex = i;
          break;
        }
      }

      // Stop here if no snapAngle is found
      if (snapIndex == -1) {
        return null;
      }

      // Rotate alignment axis by selected snapAngle
      var snapAngle = THREE.Math.degToRad(this.snapAngles[snapIndex]);
      var snapDir = Math2D.rotateAround(alignAxis.clone(), snapAngle);

      // scale snapLine direction to the same length as (pPrev, p)
      var dist = pPrev.distanceTo(p);
      var snapLineEnd = snapDir.multiplyScalar(dist).add(pPrev);

      // Return snapline from pPrev pointing towards snapped direction
      return new SnapLine(pPrev, snapLineEnd);
    } }, { key: "active", get: function get() {return this.poly;} }]);return AngleSnapper;}();export { AngleSnapper as default };


av.GlobalManagerMixin.call(AngleSnapper.prototype);