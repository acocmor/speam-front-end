import React from 'react';
import classNames from 'classnames/bind';
import styles from './ListFile.module.scss';
import { Col, Row } from 'antd';

const cx = classNames.bind(styles);

export default function ListFile({ files }) {
    return (
        <div className={cx('list-file-container')}>
            <div className={cx('list-file-title')}>
                <h4 className={cx('list-file-title__content')}>All Files</h4>
            </div>
            <div className={cx('list-file-group')}>
                <Row justify="space-around">
                    <Col span={4}>
                        <div className={cx('list-file-group__item')}>
                            <div className={cx('item-thumbnail')}></div>
                        </div>
                    </Col>
                    <Col span={4}>
                        <div className={cx('list-file-group__item')}>
                            <div className={cx('item-thumbnail')}></div>
                        </div>
                    </Col>
                    <Col span={4}>
                        <div className={cx('list-file-group__item')}>
                            <div className={cx('item-thumbnail')}></div>
                        </div>
                    </Col>
                    <Col span={4}>
                        <div className={cx('list-file-group__item')}>
                            <div className={cx('item-thumbnail')}></div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
