import React, { useCallback } from 'react';
import classNames from 'classnames/bind';
import styles from './Sidebar.module.scss';

const cx = classNames.bind(styles);

export default function Sidebar() {
    const onReloadListFile = useCallback(() => {}, []);

    const onUploadCADFile = useCallback(() => {}, []);

    const onUploadPDFFile = useCallback(() => {}, []);

    return (
        <div className={cx('sidebar-container')}>
            <div className={cx('sidebar-item')}>
                <div className={cx('sidebar-item__title')}>My Documents</div>
                <div className={cx('sidebar-button-group')}>
                    <div
                        className={cx('sidebar-item__button', 'sidebar-item__button-active')}
                        onClick={onReloadListFile}
                    >
                        <i class="fa-solid fa-clock-rotate-left"></i> All Files
                    </div>
                </div>
            </div>

            <div className={cx('sidebar-item')}>
                <div className={cx('sidebar-item__title')}>Import</div>
                <div className={cx('sidebar-button-group')}>
                    <div className={cx('sidebar-item__button')} onClick={onUploadCADFile}>
                        <i class="fa-solid fa-cloud-arrow-up"></i> CAD File
                    </div>
                    <div className={cx('sidebar-item__button')}>
                        <i class="fa-solid fa-cloud-arrow-up" onClick={onUploadPDFFile}></i> PDF File
                    </div>
                </div>
            </div>
        </div>
    );
}
