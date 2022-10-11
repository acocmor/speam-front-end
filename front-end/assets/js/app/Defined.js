
// function selectCard(item) {
//     const id = item?.id;

//     viewer.dispatchEvent(new CustomEvent('newData', {'detail': item.json}));
// }
function selectCard(MarkupID) {
    if (viewer == null) {
        alert('Please selected file!');
        return;
    }
    
    if (MarkupID === 'all') {
        console.log('pokokokokokokoko')
        selectAll = !selectAll;
        Items.forEach(item => {
            if(item.completed && !selectAll) {
                item.completed = false
                viewer.dispatchEvent(new CustomEvent('removeData', {'detail': item.MarkupID}));
            } else if (!item.completed && selectAll) {
                item.completed = true
                viewer.dispatchEvent(new CustomEvent('newData', {'detail': [item.json, item.MarkupID]}));
            }
            if (selectAll) {
                $(`#check-box-room-${item.MarkupID}`).prop('checked', true);
            } else {
                $(`#check-box-room-${item.MarkupID}`).prop('checked', false);
            }
            
        })
    } else {
        var item = Items.find(o => o.MarkupID === MarkupID);

        if (item) {
            if(item.completed) {
                item.completed = false
                viewer.dispatchEvent(new CustomEvent('removeData', {'detail': item.MarkupID}));
            } else {
                item.completed = true
                viewer.dispatchEvent(new CustomEvent('newData', {'detail': [item.json, item.MarkupID]}));
            }
        }
    }
    

    console.log('choose --------------------: ', item)


}

let arrPoint = [
    {
        "x": 5.477049477951368,
        "y": 0.009862144041107967,
        "z": 0
    },
    {
        "x": 2.4351182434562357,
        "y": 0.00986214404110708,
        "z": 0
    },
    {
        "x": 2.4351182434562357,
        "y": 0.21033693104982287,
        "z": 0
    },
    {
        "x": 2.447797567321686,
        "y": 0.21033693104982287,
        "z": 0
    },
    {
        "x": 5.041707886004588,
        "y": 0.21030065258673858,
        "z": 0
    },
    {
        "x": 5.477049477951368,
        "y": 0.21030065258673858,
        "z": 0
    },
    {
        "x": 5.477049477951368,
        "y": 0.009862144041107967,
        "z": 0
    }
]

function onClickManual() {

    // arrPoint.map(point => {
    //     viewer.dispatchEvent(new CustomEvent('clickManual', {'detail': {startManual: true, isManual: true, MarkupID: 111, x: point.x, y: point.y}}));
    // })

    // rooms.map((room, index) => {
    //     room.MarkupID = index;
    //     room?.CurrentPoints.map(point => {
    //         viewer.dispatchEvent(new CustomEvent('clickManual', {'detail': {startManual: true, isManual: true, MarkupID: index, x: point.x, y: point.y}}));
    //     })
    // })

    rooms.map((room, index) => {
        room.MarkupID = index;
        room?.BoxPoints.map(point => {
            viewer.dispatchEvent(new CustomEvent('clickManual', {'detail': {startManual: true, isManual: true, MarkupID: index, x: point.x, y: point.y}}));
        })
    })
}

function showOriginalRoom() {
    rooms.map((room, index) => {
        room.MarkupID = index;
        room?.CurrentPoints.map(point => {
            viewer.dispatchEvent(new CustomEvent('clickManual', {'detail': {startManual: true, isManual: true, MarkupID: index, x: point.x, y: point.y}}));
        })
    })
}

