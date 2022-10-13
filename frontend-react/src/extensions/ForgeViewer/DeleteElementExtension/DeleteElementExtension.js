import { ForgeExtension } from '@contecht/react-adsk-forge-viewer';

export default class DeleteElementExtension extends ForgeExtension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
    }

    extensionName = 'Autodesk.Measure';

    load() {
        console.log('DeleteExtensions has been loaded');
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
        console.log('DeleteExtensions has been unloaded');
        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('allDeleteExtensionsToolbar');
        if (!this._group) {
            // eslint-disable-next-line no-undef
            this._group = new Autodesk.Viewing.UI.ControlGroup('allDeleteExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        // eslint-disable-next-line no-undef
        this._button = new Autodesk.Viewing.UI.Button('deleteExtensionButton');
        this._button.onClick = (ev) => {
            // Execute an action here
            const selection = this.viewer.getSelection();
            this.viewer.clearSelection();
            // Anything selected?
            if (selection.length > 0) {
                let isolated = [];
                // Iterate through the list of selected dbIds
                selection.forEach((dbId) => {
                    this.viewer.model.visibilityManager.setNodeOff(dbId, true);
                });
            }
        };
        this._button.setToolTip('Delete Extension');
        this._button.addClass('deleteExtensionIcon');
        this._group.addControl(this._button);
    }

    activate() {}

    deactivate() {}
}
