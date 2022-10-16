import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import classNames from 'classnames/bind';
import styles from './UserDropdown.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

export default function UserDropdown({ name }) {
    const menuItem = (text, path) => {
        return (
            <div className={cx('menu-item')}>
                <Link to={path} className={cx('menu-item__path')}>
                    {text}
                </Link>
            </div>
        );
    };
    const menu = (
        <Menu
            className={cx('menu-custom')}
            items={[
                {
                    label: menuItem('Account', '/account'),
                    key: '0',
                },
                {
                    label: menuItem('Settings', '/settings'),
                    key: '1',
                },
                {
                    type: 'divider',
                },
                {
                    label: menuItem('Logout', '/logout'),
                    key: '3',
                },
            ]}
        />
    );

    return (
        <Dropdown overlay={menu} trigger={['click']} className={cx('user-dropdown')}>
            <a onClick={(e) => e.preventDefault()}>
                <span className={cx('user-dropdown-name')}>{name || 'User'}</span>
                <DownOutlined />
            </a>
        </Dropdown>
    );
}
