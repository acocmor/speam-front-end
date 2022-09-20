
// Collection of static math functions used for snapping implementation




// Sample a single point from an ellipse with...
//  @param {number} cx, cy               - center
//  @param {number} rx, ry               - radii in x/y axis
//  @param {number} startAngle, endAngle - ccw angles in radians. 0 corresponds to (xRadius, 0)
//  @param {number} t                    - sampling position along ellipse. 0 => startAngle, 1 = endAngle
//  @param {Vector2} [outResult]
//  @returns {Vector2}
export const sampleEllipsePoint = (cx, cy, rx, ry, startAngle, endAngle, t, outResult) => {
    
    outResult = outResult || new THREE.Vector2();

    let deltaAngle = endAngle - startAngle;
        
    // delta should...
    //  - always be positive, because we want to draw counterclockwise
    //  - always be <2Pi, because we only want to connect startAngle/endAngle - not draw the whole ellipse.
    // This is essential if the arc passes the 2Pi boundary, e.g., starting at 350 degree and ending at 10.    
    if (deltaAngle < 0)            deltaAngle += Math.PI * 2;
    if (deltaAngle > Math.PI * 2 ) deltaAngle -= Math.PI * 2;

    let angle = startAngle + t * deltaAngle;

    outResult.x = cx + rx * Math.cos(angle);
    outResult.y = cy + ry * Math.sin(angle);

    return outResult;
};

// Force angle to be within [0, 2Pi[
export const normalizeAngle = (angle) => {
    // Scale [0, 2Pi] to [0,1]
    angle /= 2.0 * Math.PI;

    // Remove integer part
    angle -= Math.trunc(angle);

    // Angle is either in [0,1] or was negative. In the latter case,
    // it is in [-1, 0] now and we add 1 to bring it to [0,1] as well.
    if (angle < 0) {
        angle += 1.0;
    }

    // Scale back to [0, 2Pi] range
    return angle * 2.0 * Math.PI;
};

// Given start/end angle of an arc, this function checks whether angle is within the arc. 
// All angles are ccw in radians. We assume the arc to be running ccw. Note that start may be > end if the arc range contains a 2*Pi mulitple.
export const angleInsideArc = (angle, start, end) => {

    // ensure 0 <= a < 2Pi for all angles
    angle = normalizeAngle(angle);
    start = normalizeAngle(start);
    end   = normalizeAngle(end);

    if (start < end) {
        return angle >= start && angle <= end;
    }

    // If start > end, we are crossing a full-circle boundary. So, the range between [start, end] is actually
    // the circle part outside the arc.
    // For start = end, the arc is the whole circle and the result will always be true.
    return angle >= start || angle <= end;
};

// Find closest point to p on a circular arc. 
//  @param {Vector2} center
//  @param {number} radius
//  @param {number} startAngle, endAngle - ccw angles in radians. 0 means direction x+
//  @param {Vector2} [outPoint]
//  @param {Vector2}
export const nearestPointOnCircularArc = (p, center, radius, startAngle, endAngle, outPoint) => {

    outPoint = outPoint || new THREE.Vector2();

    // get normalized direction from circle center to p.
    // dir = (p-center).normalized()
    const dir = outPoint.copy(p).sub(center).normalize();

    // If the point is within the arc, we are done
    const angle = Math.atan2(dir.y, dir.x);
    const insideArc = angleInsideArc(angle, startAngle, endAngle);
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
    const pStart = sampleEllipsePoint(center.x, center.y, radius, radius, startAngle, endAngle, 0.0);
    const pEnd   = sampleEllipsePoint(center.x, center.y, radius, radius, startAngle, endAngle, 1.0);

    const d2Start = pStart.distanceToSquared(p);
    const d2End   = pEnd.distanceToSquared(p);
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
export const intersectLines = (p1, p2, p3, p4, checkInsideSegment, outPoint, epsilon = 0.00001) => {
    
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