function loadDataRoom() {
    fetch(`../../../data/rooms3.json`).then(r => r.json()).then( data=> {
        rooms = [];
        data.map(dataRoom => {
            // Lấy toạ độ max, min Model CAD
            let minX = Math.min.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.X; }));
            let minY = Math.min.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.Y; }));
            let maxX = Math.max.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.X; })); 
            let maxY = Math.max.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.Y; })); 

            const width = getLength({x: minX, y: minY}, {x: maxX, y: minY}, dataRoom?.Scale);
            const height = getLength({x: minX, y: minY}, {x: minX, y: maxY}, dataRoom?.Scale);

            const newArr = dataRoom?.BoxPoints.map((point, index) => dataRoom.BoxPoints[index] = mapCoordinates(point))
            const newArrOriginal = dataRoom?.CurrentPoints.map((point, index) => dataRoom.CurrentPoints[index] = mapCoordinates(point))

             // Lấy toạ độ max, min Layer Viewer
            minX = Math.min.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.x; }));
            minY = Math.min.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.y; }));
            maxX = Math.max.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.x; })); 
            maxY = Math.max.apply(Math, dataRoom?.BoxPoints.map(function(o) { return o.y; })); 

            const widthLayer = getLayerLength({x: minX, y: minY}, {x: maxX, y: minY});
            const heightLayer = getLayerLength({x: minX, y: minY}, {x: minX, y: maxY});
            const scaleLength = width / widthLayer;

            newArr.push(dataRoom?.BoxPoints[0])

            // var newArr = uniqBy(newRooms, JSON.stringify)
            rooms.push({
                RoomId: dataRoom?.RoomId,
                BoxPoints: newArr,
                CurrentPoints: newArrOriginal,
                Width: width,
                WidthLayer: widthLayer,
                Height: height,
                HeightLayer: heightLayer,
                MinX: minX,
                MinY: minY,
                MaxX: maxX,
                MaxY: maxY,
                Scale:  dataRoom?.Scale,
                ScaleLength: scaleLength
            })
            console.log(rooms)
        });  
    });
}

function getLayerLength(point1, point2) {
    const vec1 = new THREE.Vector3().set(point1.x, point1.y, 0)
    const vec2 = new THREE.Vector3().set(point2.x, point2.y, 0)
    return vec1.distanceTo(vec2);
}

function getLength(point1, point2, scale) {
    if (scale === null || scale === undefined || scale === 0) scale = 1;
    const vec1 = new THREE.Vector3().set(point1.x, point1.y, 0)
    const vec2 = new THREE.Vector3().set(point2.x, point2.y, 0)
    const length = vec1.distanceTo(vec2);
    const units = viewer.model.getDisplayUnit();
    if (units === 'in') {
        length /= 25.4;
    }
    return (length / scale).toFixed(2);
}

function getLengthFromAPI(length, scale) {
    return length / scale;
}

function uniqBy(a, key) {
    let seen = new Set();
    return a.filter(item => {
        let k = key(item);
        return seen.has(k) ? false : seen.add(k);
    });
}

function mapCoordinates(point) {
    var vpXform = viewer.model.getPageToModelTransform(1);
    var newMatrix = new THREE.Matrix4();
    newMatrix.getInverse(vpXform);
    var modelPt = new THREE.Vector3().set(Math.round(point.X), Math.round(point.Y), Math.round(point.Z));
    var pt = modelPt.applyMatrix4(newMatrix);
    return {x: pt.x, y: pt.y, z: pt.z}
}

function loadDevice() {
    var markup = viewer.getExtension("Autodesk.Viewing.MarkupsCore");
    markup.enterEditMode(); 
    markup.leaveEditMode();
    markup.loadMarkups(_markupdata, 'LogoLayer')      
}


async function onClickLoadEdit2D() {
    try {
        // Load Edit2D extension
    const options = {
        // If true, PolygonTool will create Paths instead of just Polygons. This allows to change segments to arcs.
        enableArcs: true
    };

    const edit2d = await viewer.loadExtension('Autodesk.Edit2D');

    // Register all standard tools in default configuration
    edit2d.registerDefaultTools();

    // Code follows example above
    const ctx = edit2d.defaultContext;

    // {EditLayer} Edit layer containing your shapes
    ctx.layer

    // {EditLayer} An additional layer used by tools to display temporary shapes (e.g. dashed lines for snapping etc.)
    ctx.gizmoLayer

    // {UndoStack} Manages all modifications and tracks undo/redo history
    ctx.undoStack

    // {Selection} Controls selection and hovering highlight
    ctx.selection

    // {Edit2DSnapper} Edit2D snapper
    ctx.snapper

    window.edit2d = viewer.getExtension('Autodesk.Edit2D');
    window.layer  = edit2d.defaultContext.layer;
    window.tools  = edit2d.defaultTools;
    // var box = viewer.model.getBoundingBox();
    // //Create polyline
    // var polyline = new Autodesk.Edit2D.Polyline([
    //     {x: 5, y: 3},
    //     {x: 6, y: 3},
    //     {x: 6, y: 4},
    //     {x: 5, y: 4},
    //     {x: 5, y: 3},
        
    // ]);

    // // Create Edit2D shape from SVG string
    // const svgString = '<path d="M 12.79,21.51 H 18.70 V 18.56 H 12.79 Z"/>';
    // const shape2    = Autodesk.Edit2D.Shape.fromSVG(svgString);

    // // Show it
    // layer.addShape(shape2);

    // console.log('okokokokokokoko')

        return true;
    } catch (err) {
        console.error(err)
        return false;
    }
}

