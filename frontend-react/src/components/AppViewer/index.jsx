/* eslint-disable no-undef */
import load from 'load-script';
import React, { useEffect, useState } from 'react';

function AppViewer({ urn, token, pathExternalExtensions }) {
    const [appViewer, setAppViewer] = useState(null);

    useEffect(() => {
        initializeViewer(urn, token);

        return () => {
            if (appViewer) {
                appViewer.finish();
                setAppViewer(null);
                console.log('destroy app viewer');
            }
            Autodesk.Viewing.shutdown();
        };
    }, []);

    const initializeViewer = async (urn, token) => {
        const viewerOptions = {
            env: 'AutodeskProduction',
            getAccessToken: function (onTokenReady) {
                var timeInSeconds = 3600; // Use value provided by Forge Authentication (OAuth) API
                onTokenReady(token, timeInSeconds);
            },
            api: 'derivativeV2',
        };
        var viewerContainer = document.getElementById('forgeViewer');
        var viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerContainer, {});

        Autodesk.Viewing.Initializer(viewerOptions, () => {
            const startedCode = viewer.start(undefined, undefined, undefined, undefined, viewerOptions);
            if (startedCode > 0) {
                console.error('Failed to create a Viewer: WebGL not supported.');
                return;
            } else {
                console.log('load extensions');
                (pathExternalExtensions || []).map((path) => {
                    load(path, (err, script) => {
                        if (err) {
                            console.log('err load measure');
                        } else {
                            console.log('load script ok', script.src);
                        }
                    });
                });

                var tool = viewer.getExtension('Autodesk.Measure');
                console.log('MeasureExtension: ', tool);

                setAppViewer(viewer);
            }

            Autodesk.Viewing.Document.load(`urn:${urn}`, (doc) => {
                var defaultModel = doc.getRoot().getDefaultGeometry();
                viewer.loadDocumentNode(doc, defaultModel);
            });
        });
    };

    return <div id="forgeViewer"></div>;
}

export default AppViewer;
