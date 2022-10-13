import React, { useState } from 'react';
import { ForgeViewer } from '@contecht/react-adsk-forge-viewer';
import classNames from 'classnames/bind';

import styles from './AppViewer.module.scss';
import DeleteElementExtension from '~/extensions/ForgeViewer/DeleteElementExtension/DeleteElementExtension';

const cx = classNames.bind(styles);

export default function AppViewer({token, urn}) {
    const [externalExtensions, setExternalExtensions] = useState([]);

    const onDocumentLoadSuccess = (viewerDocument) => {
        const viewables = viewerDocument.getRoot().search({'type':'geometry'});
	    return viewables.find(v => v.is2D());
    }

    return (
        <ForgeViewer 
            token={token}
            urn={urn} 
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            extensions={[DeleteElementExtension]}
            />
    );
}
