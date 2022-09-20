//copy from VertexBufferReader.js
var VBB_GT_TRIANGLE_INDEXED = 0,
    VBB_GT_LINE_SEGMENT     = 1,
    VBB_GT_ARC_CIRCULAR     = 2,
    VBB_GT_ARC_ELLIPTICAL   = 3,
    VBB_GT_TEX_QUAD         = 4,
    VBB_GT_ONE_TRIANGLE     = 5;

var TAU = Math.PI * 2;
//end copy

//copy some codes from VertexBufferReader.enumGeomsForObject

// CONST CHECK ACTIVE MOVE

let isActiveMove = false;

Autodesk.Viewing.Private.VertexBufferReader.prototype.transformObject = function(dbId,trans){

    if (this.useInstancing) {

        ////////
        //TODO....
        ////////
    }
    else {

        var i = 0;

        //check the continuous triangles, to avoid double translating the same vertex of triangle
        var ibArrayToMove =[];

        while (i < this.ib.length) {
            var vi = this.ib[i];
            var flag = this.getVertexFlagsAt(vi);

            //var vertexId    = (flag >>  0) & 0xff;        //  8 bit
            var geomType    = (flag >>  8) & 0xff;        //  8 bit
            //var linePattern = (flag >> 16) & 0xff;        //  8 bit
            var layerId     = this.getLayerIndexAt(vi);    // 16 bit
            var vpId        = this.getViewportIndexAt(vi); // 16 bit

            var visible = this.getDbIdAt(vi) === dbId;

            if (geomType === VBB_GT_TRIANGLE_INDEXED) {

                //Triangles are encoded in three vertices (like a simple mesh) instead of 4 like everything else 

                if (visible) {
                    ibArrayToMove.push(this.ib[i]);
                    ibArrayToMove.push(this.ib[i+1]);
                    ibArrayToMove.push(this.ib[i+2]);

                    //do not translate at this moment because we have not yet known if the next primitive is
                    //one more triangle
                }

                //Advance to the next primitive
                i += 3;

            } else {

                if(ibArrayToMove.length>0){
                    //remove duplicated vertices 
                    let unique_ibArrayToMove = [...new Set(ibArrayToMove)];
                    //translate all vertices now
                    this.transformTriangleIndexed(unique_ibArrayToMove, layerId, vpId, trans);

                    //reset the array for next continuous triangle
                    //good way to clear an array? no memory leak?
                    //see https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
                    ibArrayToMove=[];
                }


                if (visible) {

                    switch (geomType) {
                        case VBB_GT_LINE_SEGMENT:   this.transformLine( vi, layerId, vpId,trans);break;
                        case VBB_GT_ARC_CIRCULAR:   this.transformCircleArc(  vi, layerId, vpId, trans); break;
                        case VBB_GT_ARC_ELLIPTICAL:    //TODO break;
                        //case VBB_GT_TEX_QUAD:            //TODO break;
                        //case VBB_GT_ONE_TRIANGLE:        //TODO break;
                        default:                         break;
                    }
                }

                //Skip duplicate vertices (when not using instancing and the geometry is not a simple polytriangle,
                //each vertex is listed four times with a different vertexId flag
                i += 6;
            }

        }
    }


    //update the source buffer of the vertex
    this.vb = this.vbf.buffer;
}

//custom function: transform vertex of a line
//layer, vpId: reserved arguments
Autodesk.Viewing.Private.VertexBufferReader.prototype.transformLine = function(vindex, layer, vpId,trans){

    var baseOffset = this.stride * vindex;

    //For a line segment (on desktop machine) 
    //there will be four vertices that make a quad which corresponds to the line segment. 

    var i = 0;
    while(i<4){
        console.log('x:' + this.vbf[baseOffset + i*this.stride])
        console.log('y:' + this.vbf[baseOffset + i*this.stride + 1])
        this.vbf[baseOffset + i*this.stride] += trans.x;
        this.vbf[baseOffset + i*this.stride + 1] += trans.y;
        i++;
    }
}

//custom function: transform vertex of a circle arc & circle 
//layer, vpId: reserved arguments 
Autodesk.Viewing.Private.VertexBufferReader.prototype.transformCircleArc = function(vindex, layer, vpId,trans){

    var baseOffset = this.stride * vindex;

    //arc or circle is also fit by line segments.
    // For a line segment (on desktop machine) 
    //there will be four vertices that make a quad which corresponds to the line segment. 
    var i = 0;
    while(i<4){
        this.vbf[baseOffset + i*this.stride] += trans.x;
        this.vbf[baseOffset + i*this.stride + 1] += trans.y;
        i++;
    }
}


//custom function: transform vertex of triangles
//layer, vpId: reserved arguments 
Autodesk.Viewing.Private.VertexBufferReader.prototype.transformTriangleIndexed =
    function(ibArray, layer, vpId, trans)
    {
        var k = 0;
        while(k<ibArray.length){
            var baseOffset = this.stride * ibArray[k];
            this.vbf[baseOffset] += trans.x;
            this.vbf[baseOffset + 1] += trans.y;
            k++;
        }

    };

