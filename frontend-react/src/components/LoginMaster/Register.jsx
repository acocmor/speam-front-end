import { Button, Form, Input } from 'antd';
import React, { useEffect } from 'react';
import classNames from 'classnames/bind';

import styles from './LoginMaster.module.scss';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

export default function RegisterComponent({ submitForm, submitFailed }) {
    const { t } = useTranslation();

    const onFinish = (values) => {
        submitForm(values);
    };
    const onFinishFailed = (errorInfo) => {
        submitFailed(errorInfo);
    };

    const confirmPassword = ({ getFieldValue }) => ({
        validator(rule, value) {
            if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
            }
            return Promise.reject(t('password_do_not_match_message'));
        },
    });

    return (
        <div>
            <div className={cx('title-form')}>
                <span>{t('register')}</span>
            </div>
            <div>
                <Form
                    className={cx('login-form-custom')}
                    layout="vertical"
                    name="basic"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
                        autoComplete="none"
                        label={t('name')}
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: t('input_your_name_message'),
                            },
                        ]}
                    >
                        <Input className={cx('input-custom')} placeholder={t('full_name')} />
                    </Form.Item>
                    <Form.Item
                        autoComplete="none"
                        label={t('email')}
                        name="email"
                        rules={[
                            {
                                type: 'email',
                                message: t('not_valid_email_message'),
                            },
                            {
                                required: true,
                                message: t('input_your_email_message'),
                            },
                        ]}
                    >
                        <Input className={cx('input-custom')} placeholder="email@website.com" />
                    </Form.Item>

                    <Form.Item
                        autoComplete="none"
                        label={t('password')}
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: t('input_your_password_message'),
                            },
                        ]}
                    >
                        <Input type="password" className={cx('input-custom')} placeholder={t('password')} />
                    </Form.Item>

                    <Form.Item
                        autoComplete="none"
                        label={t('confirm_password')}
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            {
                                required: true,
                                message: t('confirm_password_message'),
                            },
                            confirmPassword,
                        ]}
                    >
                        <Input type="password" className={cx('input-custom')} placeholder={t('confirm_password')} />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            className="btn-custom btn-custom_full-width"
                            type="primary"
                            size="large"
                            htmlType="submit"
                        >
                            {t('register')}
                        </Button>
                    </Form.Item>

                    <Form.Item>
                        <p>
                            <span className={cx('text-question')}>{t('already_have_an_account')} </span>
                            <span className={cx('text-underline')}>
                                <Link to="/login" className={cx('text-underline_color')}>
                                    {t('login')}
                                </Link>
                            </span>
                        </p>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
