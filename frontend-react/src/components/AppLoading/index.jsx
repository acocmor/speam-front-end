import React from 'react';
import { Space, Spin } from 'antd';
import classNames from 'classnames/bind';
import styles from './AppLoading.module.scss';

const cx = classNames.bind(styles);

export default function AppLoading() {
    return (
        <div className="full-screen">
            <div className="center-width-height">
                <Spin size="large" className={cx('loading-custom')} />
            </div>
        </div>
    );
}
