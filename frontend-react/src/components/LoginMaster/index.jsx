import React from 'react';
import { Row, Col } from 'antd';
import classNames from 'classnames/bind';

import styles from './LoginMaster.module.scss';
import ChangeLanguage from '../ChangeLanguage';

const cx = classNames.bind(styles);

export default function LoginMaster({ children }) {
    return (
        <div className={cx('login-master')}>
            <div className={cx('login-master-container')}>
                <Row type="flex">
                    <Col xs={24} sm={24} md={24} lg={12}>
                        <div className={cx('form-container')}>
                            <Row type="flex">
                                <Col span={8}>
                                    <div className={cx('login-master_flash-logo')}>
                                        <svg
                                            height="512"
                                            viewBox="0 0 192 192"
                                            width="512"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="m155.109 74.028a4 4 0 0 0 -3.48-2.028h-52.4l8.785-67.123a4.023 4.023 0 0 0 -7.373-2.614l-63.724 111.642a4 4 0 0 0 3.407 6.095h51.617l-6.962 67.224a4.024 4.024 0 0 0 7.411 2.461l62.671-111.63a4 4 0 0 0 .048-4.027z"></path>
                                        </svg>
                                    </div>
                                </Col>
                                <Col span={6} offset={10}>
                                    <ChangeLanguage />
                                </Col>
                            </Row>
                            {children}
                        </div>
                    </Col>
                    <Col xs={0} sm={0} md={0} lg={12}>
                        <div className={cx('login-master_logo')}>
                            <div className="logo-content">
                                <img src="./assets/img/logo_new.png" alt="Speam Logo" />
                                <div className={cx('logo-title')}>
                                    <h2 className={cx('logo-title_content')}>Speam GmbH</h2>
                                    <p className={cx('logo-title_description')}>Easy and Powerful Project Planning</p>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
