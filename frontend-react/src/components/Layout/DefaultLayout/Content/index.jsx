import React from 'react';
import classNames from 'classnames/bind';
import styles from './Content.module.scss';

const cx = classNames.bind(styles)

export default function Content({ children }) {
    return <div className={cx('content-container')}>{children}</div>;
}
