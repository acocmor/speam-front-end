import React from 'react';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { Link } from 'react-router-dom';
import { Col, Row } from 'antd';
import ChangeLanguage from '~/components/ChangeLanguage';
import UserDropdown from '~/components/UserDropdown';

const cx = classNames.bind(styles);

export default function Header() {
    return (
        <div className={cx('header-container')}>
            <div className="container h-100">
                <div className={cx('header-container__content')}>
                    <div className={cx('header-logo')}>
                        <Link to="/" className={cx('header-logo__brand')}>
                            <img src="./assets/img/logo_new.png" height="30px" alt="Speam Logo" />
                        </Link>
                    </div>
                    <div className={cx('header-info')}>
                    <ChangeLanguage />
                    <UserDropdown />
                        {/* <Row>
                          <Col span={12}>
                           
                          </Col>
                          <Col span={12}>
                           
                          </Col>
                        </Row> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
