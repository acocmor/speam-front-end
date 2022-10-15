import { Button, Checkbox, Col, Form, Input, Row } from 'antd';
import React from 'react';
import classNames from 'classnames/bind';

import styles from './LoginMaster.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

export default function RegisterComponent() {
    const onFinish = (values) => {
        console.log('Success:', values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <div>
            <div className={cx('title-form')}>
                <span>Register</span>
            </div>
            <div>
                <Form
                    className={cx('login-form-custom')}
                    layout="vertical"
                    name="basic"
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
                        autoComplete="none"
                        label="Name"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your full name!',
                            },
                        ]}
                    >
                        <Input className={cx('input-custom')} placeholder="email@website.com" />
                    </Form.Item>
                    <Form.Item
                        autoComplete="none"
                        label="Email"
                        name="email"
                        rules={[
                            {
                                type: 'email',
                                message: 'The input is not valid E-mail!',
                            },
                            {
                                required: true,
                                message: 'Please input your email!',
                            },
                        ]}
                    >
                        <Input className={cx('input-custom')} placeholder="email@website.com" />
                    </Form.Item>

                    <Form.Item
                        autoComplete="none"
                        label="Password"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your password!',
                            },
                        ]}
                    >
                        <Input type="password" className={cx('input-custom')} placeholder="Password" />
                    </Form.Item>

                    <Form.Item
                        autoComplete="none"
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            {
                                required: true,
                                message: 'Please confirm your password!',
                            },
                            ({ getFieldValue }) => ({
                                validator(rule, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject('The two passwords that you entered do not match!');
                                },
                            }),
                        ]}
                    >
                        <Input
                            type="password"
                            className={cx('input-custom')}
                            placeholder="Confirm Password"
                        />

                    </Form.Item>

                    <Form.Item>
                        <Button className={cx('btn-login-custom')} type="primary" size="large" htmlType="submit">
                            Register
                        </Button>
                    </Form.Item>

                    <Form.Item>
                        <p>
                            <span className={cx('text-question')}>Already have an account? </span>
                            <span className={cx('text-underline')}>
                                <Link to="/login" className={cx('text-underline_color')}>
                                    Login
                                </Link>
                            </span>
                        </p>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
