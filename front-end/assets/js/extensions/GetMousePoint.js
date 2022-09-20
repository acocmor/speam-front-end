class GetMousePointExtension extends Autodesk.Viewing.Extension {
    

    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this.tree = null;
        this._container = this.viewer.canvas.parentElement
    }

    load() {
        console.log('GetMousePoint has been loaded');
        this._container.addEventListener('mousemove', this.onMouseMove)
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
        console.log('GetMousePoint has been unloaded');
        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('allGetMousePointExtensionsToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('allGetMousePointExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('GetMousePointExtensionButton');
        this._button.onClick = (ev) => {
            // Execute an action here
            this._container.addEventListener('mousemove', this.onMouseMove)
        };
        this._button.setToolTip('Get Mouse Point Extension');
        this._button.addClass('getMousePointExtensionIcon');
        this._group.addControl(this._button);
    }

    onMouseMove(evt) {
        var pt_3d = viewer.impl.clientToWorld(evt.clientX, evt.clientY)
        console.log('MOVE TO: X', pt_3d.point.x, 'Y', pt_3d.point.y)
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('GetMousePointExtension', GetMousePointExtension);