async function drawSVG() {
    const isLoadTool = await onClickLoadEdit2D();
    if (!isLoadTool) return;

    var tool = window.tools.insertSymbolTool;

    const svgString = '<path id="inner-path" class="st1" d="M16,10c-3.3,0-6,2.7-6,6s2.7,6,6,6s6-2.7,6-6S19.3,10,16,10z"/>';
    const shape2    = Autodesk.Edit2D.Shape.fromSVG(svgString);

    shape2.points.push({x:5, y:5})
    shape2.points.push({x:5, y:6})

    tool.symbol=shape2;
    tool.handleSingleClick({canvasX: 500, canvasY: 500})



    console.log('shape2: ', shape2)

    // var tool = window.tools.insertSymbolTool;
    // tool.symbol=shape2;
    // tool.handleSingleClick({canvasX: 500, canvasY: 500})

    // fetch(`../../../data/alarm-device.svg`).then(response => {
    //     console.log('response', response);
    //     return response.text();
    // }).then(data=> {
    //     const svgString = data;
    //     console.log(svgString)

    //     var tool = window.tools.insertSymbolTool;
    //     const shape2 = Autodesk.Edit2D.Shape.fromSVG(svgString);
    //     tool.symbol=shape2;
    //     tool.handleSingleClick({canvasX: 500, canvasY: 500})
    //     // console.log(tool)
    // });

    // const markupExt = this.viewer.getExtension('Autodesk.Viewing.MarkupsCore');
    // markupExt.show();
    // markupExt.enterEditMode();
    // markupExt.changeEditMode(new EditModeStamp(markupExt, customSVG));

    // const svgString = `
    // <svg version="1.1" id="icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    //      width="32px" height="32px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve">
    // <style type="text/css">
    //     .st0{fill:none;}
    //     .st1{opacity:0;}
    // </style>
    // <rect id="_Transparent_Rectangle_" class="st0" width="32" height="32"/>
    // <path d="M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14S23.7,2,16,2z M16,22c-3.3,0-6-2.7-6-6s2.7-6,6-6s6,2.7,6,6S19.3,22,16,22
    //     z"/>
    // <path id="inner-path" class="st1" d="M16,10c-3.3,0-6,2.7-6,6s2.7,6,6,6s6-2.7,6-6S19.3,10,16,10z"/>
    // </svg>
    // `
}

function drawC(position, radius) {

    // var tool2 = window.tools.insertSymbolTool;
    // startTool(tool2)
    // var tool = window.tools.polygonTool;
    var tool = window.tools.insertSymbolTool;
    var style = new  Autodesk.Edit2D.Style();
    var circle = new Autodesk.Edit2D.Circle(0.0, 0.0, radius || 0.5, style.clone(), 42);
    circle.style.lineWidth = 1;

    var polyBase = new Autodesk.Edit2D.PolyBase();
    polyBase.addPoint(1, 1);
    polyBase.addPoint(-1, -1);

    // var circle = new Autodesk.Edit2D.Circle();
    tool.symbol=circle;
    // startTool(tool)

    console.log(tool)
    tool.handleAutoDraw(position)
    // tool.handleSingleClick({canvasX: 500, canvasY: 500})
}

