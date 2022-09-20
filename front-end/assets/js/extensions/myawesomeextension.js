class MyAwesomeExtension extends Autodesk.Viewing.Extension {
    

    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this.tree = null;

        this.processSelection = this.processSelection.bind(this);
        this.findNodeNameById = this.findNodeNameById.bind(this);
        this.getObjectTree = this.getObjectTree.bind(this);
    }

    load() {
        console.log('MyAwesomeExtension has been loaded');
        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.getObjectTree);
        this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.processSelection);
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('MyAwesomeExtension has been unloaded');
        return true;
    }

    getObjectTree() {
        this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.getObjectTree);
        this.tree = this.viewer.model.getData().instanceTree;

    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('allMyAwesomeExtensionsToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('allMyAwesomeExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('myAwesomeExtensionButton');
        this._button.onClick = (ev) => {
            // Execute an action here
        };
        this._button.setToolTip('MyAwesome Extension');
        this._button.addClass('myAwesomeExtensionIcon');
        this._group.addControl(this._button);
    }

    processSelection(event) {
        let nodeData = {};
        const selSet = viewer.getSelection();
        const targetElem = selSet[0];

        if (event.nodeArray.length !== 0) {
            let selectedNode = event.nodeArray[0];

            let it = viewer.model.getData().instanceTree;

            it.enumNodeFragments( selectedNode, function( fragId ) {
                lineCount = 1;
                let m = viewer.impl.getRenderProxy(viewer.model, fragId);
                let vbr = new Autodesk.Viewing.Private.VertexBufferReader(m.geometry, viewer.impl.use2dInstancing);
                vbr.enumGeomsForObject(selectedNode, new GeometryCallback(viewer));
            });

            nodeData.ID = selectedNode;
            nodeData.Name = this.findNodeNameById(selectedNode);
            const pos = this.getPosition(selectedNode)
            console.log("id", nodeData.ID, "Name", nodeData.Name, "X:", pos.x, "Y:", pos.y);
            this.drawLine(pos.x, pos.y, 1)

        }
    }

    addToScene(obj) {
        viewer.impl.addOverlay("DasherSkeletonOverlay", obj);
        viewer.impl.invalidate(false, false, true);
      }

    geometryBetween(pointX, pointY, width) {
        let direction = new THREE.Vector3().subVectors(pointY, pointX);
        let orientation = new THREE.Matrix4();
        orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
        orientation.multiply(new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, 0, 1, 0,
            0, -1, 0, 0,
            0, 0, 0, 1));
        let length = direction.length();
        // let edgeGeometry = new THREE.BoxGeometry(width, length, width, 1, 1, 1);
        let edgeGeometry = new THREE.CylinderGeometry(width, width, length, 8, 1);
        let translate = new THREE.Matrix4().makeTranslation((pointY.x + pointX.x) / 2, (pointY.y + pointX.y) / 2, (pointY.z + pointX.z) / 2);
    
        return [edgeGeometry, translate.multiply(orientation)];
    }

    drawLine(pointX, pointY, radius) {
        let geom = this.geometryBetween(pointX, pointY, radius);
        let edge = new THREE.Mesh(geom[0], this.createLineMaterial());
        edge.applyMatrix(geom[1]);
        this.addToScene(edge);
        return edge;
    }
    
    drawVertex (v, radius) {
        let vertex = new THREE.Mesh(new THREE.SphereGeometry(radius, 20), this.createVertexMaterial());
        vertex.position.set(v.x, v.y, v.z);
        this.addToScene(vertex);
        return vertex;
    }

    createLineMaterial() {
        let material = new THREE.MeshBasicMaterial( { color: 0x00ff00 });
        viewer.impl.matman().addMaterial(
          'dasher-material-line',
          material,
          true);
    
        return material;
    }

    createVertexMaterial() {
        let material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        viewer.impl.matman().addMaterial(
          'dasher-material-vertex',
          material,
          true);
        return material;
      }

    getPosition(objectId) {
        console.log('Geometry', this.viewer.model.getGeometryList());
        const geoList = this.viewer.model.getGeometryList().geoms;
        const readers = [];
        for (const geom of geoList) {
            if (geom) {
                readers.push(new Autodesk.Viewing.Private.VertexBufferReader(geom, viewer.impl.use2dInstancing));
            }
        }
        for (const reader of readers) {
            let result;
            reader.enumGeomsForObject(objectId, {
                onLineSegment: (x, y) => {
                    result = { x, y };
                },
            });

            if (result) {
                return result;
            }
        }
        return {x: 0, y: 0}
    }

    findNodeNameById(nodeId) {
        return this.tree.getNodeName(nodeId);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('MyAwesomeExtension', MyAwesomeExtension);
