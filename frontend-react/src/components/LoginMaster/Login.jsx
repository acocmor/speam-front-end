import { Button, Col, Form, Input, Row, Checkbox } from 'antd';
import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './LoginMaster.module.scss';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import cookies from 'js-cookie';

const cx = classNames.bind(styles);

const CustomCheckBox = styled(Checkbox)`
    #basic_remember {
        font-size: 3rem;
    }
    .ant-checkbox-checked::after {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 1px solid var(--primary-color);
        border-radius: 2px;
        visibility: hidden;
        animation: antCheckboxEffect 0.36s ease-in-out;
        animation-fill-mode: backwards;
        content: '';
    }

    .ant-checkbox .ant-checkbox-inner {
        border-color: var(--primary-color);
        width: 20px;
        height: 20px;
    }

    .ant-checkbox-checked .ant-checkbox-inner {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }

    .ant-checkbox-checked .ant-checkbox-inner::before {
        width: 8px;
        top: 11px;
        left: 2px;
        transform: rotate(44deg);
    }

    .ant-checkbox-checked .ant-checkbox-inner::after {
        width: 14px;
        top: 8px;
        left: 5px;
        transform: rotate(-55deg);
        transition: none;
    }

    .ant-checkbox-checked .ant-checkbox-inner::before,
    .ant-checkbox-checked .ant-checkbox-inner::after {
        content: '';
        position: absolute;
        height: 2px;
        background: var(--white);
    }
`;

export default function LoginComponent({ submitForm, submitFailed }) {
    const [form] = Form.useForm();

    const { t } = useTranslation();

    useEffect(() => {
        const rememberAccountStr = cookies.get('account');
        if (rememberAccountStr) {
            try {
                const rememberAccount = JSON.parse(rememberAccountStr);
                form.setFieldsValue({
                    email: rememberAccount.email || '',
                    password: rememberAccount.password || '',
                });
            } catch (err) {}
        }
    }, []);

    const onFinish = (values) => {
        submitForm(values)
    };
    const onFinishFailed = (errorInfo) => {
        submitFailed(errorInfo)
    };

    return (
        <div>
            <div className={cx('title-form')}>
                <span>{t('login')}</span>
            </div>
            <div>
                <Form
                    form={form}
                    className={cx('login-form-custom')}
                    layout="vertical"
                    name="basic"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
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
                        label={t('password')}
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: t('input_your_password_message'),
                            },
                        ]}
                    >
                        <Input type="password" className={cx('input-custom')} placeholder="Password" />
                    </Form.Item>
                    <Row>
                        <Col span={12}>
                            <Form.Item name="remember" valuePropName="checked">
                                <CustomCheckBox checked={true}>{t('remember_me')}</CustomCheckBox>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <p className={cx('text-underline', 'float-right')}>
                                <Link className={cx('text-underline_color')}>{t('forgot_password')}</Link>
                            </p>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Button className='btn-custom btn-custom_full-width' type="primary" size="large" htmlType="submit">
                            {t('login')}
                        </Button>
                    </Form.Item>

                    <Form.Item>
                        <p>
                            <span className={cx('text-question')}>{t('not_registered')} </span>
                            <span className={cx('text-underline')}>
                                <Link to="/register" className={cx('text-underline_color')}>
                                    {t('create_account')}
                                </Link>
                            </span>
                        </p>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
