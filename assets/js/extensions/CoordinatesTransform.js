function GeometryCallback(viewer) {
    this.viewer = viewer;
}

function myPageToModelConversion( x1, y1, x2, y2, vpId ) {


    var vpXform = viewer.model.getPageToModelTransform(vpId);

    var modelPt1 = new THREE.Vector3().set(x1, y1, 0).applyMatrix4(vpXform);
    var modelPt2 = new THREE.Vector3().set(x2, y2, 0).applyMatrix4(vpXform);

    var pointX1 = modelPt1.x;
    var pointY1 = modelPt1.y;
    var pointX2 = modelPt2.x;
    var pointY2 = modelPt2.y;

    // // Simple Distance Formula 
    // var a = pointX2 - pointX1
    // var b = pointY2 - pointY1
    // var c = Math.sqrt( a*a + b*b );

    var newmatrix = new THREE.Matrix4();
    newmatrix.getInverse(vpXform);

    var pt = modelPt1.applyMatrix4(newmatrix);
    console.log("Origin X1: " , x1, 'Y1', y1);
    console.log("Origin X2: " , x2, 'Y2', y2);
    
    console.log("model to viewer " , pt);
    
    var cLinePoints = {
        pointX1,
        pointY1,
        pointX2,
        pointY2
    }

    return cLinePoints;
};

GeometryCallback.prototype.onLineSegment = function(x1, y1, x2, y2, vpId) {
    var linePoints = myPageToModelConversion(x1, y1, x2, y2, vpId)

    switch (true) {
        case (lineCount === 1):
            LotsGeometry.line = linePoints;
            console.log('Line segment vertices in CAD coordinate system', LotsGeometry.line);
        break;
        case (lineCount === 2):
            LotsGeometry.line2 = linePoints;
            console.log('Line segment vertices in CAD coordinate system', LotsGeometry.line2);
        break;
        case (lineCount === 3):
            LotsGeometry.line3 = linePoints;
            console.log('Line segment vertices in CAD coordinate system', LotsGeometry.line3);
        break;
        case (lineCount === 4):
            LotsGeometry.line4 = linePoints;
            console.log('Line segment vertices in CAD coordinate system', LotsGeometry.line4);
        break;
        case (lineCount === 5):
            if(!LotsGeometry.line === linePoints) {
                LotsGeometry.line5 = linePoints;
                console.log('Line segment vertices in CAD coordinate system', LotsGeometry.line5);
            }
            
        break;
        default:
            console.log('out of lotsgem case');
        break;
    }

    lineCount++;

}

GeometryCallback.prototype.onCircularArc = function(cx, cy, start, end, radius, vpId) {
    var vpXform = this.viewer.model.getPageToModelTransform(vpId);
    //if in CAD coordinate system, applyMatrix4 with vpXform
    var center = new THREE.Vector3().set(cx, cy, 0).applyMatrix4(vpXform);

    console.log('CircleArc segment: ', {
        centerX: center.x,
        centerY: center.y,
        radius: radius,
        startAngle: start,
        endAngle: end
    });
};

GeometryCallback.prototype.onEllipticalArc = function(cx, cy, start, end, major, minor, tilt, vpId) {
    var vpXform = this.viewer.model.getPageToModelTransform(vpId);
    //if in CAD coordinate system, applyMatrix4 with vpXform
    var center = new THREE.Vector3().set(cx, cy, 0).applyMatrix4(vpXform);

    console.log('EllipticalArc segment: ', {
        centerX: center.x,
        centerY: center.y,
        major: major,
        minor: minor,
        tilt: tilt,
        startAngle: start,
        endAngle: end
    });
};