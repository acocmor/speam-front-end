/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import { Dropdown, Menu } from 'antd';
import classNames from 'classnames/bind';
import styles from './ChangeLanguage.module.scss';
import cookies from 'js-cookie';
import i18next from 'i18next';

const cx = classNames.bind(styles);

const languages = [
    {
        code: 'en',
        name: 'English',
        country_code: 'gb',
    },
    {
        code: 'de',
        name: 'Deutschland',
        country_code: 'de',
    },
];

export default function ChangeLanguage() {
    const [menu, setMenu] = useState(null);

    const [select, setSelect] = useState(
        <div className={cx('language-content', 'language-content_border')}>
            <span className="fi fi-de fis"></span>
            <span className={cx('country-name')}>DE</span>
        </div>,
    );

    useEffect(() => {
        const currentLanguageCode = cookies.get('i18next') || 'en';
        const currentLang = languages.find((l) => l.code === currentLanguageCode);

        const newMenu = languages.map((country) => {
            country.key = country.code;
            country.label = getDisplayMenu(country);
            return { ...country };
        });
        setMenu(newMenu);

        if (currentLang) {
            setSelect(getDisplayMenu(currentLang, true));
        }
    }, []);

    const onChangeLanguage = ({ key }) => {
        const newCountry = languages.find((country) => country.code === key);
        if (newCountry) {
            setSelect(getDisplayMenu(newCountry, true));
            i18next.changeLanguage(newCountry.code)
            cookies.set('i18next', newCountry.code)
        }
    };

    const getDisplayMenu = (country, isBorder) => {
        const classNameFlag = `fi fi-${country.country_code} fis`;
        const classNameDiv = isBorder ? cx('language-content', 'language-content_border') : cx('language-content');

        return (
            <div className={classNameDiv}>
                <span className={classNameFlag}></span>
                <span className={cx('country-name')}>{isBorder ? country.code.toUpperCase() : country.name}</span>
            </div>
        );
    };

    return (
        <div>
            <Dropdown overlay={<Menu onClick={onChangeLanguage} items={menu} />} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()}>{select}</a>
            </Dropdown>
        </div>
    );
}