function postAPI() {
    $('#btn-show-result').attr('disabled', 'disabled')
    // var dataRoom = rooms.map(room => ({GUID: room.RoomId, Width: room.Width, Length: room.Height}));

    // var data =  JSON.stringify({
    //     "Rooms": dataRoom
    // });

    // console.log({
    //     "Rooms": dataRoom
    // })

    // console.log('Pushing....')
    // $.ajax({
    //     type:   "POST",
    //     url:    "https://api.kft-edv.de/graebert/request",
    //     data:   data,
    //     headers: {
    //         'Access-Control-Allow-Origin': '*',
    //         'Content-type': 'application/json', 
    //         'Authorization':'Basic 715a8dae-0e69-4aad-b7d4-d767c2890204', 
    //     },
    //     success: function (response) {
    //         console.log('Get data OK!')
    //         console.log(response)
    //         $('#btn-show-result').removeAttr('disabled')
    //     },
    //     error: function (error) {
    //         console.log ("ERROR:", error);
    //     }
    // });
    fetch(`../../../data/result.json`).then(r => r.json()).then(data=> {
        RESULT = data?.Rooms?.map((value, index) => {
            var scale = rooms[index]?.ScaleLength || 1;
            value.DistanceSmokeAlarmXLayer = getLengthFromAPI(value.DistanceSmokeAlarmX, scale);
            value.DistanceSmokeAlarmYLayer = getLengthFromAPI(value.DistanceSmokeAlarmY, scale);
            value.DistanceWallXLayer = getLengthFromAPI(value.DistanceWallX, scale);
            value.DistanceWallYLayer = getLengthFromAPI(value.DistanceWallY, scale);
            value.RadiusLayer = getLengthFromAPI(value.Radius, scale);
            return {...value}
        })
        console.log(RESULT)
        $('#btn-show-result').removeAttr('disabled')
    });
}

async function showResult() {

    const isActive = await onClickLoadEdit2D();

    if (isActive) {
        RESULT.map((coord, index) => {
            const addedDevice = [];
            var room = rooms[index]
            for(i = 0; i < coord.AmountSmokeAlarm; i++) {
                if (i == 0) {
                    const firstDevice = {
                        x: room.MinX + coord.DistanceWallXLayer,
                        y: room.MinY + coord.DistanceWallYLayer,
                        isRight: true
                    }
                    drawC(firstDevice, coord.RadiusLayer)
                    addedDevice.push(firstDevice);
                } else {
                    const beforeCoord = addedDevice[i - 1];
                    if (beforeCoord) {
                        // LOGIC check
                        if (beforeCoord.isRight) {
                            const checkWidthRoom = beforeCoord.x + coord.DistanceSmokeAlarmXLayer;
                            if (checkWidthRoom  < room.MaxX){
                                const nextDevice = {
                                    x: checkWidthRoom,
                                    y: beforeCoord.y,
                                    isRight: true
                                }
                                drawC(nextDevice, coord.RadiusLayer)
                                addedDevice.push(nextDevice)
                            } else {
                                const checkLengthRoom = beforeCoord.y + coord.DistanceSmokeAlarmYLayer;
                                if (checkLengthRoom  < room.MaxY) {
                                    const nextDevice = {
                                        x: beforeCoord.x,
                                        y: checkLengthRoom,
                                        isRight: false
                                    }
                                    drawC(nextDevice, coord.RadiusLayer)
                                    addedDevice.push(nextDevice)
                                }
                            }
                        } else {
                            const checkWidthRoom = beforeCoord.x - coord.DistanceSmokeAlarmXLayer;
                            if (checkWidthRoom > room.MinX){
                                const nextDevice = {
                                    x: checkWidthRoom,
                                    y: beforeCoord.y,
                                    isRight: false
                                }
                                drawC(nextDevice, coord.RadiusLayer)
                                addedDevice.push(nextDevice)
                            } else {
                                const checkLengthRoom = beforeCoord.y + coord.DistanceSmokeAlarmYLayer;
                                if (checkLengthRoom  < room.MaxY) {
                                    const nextDevice = {
                                        x: beforeCoord.x,
                                        y: checkLengthRoom,
                                        isRight: true
                                    }
                                    drawC(nextDevice, coord.RadiusLayer)
                                    addedDevice.push(nextDevice)
                                }
                            }
                        }
                    }
                }
            }
        })
    }
}

function edit() {
    var tool = window.tools.moveTool;
    startTool(tool)
}

function startTool(tool) {

    var controller = viewer.toolController;

    // Check if currently active tool is from Edit2D
    var activeTool = controller.getActiveTool();
    var isEdit2D = activeTool && activeTool.getName().startsWith("Edit2");

    // deactivate any previous edit2d tool
    if (isEdit2D) {
        controller.deactivateTool(activeTool.getName());
        activeTool = null;
    }

    // stop editing tools
    if (!tool) {
        return;
    }

    controller.activateTool(tool.getName());
}