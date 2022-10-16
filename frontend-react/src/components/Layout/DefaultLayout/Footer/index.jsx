import React from 'react';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';

const cx = classNames.bind(styles)

export default function Footer() {
    return (
        <div className={cx('footer-container')}>
        <div className="center-width-height">
            <p className={cx('footer-container__content')}>@ 2022 Speam. All Rights Reserved</p>
        </div></div>
    );
}