function My2DMove(viewer, options) {

    Autodesk.Viewing.Extension.call(this, viewer, options)

    var _viewer = this.viewer
    var _container = _viewer.canvas.parentElement

    var indicatorLines = null
    var indicatorLayerName = 'indicatorLayer'
    var indicatorLineBias = 0.2
    //is mouse moving
    var _dragging = false
    //selected object id
    var _selectDbId = 0

    //current point of when mouse is moving 
    var _mouseStPt = new THREE.Vector3(0,0,0);
    //last mouse point
    var _mouseLastPt = new THREE.Vector3(0,0,0);

    //when extension is loaded
    this.load = function() {
        console.log('My2DMove is loaded!');
        //bind keyup event
        $(document).bind('keydown', onKeyUp);
        _viewer.impl.invalidate(true);
        return true;
    };

    //when extension is unloaded 
    this.unload = function() {
        console.log('My2DMove is now unloaded!');
        //unbind keyup event
        $(document).unbind('keyup', this.onKeyUp);
        return true;
    };

    //when key up
    function onKeyUp(evt) {
        console.log('onKeyUp:' + evt.keyCode);

        //when key 'M' is pressed
        if(evt.keyCode === 77){
            if (!isActiveMove) {
                isActiveMove = true;
                //start to monitor mouse down
                _container.addEventListener('click',onMouseClick)
                _viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectObj)
            } else {
                isActiveMove = false;
                _viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectObj)

                //remove mouse events
                _container.removeEventListener('click',onMouseClick);
                _container.removeEventListener('mousemove',onMouseMove);

                _viewer.impl.removeOverlayScene(indicatorLayerName);
                _viewer.impl.invalidate(false, false, true);
                _dragging = false
            }
            
        }

        // //when key 'Q' is pressed
        // if(evt.keyCode === 81){
        //    
        // }
        //
        // //when key 'D' is pressed
        // if(evt.keyCode === 68){
        //     // _viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectObj2)
        // }

        return true;
    }

    function onSelectObj2(evt){
        console.log(evt)

        for(var i in evt.dbIdArray){
            var checkId = evt.dbIdArray[i]
            _viewer.model.visibilityManager.setNodeOff(checkId, true)
        }

        // _selectDbId = evt.dbIdArray[0];
        // _viewer.model.visibilityManager.setNodeOff(_selectDbId, true)
    }

    function onSelectObj(evt){
        console.log(evt)
        _selectDbId = evt.dbIdArray[0]
        _container.addEventListener("mousemove", onMouseMove)
    }

    function onMouseClick(evt) {
        if(!_dragging){
            var pt_3d = _viewer.clientToWorld(evt.clientX,evt.clientY)
            createIndicator(pt_3d.point)
            _dragging = true
        }
    }

    function onMouseMove(evt) {
        if(_dragging){
            //get mouse points 
            var pt_3d = _viewer.clientToWorld(evt.clientX,evt.clientY)
            moveIndicator(pt_3d.point)
        }
    }

    function createIndicator(pt){

        var geometry = new THREE.Geometry ()
        geometry.vertices.push (new THREE.Vector3 ( pt.x - indicatorLineBias,  pt.y,  0))
        geometry.vertices.push (new THREE.Vector3 ( pt.x + indicatorLineBias, pt.y, 0))
        geometry.vertices.push (new THREE.Vector3 ( pt.x, pt.y-indicatorLineBias, 0))
        geometry.vertices.push (new THREE.Vector3 ( pt.x, pt.y+indicatorLineBias, 0))

        var linesMaterial = new THREE.LineBasicMaterial ({
            color: new THREE.Color (0xFF0000),
            transparent: true,
            depthWrite: false,
            depthTest: false,
            linewidth: 3,
            opacity: 1.0
        })

        indicatorLines = new THREE.Line (geometry,
            linesMaterial,
            THREE.LinePieces)

        _viewer.impl.createOverlayScene (indicatorLayerName, linesMaterial)
        _viewer.impl.addOverlay (indicatorLayerName, indicatorLines)
        _viewer.impl.invalidate (false,false,true)

        _mouseLastPt.x  = _mouseStPt.x = pt.x
        _mouseLastPt.y = _mouseStPt.y = pt.y
    }

    function moveIndicator(pt){

        if(indicatorLines != null){

            var diffX = pt.x - _mouseStPt.x
            var diffY = pt.y - _mouseStPt.y

            indicatorLines.position.x = diffX
            indicatorLines.position.y = diffY

            _viewer.impl.invalidate(false, false, true)

            move2DEnt = move2DEnt(_selectDbId,{x:pt.x - _mouseLastPt.x,y:pt.y - _mouseLastPt.y })
            _mouseLastPt = pt
        }


        function move2DEnt(dbId,trans){
            var it = _viewer.model.getData().instanceTree;
            it.enumNodeFragments( dbId, function( fragId ) {
                var m = _viewer.impl.getRenderProxy(_viewer.model, fragId);
                var vbr = new Autodesk.Viewing.Private.VertexBufferReader(m.geometry,
                    _viewer.impl.use2dInstancing);
                vbr.transformObject(dbId,trans);
                m.geometry.vbNeedsUpdate = true;
                _viewer.impl.sceneUpdated()
            });
        }

    }
}

My2DMove.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
My2DMove.prototype.varructor = My2DMove;

Autodesk.Viewing.theExtensionManager.registerExtension('My2DMove', My2DMove);