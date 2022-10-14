/* eslint-disable no-undef */
export const initializeViewer = async (urn, getToken) => {
    const token = await getToken();

    const viewerOptions = {
        env: 'AutodeskProduction',
        accessToken: token,
        api: 'derivativeV2',
    };
    var viewerContainer = document.getElementById('viewerContainer');
    var viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerContainer, {});

    Autodesk.Viewing.Initializer(viewerOptions, () => {
        viewer.start();
        Autodesk.Viewing.Document.load(`urn:${urn}`, (doc) => {
            var defaultModel = doc.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, defaultModel);
        });
    });
};
